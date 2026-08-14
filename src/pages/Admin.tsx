import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import { Shield, UserX, UserCheck, Loader2, Check, X } from 'lucide-react';
import { Button } from '../components/ui/button';
import { toast } from 'sonner';

export default function Admin() {
  const { getToken, user } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'users' | 'payments'>('users');

  const { data: users, isLoading: usersLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const token = await getToken();
      const res = await fetch('/api/admin/users', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to fetch users');
      return res.json();
    }
  });

  const { data: payments, isLoading: paymentsLoading } = useQuery({
    queryKey: ['admin-payments'],
    queryFn: async () => {
      const token = await getToken();
      const res = await fetch('/api/admin/payments/pending', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to fetch payments');
      return res.json();
    }
  });

  const toggleMutation = useMutation({
    mutationFn: async (userId: number) => {
      const token = await getToken();
      const res = await fetch(`/api/admin/users/${userId}/toggle`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to toggle access');
      return res.json();
    },
    onSuccess: (updatedUser) => {
      queryClient.setQueryData(['admin-users'], (oldData: any[]) => {
        return oldData.map((u) => u.id === updatedUser.id ? updatedUser : u);
      });
      toast.success(updatedUser.isActive ? 'Access granted' : 'Access revoked');
    },
    onError: () => {
      toast.error('Failed to change user access');
    }
  });

  const approveMutation = useMutation({
    mutationFn: async (paymentId: number) => {
      const token = await getToken();
      const res = await fetch(`/api/admin/payments/${paymentId}/approve`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to approve payment');
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['admin-payments'] });
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success('Payment approved and subscription activated.');
    }
  });

  const rejectMutation = useMutation({
    mutationFn: async ({ paymentId, note }: { paymentId: number, note: string }) => {
      const token = await getToken();
      const res = await fetch(`/api/admin/payments/${paymentId}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ note })
      });
      if (!res.ok) throw new Error('Failed to reject payment');
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['admin-payments'] });
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success('Payment rejected.');
    }
  });

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-100 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <Shield className="h-6 w-6 text-black" /> Admin Dashboard
          </h1>
          <p className="text-gray-500 mt-1">Manage users and pending payments</p>
        </div>
        <div className="flex space-x-2 bg-gray-100 p-1 rounded-lg">
          <button
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === 'users' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            onClick={() => setActiveTab('users')}
          >
            Users
          </button>
          <button
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === 'payments' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            onClick={() => setActiveTab('payments')}
          >
            Payments
            {payments?.length > 0 && (
              <span className="ml-2 inline-flex items-center justify-center bg-red-100 text-red-600 text-xs rounded-full h-5 w-5">
                {payments.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {activeTab === 'users' && (
        <div className="bg-white shadow-sm ring-1 ring-gray-100 rounded-lg overflow-hidden">
          {usersLoading ? (
            <div className="p-8 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-gray-400" /></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50/80 text-gray-500 font-medium">
                  <tr>
                    <th className="px-6 py-4">User</th>
                    <th className="px-6 py-4">Subscription</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {users?.map((u: any) => (
                    <tr key={u.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">{u.email}</div>
                        <div className="text-gray-500 text-xs">{u.uid}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-800 border border-blue-100">
                          {u.subscriptionStatus}
                        </span>
                        {u.subscriptionStatus === 'ACTIVE' && u.subscriptionEndsAt && (
                          <div className="text-xs text-gray-500 mt-1">Ends: {new Date(u.subscriptionEndsAt).toLocaleDateString()}</div>
                        )}
                        {u.subscriptionStatus === 'TRIAL' && (
                          <div className="text-xs text-gray-500 mt-1">{u.trialInvoicesRemaining} invoices left</div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {u.isActive ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                            Revoked
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {u.email !== user?.email && (
                          <Button
                            variant={u.isActive ? "outline" : "default"}
                            size="sm"
                            onClick={() => toggleMutation.mutate(u.id)}
                            disabled={toggleMutation.isPending}
                            className={!u.isActive ? "bg-black hover:bg-gray-800" : "text-red-600 hover:text-red-700 hover:bg-red-50"}
                          >
                            {u.isActive ? (
                              <>
                                <UserX className="h-4 w-4 mr-2" /> Revoke Access
                              </>
                            ) : (
                              <>
                                <UserCheck className="h-4 w-4 mr-2" /> Grant Access
                              </>
                            )}
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {users?.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                        No users found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === 'payments' && (
        <div className="space-y-4">
          {paymentsLoading ? (
            <div className="p-8 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-gray-400" /></div>
          ) : payments?.length === 0 ? (
            <div className="bg-white p-8 text-center rounded-lg shadow-sm ring-1 ring-gray-100 text-gray-500">
              No pending payments.
            </div>
          ) : (
            payments?.map((payment: any) => (
              <div key={payment.id} className="bg-white p-6 rounded-lg shadow-sm ring-1 ring-gray-100 flex flex-col md:flex-row gap-6 items-start">
                <div className="w-full md:w-1/3 bg-gray-50 rounded-lg overflow-hidden border">
                  <a href={payment.screenshotUrl} target="_blank" rel="noopener noreferrer">
                    <img src={payment.screenshotUrl} alt="Payment Screenshot" className="w-full h-auto object-contain cursor-pointer" />
                  </a>
                </div>
                <div className="w-full md:w-2/3 space-y-4">
                  <div>
                    <h3 className="font-medium text-gray-900">Payment for {payment.user?.email}</h3>
                    <p className="text-sm text-gray-500">Submitted at {new Date(payment.submittedAt).toLocaleString()}</p>
                    <p className="text-sm text-gray-500 mt-2 font-medium">Amount: ₹{payment.amount}</p>
                  </div>
                  
                  <div className="flex gap-3 pt-4 border-t border-gray-100">
                    <Button
                      className="bg-green-600 hover:bg-green-700 text-white"
                      onClick={() => approveMutation.mutate(payment.id)}
                      disabled={approveMutation.isPending || rejectMutation.isPending}
                    >
                      <Check className="h-4 w-4 mr-2" /> Approve & Activate
                    </Button>
                    <Button
                      variant="outline"
                      className="text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300"
                      onClick={() => {
                        const note = window.prompt("Reason for rejection:");
                        if (note !== null) {
                          rejectMutation.mutate({ paymentId: payment.id, note });
                        }
                      }}
                      disabled={approveMutation.isPending || rejectMutation.isPending}
                    >
                      <X className="h-4 w-4 mr-2" /> Reject
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
