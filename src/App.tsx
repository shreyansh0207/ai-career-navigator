import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import Home from "./pages/Home";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import DashboardHome from "./pages/DashboardHome";
import CareerMapping from "./pages/CareerMapping";
import SkillRoadmap from "./pages/SkillRoadmap";
import AIInterview from "./pages/AIInterview";
import JobMatching from "./pages/JobMatching";
import MentorConnect from "./pages/MentorConnect";
import NotFound from "./pages/NotFound";
import AiKeyDialog from "./components/AiKeyDialog";
import DemoBadge from "./components/DemoBadge";

const queryClient = new QueryClient();

const basename = import.meta.env.BASE_URL.replace(/\/$/, "");

const ProtectedDashboard = () => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <div className="min-h-screen bg-gradient-subtle" />;
  return user ? <Dashboard /> : <Navigate to="/auth" replace state={{ from: location.pathname }} />;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <BrowserRouter basename={basename} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/dashboard" element={<ProtectedDashboard />}>
              <Route index element={<DashboardHome />} />
              <Route path="career-mapping" element={<CareerMapping />} />
              <Route path="skill-roadmap" element={<SkillRoadmap />} />
              <Route path="ai-interview" element={<AIInterview />} />
              <Route path="job-matching" element={<JobMatching />} />
              <Route path="mentor-connect" element={<MentorConnect />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
          <AiKeyDialog />
          <DemoBadge />
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
