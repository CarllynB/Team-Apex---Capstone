import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/lib/auth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Layout } from "@/components/Layout";
import Home from "./pages/Home";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Events from "./pages/Events";
import EventDetail from "./pages/EventDetail";
import Leaderboard from "./pages/Leaderboard";
import Profile from "./pages/Profile";
import CheckIn from "./pages/CheckIn";
import EventForm from "./pages/EventForm";
import AdminReports from "./pages/AdminReports";
import AdminUsers from "./pages/AdminUsers";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/dashboard" element={<ProtectedRoute><Layout><Dashboard /></Layout></ProtectedRoute>} />
            <Route path="/events" element={<ProtectedRoute><Layout><Events /></Layout></ProtectedRoute>} />
            <Route path="/events/:id" element={<ProtectedRoute><Layout><EventDetail /></Layout></ProtectedRoute>} />
            <Route path="/leaderboard" element={<ProtectedRoute><Layout><Leaderboard /></Layout></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><Layout><Profile /></Layout></ProtectedRoute>} />
            <Route path="/check-in" element={<ProtectedRoute><Layout><CheckIn /></Layout></ProtectedRoute>} />
            <Route path="/events/new" element={<ProtectedRoute requireAdmin><Layout><EventForm /></Layout></ProtectedRoute>} />
            <Route path="/events/:id/edit" element={<ProtectedRoute requireAdmin><Layout><EventForm /></Layout></ProtectedRoute>} />
            <Route path="/admin/reports" element={<ProtectedRoute requireAdmin><Layout><AdminReports /></Layout></ProtectedRoute>} />
            <Route path="/admin/users" element={<ProtectedRoute requireAdmin><Layout><AdminUsers /></Layout></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
