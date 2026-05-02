import { Suspense, lazy } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import PublicRoute from "./components/PublicRoute";
import AuthLayout from "./layouts/AuthLayout";

const CalendarPage = lazy(() => import("./pages/CalendarPage"));
const DashboardPage = lazy(() => import("./pages/DashboardPage"));
const FilesPage = lazy(() => import("./pages/FilesPage"));
const InviteJoin = lazy(() => import("./pages/InviteJoin"));
const LoginPage = lazy(() => import("./pages/LoginPage"));
const MessagesPage = lazy(() => import("./pages/MessagesPage"));
const ProjectDetailsPage = lazy(() => import("./pages/ProjectDetailsPage"));
const ProjectsPage = lazy(() => import("./pages/ProjectsPage"));
const RegisterPage = lazy(() => import("./pages/RegisterPage"));
const SettingsPage = lazy(() => import("./pages/SettingsPage"));
const TasksPage = lazy(() => import("./pages/TasksPage"));
const TeamPage = lazy(() => import("./pages/TeamPage"));

const RouteFallback = () => (
  <div className="flex min-h-screen items-center justify-center bg-ink text-mist">
    <div className="flex items-center gap-3 rounded-xl border border-white/8 bg-slate-950/75 px-5 py-3 shadow-[0_18px_50px_rgba(2,6,23,0.28)]">
      <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-brand-400" />
      <p className="text-sm font-medium text-text-muted">Loading workspace…</p>
    </div>
  </div>
);

function App() {
  return (
    <Suspense fallback={<RouteFallback />}>
      <Routes>
        <Route
          path="/login"
          element={(
            <PublicRoute>
              <LoginPage />
            </PublicRoute>
          )}
        />
        <Route element={<AuthLayout />}>
          <Route
            path="/register"
            element={(
              <PublicRoute>
                <RegisterPage />
              </PublicRoute>
            )}
          />
        </Route>
        <Route path="/invite/:token" element={<InviteJoin />} />
        <Route
          path="/dashboard"
          element={(
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          )}
        />
        <Route
          path="/projects"
          element={(
            <ProtectedRoute>
              <ProjectsPage />
            </ProtectedRoute>
          )}
        />
        <Route
          path="/projects/:projectId"
          element={(
            <ProtectedRoute>
              <ProjectDetailsPage />
            </ProtectedRoute>
          )}
        />
        <Route
          path="/tasks"
          element={(
            <ProtectedRoute>
              <TasksPage />
            </ProtectedRoute>
          )}
        />
        <Route
          path="/settings"
          element={(
            <ProtectedRoute>
              <SettingsPage />
            </ProtectedRoute>
          )}
        />
        <Route
          path="/team"
          element={(
            <ProtectedRoute>
              <TeamPage />
            </ProtectedRoute>
          )}
        />
        <Route
          path="/calendar"
          element={(
            <ProtectedRoute>
              <CalendarPage />
            </ProtectedRoute>
          )}
        />
        <Route
          path="/messages"
          element={(
            <ProtectedRoute>
              <MessagesPage />
            </ProtectedRoute>
          )}
        />
        <Route
          path="/messages/:conversationId"
          element={(
            <ProtectedRoute>
              <MessagesPage />
            </ProtectedRoute>
          )}
        />
        <Route
          path="/files"
          element={(
            <ProtectedRoute>
              <FilesPage />
            </ProtectedRoute>
          )}
        />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Suspense>
  );
}

export default App;
