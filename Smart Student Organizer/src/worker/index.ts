import { Hono } from "hono";
import { cors } from "hono/cors";
import { getCookie, setCookie } from "hono/cookie";
import {
  exchangeCodeForSessionToken,
  getOAuthRedirectUrl,
  authMiddleware,
  deleteSession,
  MOCHA_SESSION_TOKEN_COOKIE_NAME,
} from "@getmocha/users-service/backend";
import {
  CreateTaskSchema,
  UpdateTaskSchema,
  CreateFocusSessionSchema,
  Task,
} from "@/shared/types";

const app = new Hono<{ Bindings: Env }>();

app.use(
  "*",
  cors({
    origin: "*",
    credentials: true,
  })
);

// Auth endpoints
app.get("/api/oauth/google/redirect_url", async (c) => {
  const redirectUrl = await getOAuthRedirectUrl("google", {
    apiUrl: c.env.MOCHA_USERS_SERVICE_API_URL,
    apiKey: c.env.MOCHA_USERS_SERVICE_API_KEY,
  });

  return c.json({ redirectUrl }, 200);
});

app.post("/api/sessions", async (c) => {
  const body = await c.req.json();

  if (!body.code) {
    return c.json({ error: "No authorization code provided" }, 400);
  }

  const sessionToken = await exchangeCodeForSessionToken(body.code, {
    apiUrl: c.env.MOCHA_USERS_SERVICE_API_URL,
    apiKey: c.env.MOCHA_USERS_SERVICE_API_KEY,
  });

  setCookie(c, MOCHA_SESSION_TOKEN_COOKIE_NAME, sessionToken, {
    httpOnly: true,
    path: "/",
    sameSite: "none",
    secure: true,
    maxAge: 60 * 24 * 60 * 60,
  });

  return c.json({ success: true }, 200);
});

app.get("/api/users/me", authMiddleware, async (c) => {
  return c.json(c.get("user"));
});

app.get("/api/logout", async (c) => {
  const sessionToken = getCookie(c, MOCHA_SESSION_TOKEN_COOKIE_NAME);

  if (typeof sessionToken === "string") {
    await deleteSession(sessionToken, {
      apiUrl: c.env.MOCHA_USERS_SERVICE_API_URL,
      apiKey: c.env.MOCHA_USERS_SERVICE_API_KEY,
    });
  }

  setCookie(c, MOCHA_SESSION_TOKEN_COOKIE_NAME, "", {
    httpOnly: true,
    path: "/",
    sameSite: "none",
    secure: true,
    maxAge: 0,
  });

  return c.json({ success: true }, 200);
});

// Task endpoints
app.get("/api/tasks", authMiddleware, async (c) => {
  const user = c.get("user");
  if (!user) return c.json({ error: "Unauthorized" }, 401);

  const { results } = await c.env.DB.prepare(
    "SELECT * FROM tasks WHERE user_id = ? ORDER BY priority DESC, due_date ASC"
  )
    .bind(user.id)
    .all();

  return c.json(results);
});

app.post("/api/tasks", authMiddleware, async (c) => {
  const user = c.get("user");
  if (!user) return c.json({ error: "Unauthorized" }, 401);
  const body = await c.req.json();

  const validation = CreateTaskSchema.safeParse(body);
  if (!validation.success) {
    return c.json({ error: validation.error.issues }, 400);
  }

  const data = validation.data;
  const priority = calculatePriority(data.due_date, data.type);

  const result = await c.env.DB.prepare(
    `INSERT INTO tasks (user_id, title, description, type, due_date, priority, estimated_hours, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`
  )
    .bind(
      user.id,
      data.title,
      data.description || null,
      data.type,
      data.due_date,
      priority,
      data.estimated_hours || null
    )
    .run();

  const task = await c.env.DB.prepare("SELECT * FROM tasks WHERE id = ?")
    .bind(result.meta.last_row_id)
    .first();

  return c.json(task, 201);
});

app.patch("/api/tasks/:id", authMiddleware, async (c) => {
  const user = c.get("user");
  if (!user) return c.json({ error: "Unauthorized" }, 401);
  const taskId = c.req.param("id");
  const body = await c.req.json();

  const validation = UpdateTaskSchema.safeParse(body);
  if (!validation.success) {
    return c.json({ error: validation.error.issues }, 400);
  }

  const task = await c.env.DB.prepare(
    "SELECT * FROM tasks WHERE id = ? AND user_id = ?"
  )
    .bind(taskId, user.id)
    .first<Task>();

  if (!task) {
    return c.json({ error: "Task not found" }, 404);
  }

  const data = validation.data;
  const updates: string[] = [];
  const values: any[] = [];

  if (data.title !== undefined) {
    updates.push("title = ?");
    values.push(data.title);
  }
  if (data.description !== undefined) {
    updates.push("description = ?");
    values.push(data.description || null);
  }
  if (data.type !== undefined) {
    updates.push("type = ?");
    values.push(data.type);
  }
  if (data.due_date !== undefined) {
    updates.push("due_date = ?");
    values.push(data.due_date);
    const priority = calculatePriority(
      data.due_date,
      data.type || task.type
    );
    updates.push("priority = ?");
    values.push(priority);
  }
  if (data.estimated_hours !== undefined) {
    updates.push("estimated_hours = ?");
    values.push(data.estimated_hours);
  }
  if (data.is_completed !== undefined) {
    updates.push("is_completed = ?");
    values.push(data.is_completed ? 1 : 0);
    if (data.is_completed) {
      updates.push("completed_at = CURRENT_TIMESTAMP");
    } else {
      updates.push("completed_at = NULL");
    }
  }

  updates.push("updated_at = CURRENT_TIMESTAMP");
  values.push(taskId, user.id);

  await c.env.DB.prepare(
    `UPDATE tasks SET ${updates.join(", ")} WHERE id = ? AND user_id = ?`
  )
    .bind(...values)
    .run();

  const updatedTask = await c.env.DB.prepare(
    "SELECT * FROM tasks WHERE id = ? AND user_id = ?"
  )
    .bind(taskId, user.id)
    .first();

  return c.json(updatedTask);
});

app.delete("/api/tasks/:id", authMiddleware, async (c) => {
  const user = c.get("user");
  if (!user) return c.json({ error: "Unauthorized" }, 401);
  const taskId = c.req.param("id");

  const task = await c.env.DB.prepare(
    "SELECT * FROM tasks WHERE id = ? AND user_id = ?"
  )
    .bind(taskId, user.id)
    .first();

  if (!task) {
    return c.json({ error: "Task not found" }, 404);
  }

  await c.env.DB.prepare("DELETE FROM tasks WHERE id = ? AND user_id = ?")
    .bind(taskId, user.id)
    .run();

  return c.json({ success: true });
});

// Focus session endpoints
app.get("/api/focus-sessions", authMiddleware, async (c) => {
  const user = c.get("user");
  if (!user) return c.json({ error: "Unauthorized" }, 401);

  const { results } = await c.env.DB.prepare(
    "SELECT * FROM focus_sessions WHERE user_id = ? ORDER BY created_at DESC LIMIT 100"
  )
    .bind(user.id)
    .all();

  return c.json(results);
});

app.post("/api/focus-sessions", authMiddleware, async (c) => {
  const user = c.get("user");
  if (!user) return c.json({ error: "Unauthorized" }, 401);
  const body = await c.req.json();

  const validation = CreateFocusSessionSchema.safeParse(body);
  if (!validation.success) {
    return c.json({ error: validation.error.issues }, 400);
  }

  const data = validation.data;
  const today = new Date().toISOString().split("T")[0];

  const result = await c.env.DB.prepare(
    `INSERT INTO focus_sessions (user_id, task_id, duration_minutes, session_date, created_at, updated_at)
     VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`
  )
    .bind(user.id, data.task_id || null, data.duration_minutes, today)
    .run();

  const session = await c.env.DB.prepare(
    "SELECT * FROM focus_sessions WHERE id = ?"
  )
    .bind(result.meta.last_row_id)
    .first();

  return c.json(session, 201);
});

// Analytics endpoint
app.get("/api/analytics/stats", authMiddleware, async (c) => {
  const user = c.get("user");
  if (!user) return c.json({ error: "Unauthorized" }, 401);

  const totalTasks = await c.env.DB.prepare(
    "SELECT COUNT(*) as count FROM tasks WHERE user_id = ?"
  )
    .bind(user.id)
    .first<{ count: number }>();

  const completedTasks = await c.env.DB.prepare(
    "SELECT COUNT(*) as count FROM tasks WHERE user_id = ? AND is_completed = 1"
  )
    .bind(user.id)
    .first<{ count: number }>();

  const overdueTasks = await c.env.DB.prepare(
    "SELECT COUNT(*) as count FROM tasks WHERE user_id = ? AND is_completed = 0 AND due_date < datetime('now')"
  )
    .bind(user.id)
    .first<{ count: number }>();

  const today = new Date().toISOString().split("T")[0];
  const todayFocusMinutes = await c.env.DB.prepare(
    "SELECT COALESCE(SUM(duration_minutes), 0) as total FROM focus_sessions WHERE user_id = ? AND session_date = ?"
  )
    .bind(user.id, today)
    .first<{ total: number }>();

  return c.json({
    totalTasks: totalTasks?.count || 0,
    completedTasks: completedTasks?.count || 0,
    overdueTasks: overdueTasks?.count || 0,
    todayFocusMinutes: todayFocusMinutes?.total || 0,
  });
});

function calculatePriority(dueDate: string, type: string): number {
  const now = new Date();
  const due = new Date(dueDate);
  const daysUntilDue = Math.ceil(
    (due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  );

  let priority = 50;

  // Urgency factor (based on days until due)
  if (daysUntilDue < 0) {
    priority += 50;
  } else if (daysUntilDue <= 1) {
    priority += 40;
  } else if (daysUntilDue <= 3) {
    priority += 30;
  } else if (daysUntilDue <= 7) {
    priority += 20;
  } else if (daysUntilDue <= 14) {
    priority += 10;
  }

  // Importance factor (based on task type)
  if (type === "exam") {
    priority += 30;
  } else if (type === "project") {
    priority += 20;
  } else if (type === "assignment") {
    priority += 10;
  }

  return Math.min(priority, 100);
}

export default app;
