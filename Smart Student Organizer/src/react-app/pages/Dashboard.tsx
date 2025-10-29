import { useEffect } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "@getmocha/users-service/react";
import { Loader2 } from "lucide-react";
import Header from "@/react-app/components/Header";
import TaskList from "@/react-app/components/TaskList";
import StatsCards from "@/react-app/components/StatsCards";
import PomodoroTimer from "@/react-app/components/PomodoroTimer";
import AlertsPanel from "@/react-app/components/AlertsPanel";
import { TaskProvider } from "@/react-app/hooks/useTaskContext";

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, isPending } = useAuth();

  useEffect(() => {
    if (!user && !isPending) {
      navigate("/");
    }
  }, [user, isPending, navigate]);

  if (isPending || !user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="animate-spin">
          <Loader2 className="w-10 h-10 text-indigo-600" />
        </div>
      </div>
    );
  }

  return (
    <TaskProvider>
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
        <Header />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Welcome back, {user.google_user_data.given_name || "Student"}!
            </h1>
            <p className="text-gray-600">Stay focused and crush your goals today</p>
          </div>

          <StatsCards />

          <AlertsPanel />

          <div className="grid lg:grid-cols-3 gap-8 mt-8">
            <div className="lg:col-span-2">
              <TaskList />
            </div>
            <div className="lg:col-span-1">
              <PomodoroTimer />
            </div>
          </div>
        </main>
      </div>
    </TaskProvider>
  );
}
