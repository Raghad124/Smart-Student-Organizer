import { useState, useEffect, useRef } from "react";
import { Play, Pause, RotateCcw, Coffee, Brain } from "lucide-react";
import { useTaskContext } from "@/react-app/hooks/useTaskContext";

type TimerMode = "focus" | "break";

export default function PomodoroTimer() {
  const { createSession, tasks } = useTaskContext();
  const [mode, setMode] = useState<TimerMode>("focus");
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);
  const intervalRef = useRef<number | null>(null);

  const focusTime = 25 * 60;
  const breakTime = 5 * 60;

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = window.setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            handleTimerComplete();
            return mode === "focus" ? focusTime : breakTime;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning, mode]);

  const handleTimerComplete = async () => {
    setIsRunning(false);

    if (mode === "focus") {
      // Log completed focus session
      try {
        await createSession({
          task_id: selectedTaskId,
          duration_minutes: 25,
        });
      } catch (error) {
        console.error("Failed to log focus session:", error);
      }

      // Switch to break mode
      setMode("break");
      setTimeLeft(breakTime);
      
      // Play completion sound notification (silent fallback if fails)
      try {
        new Audio("data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSyAzvLZiTYIG2m98OScTgwPUKXh8bllHgU2jdb0z3...").play();
      } catch {}
    } else {
      // Switch back to focus mode
      setMode("focus");
      setTimeLeft(focusTime);
    }
  };

  const toggleTimer = () => {
    setIsRunning(!isRunning);
  };

  const resetTimer = () => {
    setIsRunning(false);
    setTimeLeft(mode === "focus" ? focusTime : breakTime);
  };

  const switchMode = (newMode: TimerMode) => {
    setIsRunning(false);
    setMode(newMode);
    setTimeLeft(newMode === "focus" ? focusTime : breakTime);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const progress = ((mode === "focus" ? focusTime : breakTime) - timeLeft) / 
                   (mode === "focus" ? focusTime : breakTime) * 100;

  const activeTasks = tasks.filter(t => t.is_completed === 0);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 sticky top-24">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900">Pomodoro Timer</h2>
        <div className={`p-2 rounded-lg ${
          mode === "focus" ? "bg-indigo-100" : "bg-green-100"
        }`}>
          {mode === "focus" ? (
            <Brain className={`w-5 h-5 ${mode === "focus" ? "text-indigo-600" : "text-green-600"}`} />
          ) : (
            <Coffee className="w-5 h-5 text-green-600" />
          )}
        </div>
      </div>

      <div className="flex space-x-2 mb-6">
        <button
          onClick={() => switchMode("focus")}
          className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            mode === "focus"
              ? "bg-indigo-100 text-indigo-700"
              : "text-gray-600 hover:bg-gray-100"
          }`}
        >
          Focus (25m)
        </button>
        <button
          onClick={() => switchMode("break")}
          className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            mode === "break"
              ? "bg-green-100 text-green-700"
              : "text-gray-600 hover:bg-gray-100"
          }`}
        >
          Break (5m)
        </button>
      </div>

      {mode === "focus" && activeTasks.length > 0 && (
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Working on (optional)
          </label>
          <select
            value={selectedTaskId || ""}
            onChange={(e) => setSelectedTaskId(e.target.value ? Number(e.target.value) : null)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          >
            <option value="">Select a task</option>
            {activeTasks.map((task) => (
              <option key={task.id} value={task.id}>
                {task.title}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="relative mb-6">
        <svg className="w-full h-48" viewBox="0 0 200 200">
          <circle
            cx="100"
            cy="100"
            r="80"
            fill="none"
            stroke="#e5e7eb"
            strokeWidth="12"
          />
          <circle
            cx="100"
            cy="100"
            r="80"
            fill="none"
            stroke={mode === "focus" ? "#4f46e5" : "#10b981"}
            strokeWidth="12"
            strokeDasharray={`${2 * Math.PI * 80}`}
            strokeDashoffset={`${2 * Math.PI * 80 * (1 - progress / 100)}`}
            strokeLinecap="round"
            transform="rotate(-90 100 100)"
            className="transition-all duration-1000"
          />
          <text
            x="100"
            y="100"
            textAnchor="middle"
            dy="0.3em"
            className="text-4xl font-bold fill-gray-900"
          >
            {formatTime(timeLeft)}
          </text>
        </svg>
      </div>

      <div className="flex space-x-3">
        <button
          onClick={toggleTimer}
          className={`flex-1 flex items-center justify-center space-x-2 px-4 py-3 rounded-lg font-medium transition-colors ${
            mode === "focus"
              ? "bg-indigo-600 hover:bg-indigo-700 text-white"
              : "bg-green-600 hover:bg-green-700 text-white"
          }`}
        >
          {isRunning ? (
            <>
              <Pause className="w-5 h-5" />
              <span>Pause</span>
            </>
          ) : (
            <>
              <Play className="w-5 h-5" />
              <span>Start</span>
            </>
          )}
        </button>
        <button
          onClick={resetTimer}
          className="px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <RotateCcw className="w-5 h-5" />
        </button>
      </div>

      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <p className="text-sm text-gray-600">
          {mode === "focus" ? (
            <>
              <strong className="text-gray-900">Focus Mode:</strong> Work with full concentration for 25 minutes
            </>
          ) : (
            <>
              <strong className="text-gray-900">Break Mode:</strong> Take a 5-minute break to recharge
            </>
          )}
        </p>
      </div>
    </div>
  );
}
