import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Vehicles from "./pages/Vehicles";
import NotFound from "./pages/NotFound";
import OwnerDashboard from "./pages/owner/OwnerDashboard";
import OwnerVehicles from "./pages/owner/OwnerVehicles";
import AddVehicle from "./pages/owner/AddVehicle";
import VehicleDetails from "./pages/owner/VehicleDetails";
import OwnerBookings from "./pages/owner/OwnerBookings";
import OwnerEarnings from "./pages/owner/OwnerEarnings";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/vehicles" element={<Vehicles />} />
          <Route path="/dashboard" element={<Dashboard />} />
          
          {/* Owner Routes */}
          <Route path="/owner/dashboard" element={<OwnerDashboard />} />
          <Route path="/owner/vehicles" element={<OwnerVehicles />} />
          <Route path="/owner/vehicles/new" element={<AddVehicle />} />
          <Route path="/owner/vehicles/edit/:id" element={<AddVehicle />} />
          <Route path="/owner/vehicles/:id" element={<VehicleDetails />} />
          <Route path="/owner/bookings" element={<OwnerBookings />} />
          <Route path="/owner/earnings" element={<OwnerEarnings />} />
          
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
