import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { Toaster } from './components/ui/sonner';
import LoadingScreen from './components/LoadingScreen';
import Layout from './components/Layout';
import SubscriptionGate from './components/SubscriptionGate';

// ENTERPRISE: Lazy load all route pages for code-splitting and faster load times
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Login = lazy(() => import('./pages/Login'));
const CreateBill = lazy(() => import('./pages/CreateBill'));
const ReviewOCR = lazy(() => import('./pages/ReviewOCR'));
const Landing = lazy(() => import('./pages/Landing'));
const InvoicePreview = lazy(() => import('./pages/InvoicePreview'));
const BillsList = lazy(() => import('./pages/BillsList'));
const Customers = lazy(() => import('./pages/Customers'));
const Settings = lazy(() => import('./pages/Settings'));
const Admin = lazy(() => import('./pages/Admin'));
const Onboarding = lazy(() => import('./pages/Onboarding'));
const Payment = lazy(() => import('./pages/Payment'));

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

// SECURITY (MED-01): Only SUPER_ADMIN users can access the Admin page
function AdminGuard() {
  const { dbUser, loading } = useAuth();
  
  if (loading) {
    return <LoadingScreen message="Verifying access..." />;
  }
  
  if (!dbUser || dbUser.role !== 'SUPER_ADMIN') {
    return <Navigate to="/dashboard" replace />;
  }
  
  return <Admin />;
}

export default function App() {
  return (
    <Router>
      <Suspense fallback={<LoadingScreen message="Loading page..." />}>
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
            <Route path="admin" element={<AdminGuard />} />
          </Route>

          <Route path="/onboarding" element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />
          <Route path="/payment" element={<ProtectedRoute><Payment /></ProtectedRoute>} />
        </Routes>
      </Suspense>
      <Toaster />
    </Router>
  );
}

