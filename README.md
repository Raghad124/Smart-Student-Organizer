# Smart-Student-Organizer
Smart task management app for students with intelligent alerts and Pomodoro timer.
#Authentication & Access:

Users sign in through Google OAuth using Mocha's secure authentication system
Once authenticated, they access a personalized dashboard with their name displayed
Core Task Management:

Students can create tasks with titles, descriptions, types (assignment/exam/project), due dates, priorities (1-5), and estimated hours
Tasks are displayed in a filterable list (all/active/completed) with visual priority indicators
Each task shows due date, priority level, estimated time, and completion status
Tasks can be marked complete, edited, or deleted directly from the list
Smart Alerts System:

Automatically generates intelligent notifications based on task analysis:
Red alerts for overdue tasks with days past due
Orange alerts for tasks due within 24 hours  
Blue alerts suggesting when to start working on large tasks (based on estimated hours vs. days remaining)
Green alerts celebrating achievements (every 5 completed tasks, focus milestones)
Alerts are dismissible and the panel can be collapsed/expanded
Priority-based organization ensures most urgent items appear first
Pomodoro Timer Integration:

Built-in 25-minute focus sessions with 5-minute breaks
Users can link focus sessions to specific tasks for better tracking
Visual circular progress indicator with time remaining
Automatic session logging to database when focus periods complete
Switch between focus and break modes with different visual themes
Statistics Dashboard:

Real-time stats showing total tasks, completed tasks, completion rate, and daily focus minutes
Data pulls from both tasks and focus_sessions database tables
Motivational metrics to encourage productivity
Database Structure:

Tasks table: stores all task information with user association
Focus_sessions table: logs Pomodoro sessions with duration and task association
User data tied to authenticated Google account ID for privacy and data separation
User Experience Flow:

Sign in → Dashboard loads with personalized greeting
View current stats and smart alerts at top
Browse/filter tasks in main section
Use Pomodoro timer on right side for focused work
Complete tasks and track progress over time
Receive intelligent suggestions and deadline reminders
The app automatically saves all data and provides a comprehensive productivity system specifically designed for student workflows with assignments, exams, and projects.
