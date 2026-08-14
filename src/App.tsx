import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { Toaster } from './components/ui/sonner';

// Lazy load pages for performance (we can just import them directly for simplicity if they are small)
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import CreateBill from './pages/CreateBill';
import ReviewOCR from './pages/ReviewOCR';
import Layout from './components/Layout';
import Landing from './pages/Landing';
import LoadingScreen from './components/LoadingScreen';
import InvoicePreview from './pages/InvoicePreview';
import BillsList from './pages/BillsList';
import Customers from './pages/Customers';
import Settings from './pages/Settings';
import Admin from './pages/Admin';
import Onboarding from './pages/Onboarding';
import Payment from './pages/Payment';
import SubscriptionGate from './components/SubscriptionGate';

// A simple protected route wrapper
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <LoadingScreen message="Verifying session..." />;
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        <Route path="/" element={<Landing />} />
        
        <Route element={<ProtectedRoute><SubscriptionGate><Layout /></SubscriptionGate></ProtectedRoute>}>
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="bills" element={<BillsList />} />
          <Route path="bills/create" element={<CreateBill />} />
          <Route path="bills/review" element={<ReviewOCR />} />
          <Route path="bills/preview" element={<InvoicePreview />} />
          <Route path="customers" element={<Customers />} />
          <Route path="settings" element={<Settings />} />
          <Route path="admin" element={<Admin />} />
        </Route>

        <Route path="/onboarding" element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />
        <Route path="/payment" element={<ProtectedRoute><Payment /></ProtectedRoute>} />
      </Routes>
      <Toaster />
    </Router>
  );
}
