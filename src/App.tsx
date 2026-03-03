import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import VerifyEmail from "./pages/VerifyEmail";
import Services from "./pages/Services";
import ProviderDetail from "./pages/ProviderDetail";
import Dashboard from "./pages/Dashboard";
import ProviderDashboard from "./pages/ProviderDashboard";
import CustomerProfile from "./pages/CustomerProfile";
import ProviderProfile from "./pages/ProviderProfile";
import HowItWorks from "./pages/HowItWorks";
import NotFound from "./pages/NotFound";
import AIAnalyzer from "./pages/AIAnalyzer";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminOverview from "./pages/admin/AdminOverview";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminProviders from "./pages/admin/AdminProviders";
import AdminBookings from "./pages/admin/AdminBookings";
import AdminCategories from "./pages/admin/AdminCategories";
import ProviderServices from "./pages/provider/ProviderServices";
import ProviderBookings from "./pages/provider/ProviderBookings";
import ProviderEarnings from "./pages/provider/ProviderEarnings";
import ProviderMessages from "./pages/provider/ProviderMessages";
import ProviderNotifications from "./pages/provider/ProviderNotifications";
import ProviderSettings from "./pages/provider/ProviderSettings";
import CustomerBookings from "./pages/dashboard/CustomerBookings";
import CustomerNotifications from "./pages/dashboard/CustomerNotifications";
import CustomerPayments from "./pages/dashboard/CustomerPayments";
import CustomerSettings from "./pages/dashboard/CustomerSettings";
import CustomerChat from "./pages/dashboard/CustomerChat";
import CustomerFavorites from "./pages/dashboard/CustomerFavorites";
import ReferralProgram from "./pages/dashboard/ReferralProgram";
import AdminDisputes from "./pages/admin/AdminDisputes";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <LanguageProvider>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/verify-email" element={<VerifyEmail />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/services" element={<Services />} />
                <Route path="/provider/:id" element={<ProviderDetail />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/dashboard/profile" element={<CustomerProfile />} />
                <Route path="/dashboard/bookings" element={<CustomerBookings />} />
                <Route path="/dashboard/notifications" element={<CustomerNotifications />} />
                <Route path="/dashboard/payments" element={<CustomerPayments />} />
                <Route path="/dashboard/messages" element={<CustomerChat />} />
                <Route path="/dashboard/settings" element={<CustomerSettings />} />
                <Route path="/dashboard/favorites" element={<CustomerFavorites />} />
                <Route path="/dashboard/referrals" element={<ReferralProgram />} />
                <Route path="/dashboard/chat/:providerId?" element={<CustomerChat />} />
                <Route path="/provider-dashboard" element={<ProviderDashboard />} />
                <Route path="/provider-dashboard/profile" element={<ProviderProfile />} />
                <Route path="/provider-dashboard/services" element={<ProviderServices />} />
                <Route path="/provider-dashboard/bookings" element={<ProviderBookings />} />
                <Route path="/provider-dashboard/earnings" element={<ProviderEarnings />} />
                <Route path="/provider-dashboard/messages" element={<ProviderMessages />} />
                <Route path="/provider-dashboard/notifications" element={<ProviderNotifications />} />
                <Route path="/provider-dashboard/settings" element={<ProviderSettings />} />
                <Route path="/how-it-works" element={<HowItWorks />} />
                <Route path="/become-provider" element={<Navigate to="/register?role=provider" replace />} />
                <Route path="/ai-analyzer" element={<AIAnalyzer />} />
                
                {/* Admin Routes */}
                <Route path="/admin" element={<AdminDashboard />}>
                  <Route index element={<AdminOverview />} />
                  <Route path="users" element={<AdminUsers />} />
                  <Route path="providers" element={<AdminProviders />} />
                  <Route path="bookings" element={<AdminBookings />} />
                  <Route path="categories" element={<AdminCategories />} />
                  <Route path="disputes" element={<AdminDisputes />} />
                </Route>
                
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
