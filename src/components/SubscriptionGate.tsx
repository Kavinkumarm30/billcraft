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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-[#9b9b9b] to-[#f5f5f5] p-4">
        <div className="text-center p-8 bg-white rounded-xl shadow-sm border max-w-md">
          <h2 className="text-xl font-bold mb-2 text-gray-900">Connecting to Profile...</h2>
          <p className="text-gray-600 text-xs mb-6">Synchronizing your organization session. If this takes more than a few seconds, click below to refresh.</p>
          <div className="flex gap-2 justify-center">
            <button 
              onClick={() => window.location.reload()} 
              className="inline-flex h-9 px-4 shrink-0 items-center justify-center rounded-lg bg-black text-white hover:bg-gray-800 text-xs font-semibold transition-all"
            >
              Retry Connection
            </button>
            <button 
              onClick={() => {
                sessionStorage.clear();
                window.location.href = '/login';
              }} 
              className="inline-flex h-9 px-4 shrink-0 items-center justify-center rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 text-xs font-semibold transition-all"
            >
              Switch Account
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Super admins bypass all checks
  if (dbUser.role === 'SUPER_ADMIN') {
    return <>{children}</>;
  }

  const { subscriptionStatus, trialInvoicesRemaining } = dbUser;

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
