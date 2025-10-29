import { useState } from "react";
import { AlertTriangle, Clock, CheckCircle2, X, Bell, BellOff } from "lucide-react";
import { useTaskContext } from "@/react-app/hooks/useTaskContext";

interface Alert {
  id: string;
  type: "overdue" | "due_soon" | "start_working" | "achievement";
  title: string;
  message: string;
  taskId?: number;
  priority: "high" | "medium" | "low";
}

export default function AlertsPanel() {
  const { tasks, stats } = useTaskContext();
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(new Set());
  const [isExpanded, setIsExpanded] = useState(true);

  const generateAlerts = (): Alert[] => {
    const alerts: Alert[] = [];
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

    // Check for overdue tasks
    const overdueTasks = tasks.filter(task => 
      !task.is_completed && new Date(task.due_date) < now
    );

    overdueTasks.forEach(task => {
      const daysPast = Math.floor((now.getTime() - new Date(task.due_date).getTime()) / (1000 * 60 * 60 * 24));
      alerts.push({
        id: `overdue-${task.id}`,
        type: "overdue",
        title: "Overdue Task",
        message: `${task.title} was due ${daysPast === 0 ? 'today' : `${daysPast} day${daysPast > 1 ? 's' : ''} ago`}`,
        taskId: task.id,
        priority: "high"
      });
    });

    // Check for tasks due soon
    const dueSoonTasks = tasks.filter(task => 
      !task.is_completed && 
      new Date(task.due_date) >= now && 
      new Date(task.due_date) <= tomorrow
    );

    dueSoonTasks.forEach(task => {
      const hoursUntilDue = Math.floor((new Date(task.due_date).getTime() - now.getTime()) / (1000 * 60 * 60));
      alerts.push({
        id: `due-soon-${task.id}`,
        type: "due_soon",
        title: "Due Tomorrow",
        message: `${task.title} is due in ${hoursUntilDue < 24 ? `${hoursUntilDue} hours` : 'less than 24 hours'}`,
        taskId: task.id,
        priority: "high"
      });
    });

    // Check for tasks that should be started
    const upcomingTasks = tasks.filter(task => 
      !task.is_completed && 
      task.estimated_hours &&
      new Date(task.due_date) > tomorrow && 
      new Date(task.due_date) <= threeDaysFromNow
    );

    upcomingTasks.forEach(task => {
      if (task.estimated_hours) {
        const daysUntilDue = Math.ceil((new Date(task.due_date).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        const hoursPerDay = task.estimated_hours / Math.max(daysUntilDue - 1, 1);
        
        if (hoursPerDay > 2) { // Suggest starting if requires more than 2 hours per day
          alerts.push({
            id: `start-working-${task.id}`,
            type: "start_working",
            title: "Consider Starting",
            message: `${task.title} (${task.estimated_hours}h) is due in ${daysUntilDue} days. Consider starting soon!`,
            taskId: task.id,
            priority: "medium"
          });
        }
      }
    });

    // Achievement alerts
    if (stats.completedTasks > 0 && stats.completedTasks % 5 === 0) {
      alerts.push({
        id: `achievement-${stats.completedTasks}`,
        type: "achievement",
        title: "Great Progress!",
        message: `You've completed ${stats.completedTasks} tasks! Keep up the excellent work!`,
        priority: "low"
      });
    }

    if (stats.todayFocusMinutes >= 120) { // 2+ hours of focus today
      alerts.push({
        id: `focus-achievement-${Math.floor(stats.todayFocusMinutes / 60)}`,
        type: "achievement",
        title: "Focus Champion!",
        message: `You've focused for ${Math.floor(stats.todayFocusMinutes / 60)} hours today. Excellent dedication!`,
        priority: "low"
      });
    }

    return alerts.filter(alert => !dismissedAlerts.has(alert.id));
  };

  const alerts = generateAlerts();
  const highPriorityAlerts = alerts.filter(a => a.priority === "high");
  const mediumPriorityAlerts = alerts.filter(a => a.priority === "medium");
  const lowPriorityAlerts = alerts.filter(a => a.priority === "low");

  const dismissAlert = (alertId: string) => {
    setDismissedAlerts(prev => new Set([...prev, alertId]));
  };

  const getAlertIcon = (type: Alert["type"]) => {
    switch (type) {
      case "overdue":
        return <AlertTriangle className="w-5 h-5 text-red-600" />;
      case "due_soon":
        return <Clock className="w-5 h-5 text-orange-600" />;
      case "start_working":
        return <Clock className="w-5 h-5 text-blue-600" />;
      case "achievement":
        return <CheckCircle2 className="w-5 h-5 text-green-600" />;
    }
  };

  const getAlertColors = (type: Alert["type"]) => {
    switch (type) {
      case "overdue":
        return "bg-red-50 border-red-200 text-red-800";
      case "due_soon":
        return "bg-orange-50 border-orange-200 text-orange-800";
      case "start_working":
        return "bg-blue-50 border-blue-200 text-blue-800";
      case "achievement":
        return "bg-green-50 border-green-200 text-green-800";
    }
  };

  if (alerts.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden mb-6">
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Bell className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Smart Alerts</h2>
            <p className="text-sm text-gray-600">
              {alerts.length} notification{alerts.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
        >
          {isExpanded ? <BellOff className="w-5 h-5" /> : <Bell className="w-5 h-5" />}
        </button>
      </div>

      {isExpanded && (
        <div className="max-h-80 overflow-y-auto">
          {/* High Priority Alerts */}
          {highPriorityAlerts.map((alert) => (
            <div
              key={alert.id}
              className={`p-4 border-l-4 border-l-red-500 ${getAlertColors(alert.type)} flex items-start justify-between`}
            >
              <div className="flex items-start space-x-3">
                {getAlertIcon(alert.type)}
                <div>
                  <h3 className="font-medium text-sm">{alert.title}</h3>
                  <p className="text-sm mt-1">{alert.message}</p>
                </div>
              </div>
              <button
                onClick={() => dismissAlert(alert.id)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}

          {/* Medium Priority Alerts */}
          {mediumPriorityAlerts.map((alert) => (
            <div
              key={alert.id}
              className={`p-4 border-l-4 border-l-blue-500 ${getAlertColors(alert.type)} flex items-start justify-between`}
            >
              <div className="flex items-start space-x-3">
                {getAlertIcon(alert.type)}
                <div>
                  <h3 className="font-medium text-sm">{alert.title}</h3>
                  <p className="text-sm mt-1">{alert.message}</p>
                </div>
              </div>
              <button
                onClick={() => dismissAlert(alert.id)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}

          {/* Low Priority Alerts */}
          {lowPriorityAlerts.map((alert) => (
            <div
              key={alert.id}
              className={`p-4 border-l-4 border-l-green-500 ${getAlertColors(alert.type)} flex items-start justify-between`}
            >
              <div className="flex items-start space-x-3">
                {getAlertIcon(alert.type)}
                <div>
                  <h3 className="font-medium text-sm">{alert.title}</h3>
                  <p className="text-sm mt-1">{alert.message}</p>
                </div>
              </div>
              <button
                onClick={() => dismissAlert(alert.id)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
