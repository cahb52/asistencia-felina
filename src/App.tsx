
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
import { useEffect } from "react";
// Import the Capacitor core first, then conditionally use the App
import { Capacitor } from '@capacitor/core';
// Only import App if we're in a native platform
let CapacitorApp: any = null;
if (Capacitor.isNativePlatform()) {
  import('@capacitor/app').then(module => {
    CapacitorApp = module.App;
  }).catch(err => {
    console.error('Error loading @capacitor/app:', err);
  });
}

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Attendance from "./pages/Attendance";
import Students from "./pages/Students";
import Courses from "./pages/Courses";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const AppContent = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Only add the back button listener if running on a mobile device and CapacitorApp is loaded
    if (Capacitor.isNativePlatform() && CapacitorApp) {
      const handleBackButton = () => {
        const currentPath = window.location.pathname;
        
        if (currentPath === '/dashboard') {
          CapacitorApp.exitApp();
        } else if (currentPath === '/') {
          CapacitorApp.exitApp();
        } else {
          navigate(-1);
        }
      };

      let backButtonListener: any = null;
      try {
        backButtonListener = CapacitorApp.addListener('backButton', handleBackButton);
      } catch (error) {
        console.error('Error adding back button listener:', error);
      }

      return () => {
        if (backButtonListener) {
          try {
            backButtonListener.then((listener: any) => listener.remove())
              .catch((err: any) => console.error('Error removing listener:', err));
          } catch (error) {
            console.error('Error cleaning up back button listener:', error);
          }
        }
      };
    }
  }, [navigate]);

  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/attendance" element={<Attendance />} />
      <Route path="/students" element={<Students />} />
      <Route path="/courses" element={<Courses />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <AppContent />
      </TooltipProvider>
    </BrowserRouter>
  </QueryClientProvider>
);

export default App;
