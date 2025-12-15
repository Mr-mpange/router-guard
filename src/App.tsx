import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Routers from "./pages/Routers";
import Sessions from "./pages/Sessions";
import Packages from "./pages/Packages";
import Payments from "./pages/Payments";
import Settings from "./pages/Settings";
import CaptivePortal from "./pages/CaptivePortal";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/routers" element={<Routers />} />
          <Route path="/sessions" element={<Sessions />} />
          <Route path="/packages" element={<Packages />} />
          <Route path="/payments" element={<Payments />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/portal" element={<CaptivePortal />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
