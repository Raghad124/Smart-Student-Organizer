import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { Task, FocusSession } from "@/shared/types";

interface TaskContextValue {
  tasks: Task[];
  sessions: FocusSession[];
  stats: {
    totalTasks: number;
    completedTasks: number;
    overdueTasks: number;
    todayFocusMinutes: number;
  };
  isLoading: boolean;
  fetchTasks: () => Promise<void>;
  fetchSessions: () => Promise<void>;
  fetchStats: () => Promise<void>;
  createTask: (data: any) => Promise<void>;
  updateTask: (id: number, data: any) => Promise<void>;
  deleteTask: (id: number) => Promise<void>;
  createSession: (data: any) => Promise<void>;
}

const TaskContext = createContext<TaskContextValue | undefined>(undefined);

export function TaskProvider({ children }: { children: ReactNode }) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [sessions, setSessions] = useState<FocusSession[]>([]);
  const [stats, setStats] = useState({
    totalTasks: 0,
    completedTasks: 0,
    overdueTasks: 0,
    todayFocusMinutes: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  const fetchTasks = async () => {
    try {
      const response = await fetch("/api/tasks", { credentials: "include" });
      if (response.ok) {
        const data = await response.json();
        setTasks(data);
      }
    } catch (error) {
      console.error("Failed to fetch tasks:", error);
    }
  };

  const fetchSessions = async () => {
    try {
      const response = await fetch("/api/focus-sessions", { credentials: "include" });
      if (response.ok) {
        const data = await response.json();
        setSessions(data);
      }
    } catch (error) {
      console.error("Failed to fetch sessions:", error);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch("/api/analytics/stats", { credentials: "include" });
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error("Failed to fetch stats:", error);
    }
  };

  const createTask = async (data: any) => {
    const response = await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error("Failed to create task");
    }

    await Promise.all([fetchTasks(), fetchStats()]);
  };

  const updateTask = async (id: number, data: any) => {
    const response = await fetch(`/api/tasks/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error("Failed to update task");
    }

    await Promise.all([fetchTasks(), fetchStats()]);
  };

  const deleteTask = async (id: number) => {
    const response = await fetch(`/api/tasks/${id}`, {
      method: "DELETE",
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error("Failed to delete task");
    }

    await Promise.all([fetchTasks(), fetchStats()]);
  };

  const createSession = async (data: any) => {
    const response = await fetch("/api/focus-sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error("Failed to create session");
    }

    await Promise.all([fetchSessions(), fetchStats()]);
  };

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await Promise.all([fetchTasks(), fetchSessions(), fetchStats()]);
      setIsLoading(false);
    };
    loadData();
  }, []);

  return (
    <TaskContext.Provider
      value={{
        tasks,
        sessions,
        stats,
        isLoading,
        fetchTasks,
        fetchSessions,
        fetchStats,
        createTask,
        updateTask,
        deleteTask,
        createSession,
      }}
    >
      {children}
    </TaskContext.Provider>
  );
}

export function useTaskContext() {
  const context = useContext(TaskContext);
  if (!context) {
    throw new Error("useTaskContext must be used within TaskProvider");
  }
  return context;
}
