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
import About from "./pages/About";
import WhyUs from "./pages/WhyUs";
import Gallery from "./pages/Gallery";
import Blog from "./pages/Blog";
import Contact from "./pages/Contact";
import AdminDashboard from "./pages/admin/AdminDashboard";
import ManageDrivers from "./pages/admin/ManageDrivers";
import ManageVehicles from "./pages/admin/ManageVehicles";
import ManageFleetOwners from "./pages/admin/ManageFleetOwners";
import ManageCategories from "./pages/admin/ManageCategories";
import ManageSubcategories from "./pages/admin/ManageSubcategories";
import Analytics from "./pages/admin/Analytics";
import ComplianceMonitoring from "./pages/admin/ComplianceMonitoring";
import PendingApprovals from "./pages/admin/PendingApprovals";
import ManageHeroSlider from "./pages/admin/ManageHeroSlider";
import CompanyDocumentVerification from "./pages/admin/CompanyDocumentVerification";
import CreateTestData from "./pages/admin/CreateTestData";
import BlogPost from "./pages/BlogPost";
import ManageBlog from "./pages/admin/ManageBlog";
import OwnerDashboard from "./pages/owner/OwnerDashboard";
import OwnerVehicles from "./pages/owner/OwnerVehicles";
import AddVehicle from "./pages/owner/AddVehicle";
import VehicleDetails from "./pages/owner/VehicleDetails";
import OwnerBookings from "./pages/owner/OwnerBookings";
import OwnerEarnings from "./pages/owner/OwnerEarnings";
import DriverDashboard from "./pages/driver/DriverDashboard";
import DriverProfile from "./pages/driver/DriverProfile";
import DriverTrips from "./pages/driver/DriverTrips";
import DriverRegister from "./pages/driver/DriverRegister";
import PendingInvitations from "./pages/driver/PendingInvitations";
import ManageEmptyLegs from "./pages/driver/ManageEmptyLegs";
import CompanySetup from "./pages/owner/CompanySetup";
import InviteDriver from "./pages/owner/InviteDriver";
import BrowseEmptyLegs from "./pages/BrowseEmptyLegs";
import CreateBidRequest from "./pages/client/CreateBidRequest";
import MyBidRequests from "./pages/client/MyBidRequests";
import ViewBids from "./pages/client/ViewBids";
import BrowseBidRequests from "./pages/driver/BrowseBidRequests";
import SubmitBid from "./pages/driver/SubmitBid";

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
          <Route path="/empty-legs" element={<BrowseEmptyLegs />} />
          <Route path="/about" element={<About />} />
          <Route path="/why-us" element={<WhyUs />} />
          <Route path="/gallery" element={<Gallery />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/blog/:slug" element={<BlogPost />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/dashboard" element={<Dashboard />} />
          
          {/* Admin Routes */}
            <Route path="/admin" element={<AdminDashboard />}>
              <Route path="approvals" element={<PendingApprovals />} />
              <Route path="company-documents" element={<CompanyDocumentVerification />} />
              <Route path="drivers" element={<ManageDrivers />} />
              <Route path="vehicles" element={<ManageVehicles />} />
              <Route path="fleet-owners" element={<ManageFleetOwners />} />
              <Route path="categories" element={<ManageCategories />} />
              <Route path="subcategories" element={<ManageSubcategories />} />
              <Route path="hero-slider" element={<ManageHeroSlider />} />
              <Route path="analytics" element={<Analytics />} />
              <Route path="compliance" element={<ComplianceMonitoring />} />
              <Route path="test-data" element={<CreateTestData />} />
              <Route path="blog" element={<ManageBlog />} />
            </Route>
          
          {/* Owner Routes */}
          <Route path="/owner/dashboard" element={<OwnerDashboard />} />
          <Route path="/owner/vehicles" element={<OwnerVehicles />} />
          <Route path="/owner/vehicles/new" element={<AddVehicle />} />
          <Route path="/owner/vehicles/edit/:id" element={<AddVehicle />} />
          <Route path="/owner/vehicles/:id" element={<VehicleDetails />} />
          <Route path="/owner/bookings" element={<OwnerBookings />} />
          <Route path="/owner/earnings" element={<OwnerEarnings />} />
          
          {/* Driver Routes */}
          <Route path="/driver/register" element={<DriverRegister />} />
          <Route path="/driver/dashboard" element={<DriverDashboard />} />
          <Route path="/driver/profile" element={<DriverProfile />} />
          <Route path="/driver/trips" element={<DriverTrips />} />
          <Route path="/driver/invitations" element={<PendingInvitations />} />
          <Route path="/driver/empty-legs" element={<ManageEmptyLegs />} />
          <Route path="/driver/bid-requests" element={<BrowseBidRequests />} />
          <Route path="/driver/submit-bid/:requestId" element={<SubmitBid />} />
          
          {/* Client Routes */}
          <Route path="/client/create-bid-request" element={<CreateBidRequest />} />
          <Route path="/client/bid-requests" element={<MyBidRequests />} />
          <Route path="/client/bid-request/:requestId" element={<ViewBids />} />
          
          {/* Owner Additional Routes */}
          <Route path="/owner/company-setup" element={<CompanySetup />} />
          <Route path="/owner/invite-driver" element={<InviteDriver />} />
          
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
