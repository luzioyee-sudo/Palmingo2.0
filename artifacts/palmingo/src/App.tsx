import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppShell } from "@/components/AppShell";
import { AuthProvider, useAuth } from "@/lib/auth";
import { I18nProvider } from "@/lib/i18n";
import { useEffect, type ReactNode } from "react";

import Landing from "@/pages/Landing";
import Login from "@/pages/Login";
import Onboarding from "@/pages/Onboarding";
import Home from "@/pages/Home";
import Flashcards from "@/pages/Flashcards";
import Tutor from "@/pages/Tutor";
import Dictionary from "@/pages/Dictionary";
import Videos from "@/pages/Videos";
import ProgressPage from "@/pages/Progress";
import Chunks from "@/pages/Chunks";
import Profile from "@/pages/Profile";
import Settings from "@/pages/Settings";
import Friends from "@/pages/Friends";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient();

function Redirect({ to }: { to: string }) {
  const [, navigate] = useLocation();
  useEffect(() => { navigate(to, { replace: true }); }, []);
  return null;
}

function AuthGuard({ children, skipOnboarding = false }: { children: ReactNode; skipOnboarding?: boolean }) {
  const { user } = useAuth();
  const [location] = useLocation();
  if (!user) return <Redirect to={`/login?next=${encodeURIComponent(location)}`} />;
  if (!skipOnboarding && !user.onboardingComplete) return <Redirect to="/onboarding" />;
  return <>{children}</>;
}

function AppRouter() {
  const { user } = useAuth();

  return (
    <Switch>
      {/* Public */}
      <Route path="/">
        {user ? <Redirect to="/home" /> : <Landing />}
      </Route>
      <Route path="/login">
        {user ? <Redirect to="/home" /> : <Login />}
      </Route>

      {/* Onboarding — auth required, no AppShell */}
      <Route path="/onboarding">
        <AuthGuard skipOnboarding>
          <Onboarding />
        </AuthGuard>
      </Route>

      {/* Authenticated — with AppShell */}
      <Route>
        <AuthGuard>
          <AppShell>
            <Switch>
              <Route path="/home" component={Home} />

              {/* Flashcards — 3 sub-routes, all handled by the same component */}
              <Route path="/flashcards/:deckId/study" component={Flashcards} />
              <Route path="/flashcards/:deckId" component={Flashcards} />
              <Route path="/flashcards" component={Flashcards} />

              <Route path="/laxa" component={Tutor} />
              <Route path="/tutor"><Redirect to="/laxa" /></Route>
              <Route path="/dictionary" component={Dictionary} />
              <Route path="/videos" component={Videos} />
              <Route path="/progress" component={ProgressPage} />
              <Route path="/chunks" component={Chunks} />
              <Route path="/friends" component={Friends} />
              <Route path="/profile" component={Profile} />
              <Route path="/settings" component={Settings} />
              <Route component={NotFound} />
            </Switch>
          </AppShell>
        </AuthGuard>
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <I18nProvider>
      <AuthProvider>
        <QueryClientProvider client={queryClient}>
          <TooltipProvider>
            <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
              <AppRouter />
            </WouterRouter>
            <Toaster />
          </TooltipProvider>
        </QueryClientProvider>
      </AuthProvider>
    </I18nProvider>
  );
}

export default App;
