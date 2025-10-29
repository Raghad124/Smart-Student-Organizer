import z from "zod";

export const TaskTypeSchema = z.enum(['assignment', 'project', 'exam', 'other']);
export type TaskType = z.infer<typeof TaskTypeSchema>;

export const TaskSchema = z.object({
  id: z.number(),
  user_id: z.string(),
  title: z.string(),
  description: z.string().nullable(),
  type: TaskTypeSchema,
  due_date: z.string(),
  priority: z.number(),
  estimated_hours: z.number().nullable(),
  is_completed: z.number().int(),
  completed_at: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});

export type Task = z.infer<typeof TaskSchema>;

export const CreateTaskSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  type: TaskTypeSchema,
  due_date: z.string(),
  estimated_hours: z.number().positive().optional(),
});

export const UpdateTaskSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().optional(),
  type: TaskTypeSchema.optional(),
  due_date: z.string().optional(),
  estimated_hours: z.number().positive().optional(),
  is_completed: z.boolean().optional(),
});

export const FocusSessionSchema = z.object({
  id: z.number(),
  user_id: z.string(),
  task_id: z.number().nullable(),
  duration_minutes: z.number(),
  session_date: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
});

export type FocusSession = z.infer<typeof FocusSessionSchema>;

export const CreateFocusSessionSchema = z.object({
  task_id: z.number().optional(),
  duration_minutes: z.number().positive(),
});
