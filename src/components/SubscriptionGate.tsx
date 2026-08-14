import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import LoadingScreen from './LoadingScreen';

export default function SubscriptionGate({ children }: { children: React.ReactNode }) {
  const { dbUser, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <LoadingScreen message="Verifying subscription..." />;
  }

  if (!dbUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center p-8 bg-white rounded-xl shadow-sm border max-w-md">
          <h2 className="text-2xl font-bold mb-2 text-gray-900">Error Loading Profile</h2>
          <p className="text-gray-600 mb-6">We could not load your account information. The server might be unreachable or your session is invalid.</p>
          <button onClick={() => window.location.href = '/login'} className="inline-flex h-10 px-4 py-2 shrink-0 items-center justify-center rounded-lg bg-black text-white hover:bg-gray-800 text-sm font-medium transition-all">
            Return to Login
          </button>
        </div>
      </div>
    );
  }

  // Super admins bypass all checks
  if (dbUser.role === 'SUPER_ADMIN') {
    return <>{children}</>;
  }

  const { subscriptionStatus, trialInvoicesRemaining, onboardingCompleted } = dbUser;

  if (!onboardingCompleted && location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" replace />;
  }

  if (subscriptionStatus === 'PENDING_VERIFICATION' && location.pathname !== '/payment') {
     return <Navigate to="/payment" replace />;
  }
  
  if (subscriptionStatus === 'EXPIRED' || subscriptionStatus === 'REJECTED') {
     if (location.pathname !== '/payment') {
       return <Navigate to="/payment" replace />;
     }
  }

  // TRIAL with no remaining invoices
  if (subscriptionStatus === 'TRIAL' && trialInvoicesRemaining <= 0) {
     if (location.pathname !== '/payment') {
       return <Navigate to="/payment" replace />;
     }
  }

  return <>{children}</>;
}
