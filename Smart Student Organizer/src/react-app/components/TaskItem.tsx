import { useState } from "react";
import { Check, Trash2, Calendar, Clock } from "lucide-react";
import { Task } from "@/shared/types";
import { useTaskContext } from "@/react-app/hooks/useTaskContext";

interface TaskItemProps {
  task: Task;
}

export default function TaskItem({ task }: TaskItemProps) {
  const { updateTask, deleteTask } = useTaskContext();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleToggleComplete = async () => {
    try {
      await updateTask(task.id, { is_completed: !task.is_completed });
    } catch (error) {
      console.error("Failed to update task:", error);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this task?")) return;
    
    setIsDeleting(true);
    try {
      await deleteTask(task.id);
    } catch (error) {
      console.error("Failed to delete task:", error);
      setIsDeleting(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return "Overdue";
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Tomorrow";
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const getPriorityColor = (priority: number) => {
    if (priority >= 80) return "bg-red-100 text-red-700";
    if (priority >= 60) return "bg-orange-100 text-orange-700";
    if (priority >= 40) return "bg-yellow-100 text-yellow-700";
    return "bg-green-100 text-green-700";
  };

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      exam: "bg-purple-100 text-purple-700",
      project: "bg-blue-100 text-blue-700",
      assignment: "bg-indigo-100 text-indigo-700",
      other: "bg-gray-100 text-gray-700",
    };
    return colors[type] || colors.other;
  };

  const isOverdue = new Date(task.due_date) < new Date() && !task.is_completed;

  return (
    <div className={`p-4 hover:bg-gray-50 transition-colors ${isDeleting ? "opacity-50" : ""}`}>
      <div className="flex items-start space-x-4">
        <button
          onClick={handleToggleComplete}
          className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
            task.is_completed
              ? "bg-green-500 border-green-500"
              : "border-gray-300 hover:border-green-500"
          }`}
        >
          {task.is_completed && <Check className="w-4 h-4 text-white" />}
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3
              className={`font-medium ${
                task.is_completed ? "text-gray-400 line-through" : "text-gray-900"
              }`}
            >
              {task.title}
            </h3>
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="flex-shrink-0 p-1 text-gray-400 hover:text-red-600 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>

          {task.description && (
            <p className="text-sm text-gray-600 mt-1">{task.description}</p>
          )}

          <div className="flex flex-wrap items-center gap-2 mt-3">
            <span className={`px-2 py-1 rounded-md text-xs font-medium ${getTypeColor(task.type)}`}>
              {task.type.charAt(0).toUpperCase() + task.type.slice(1)}
            </span>
            <span className={`px-2 py-1 rounded-md text-xs font-medium ${getPriorityColor(task.priority)}`}>
              Priority {task.priority}
            </span>
            <span
              className={`flex items-center space-x-1 px-2 py-1 rounded-md text-xs font-medium ${
                isOverdue ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-700"
              }`}
            >
              <Calendar className="w-3 h-3" />
              <span>{formatDate(task.due_date)}</span>
            </span>
            {task.estimated_hours && (
              <span className="flex items-center space-x-1 px-2 py-1 bg-gray-100 text-gray-700 rounded-md text-xs font-medium">
                <Clock className="w-3 h-3" />
                <span>{task.estimated_hours}h</span>
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
