import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/contexts/AuthContext';
import { ApiError } from '@/lib/api';
import { ThemeProvider } from '@/components/theme-provider';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { AdminGuard } from '@/components/AdminGuard';
import { Toaster } from 'sonner';

const AppLayout = lazy(async () => {
  const module = await import('@/layouts/AppLayout');
  return { default: module.AppLayout };
});

const LoginPage = lazy(async () => {
  const module = await import('@/pages/LoginPage');
  return { default: module.LoginPage };
});

const SignupPage = lazy(async () => {
  const module = await import('@/pages/SignupPage');
  return { default: module.SignupPage };
});

const ForgotPasswordPage = lazy(async () => {
  const module = await import('@/pages/ForgotPasswordPage');
  return { default: module.ForgotPasswordPage };
});

const ResetPasswordPage = lazy(async () => {
  const module = await import('@/pages/ResetPasswordPage');
  return { default: module.ResetPasswordPage };
});

const AuthCallbackPage = lazy(async () => {
  const module = await import('@/pages/AuthCallbackPage');
  return { default: module.AuthCallbackPage };
});

const InboxPage = lazy(async () => {
  const module = await import('@/pages/InboxPage');
  return { default: module.InboxPage };
});

const TodayPage = lazy(async () => {
  const module = await import('@/pages/TodayPage');
  return { default: module.TodayPage };
});

const UpcomingPage = lazy(async () => {
  const module = await import('@/pages/UpcomingPage');
  return { default: module.UpcomingPage };
});

const RegionsPage = lazy(async () => {
  const module = await import('@/pages/RegionsPage');
  return { default: module.RegionsPage };
});

const ProjectsPage = lazy(async () => {
  const module = await import('@/pages/ProjectsPage');
  return { default: module.ProjectsPage };
});

const ProjectDetailPage = lazy(async () => {
  const module = await import('@/pages/ProjectDetailPage');
  return { default: module.ProjectDetailPage };
});

const HabitsPage = lazy(async () => {
  const module = await import('@/pages/HabitsPage');
  return { default: module.HabitsPage };
});

const ProgressPage = lazy(async () => {
  const module = await import('@/pages/ProgressPage');
  return { default: module.ProgressPage };
});

const StatsPage = lazy(async () => {
  const module = await import('@/pages/StatsPage');
  return { default: module.StatsPage };
});

const HistoryPage = lazy(async () => {
  const module = await import('@/pages/HistoryPage');
  return { default: module.HistoryPage };
});

const ProfilePage = lazy(async () => {
  const module = await import('@/pages/ProfilePage');
  return { default: module.ProfilePage };
});

const SettingsPage = lazy(async () => {
  const module = await import('@/pages/SettingsPage');
  return { default: module.SettingsPage };
});

const AdminSettings = lazy(async () => {
  const module = await import('@/pages/admin/AdminSettings');
  return { default: module.AdminSettings };
});

function RouteLoader() {
  return <div className="flex min-h-svh items-center justify-center">Loading...</div>;
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      gcTime: 1000 * 60 * 10,
      retry: (failureCount, error) => {
        if (error instanceof ApiError && error.status < 500) {
          return false;
        }
        return failureCount < 2;
      },
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
        <BrowserRouter>
          <AuthProvider>
            <Suspense fallback={<RouteLoader />}>
              <Routes>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/signup" element={<SignupPage />} />
                <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                <Route path="/reset-password" element={<ResetPasswordPage />} />
                <Route
                  path="/realms/:realmName/authentication/reset-password"
                  element={<ResetPasswordPage />}
                />
                <Route
                  path="/realms/:realmName/overview"
                  element={<Navigate to="/login" replace />}
                />
                <Route path="/auth/callback" element={<AuthCallbackPage />} />

                <Route
                  element={
                    <ProtectedRoute>
                      <AppLayout />
                    </ProtectedRoute>
                  }
                >
                  <Route path="/" element={<Navigate to="/inbox" replace />} />
                  <Route path="/inbox" element={<InboxPage />} />
                  <Route path="/today" element={<TodayPage />} />
                  <Route path="/upcoming" element={<UpcomingPage />} />
                  <Route path="/regions" element={<RegionsPage />} />
                  <Route path="/projects" element={<ProjectsPage />} />
                  <Route path="/projects/:id" element={<ProjectDetailPage />} />
                  <Route path="/habits" element={<HabitsPage />} />
                  <Route path="/progress" element={<ProgressPage />} />
                  <Route path="/stats" element={<StatsPage />} />
                  <Route path="/history" element={<HistoryPage />} />
                  <Route path="/profile" element={<ProfilePage />} />
                  <Route path="/settings" element={<SettingsPage />} />
                  <Route
                    path="/admin"
                    element={
                      <AdminGuard>
                        <AdminSettings />
                      </AdminGuard>
                    }
                  />
                </Route>
              </Routes>
            </Suspense>
          </AuthProvider>
        </BrowserRouter>
        <Toaster theme="system" position="bottom-center" richColors />
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
