import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import { Shield, UserX, UserCheck, Loader2, Check, X, LayoutTemplate, ExternalLink, Sparkles, FileText, CheckCircle2 } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Label } from '../components/ui/label';
import { toast } from 'sonner';
import { predefinedLayouts } from './Settings';

export default function Admin() {
  const { getToken, user } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'users' | 'payments' | 'custom-layouts'>('users');

  // Custom layout builder modal state for Admin
  const [selectedRequest, setSelectedRequest] = useState<any | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [selectedLayoutForUser, setSelectedLayoutForUser] = useState<string>('orange-classic');
  const [isDesignModalOpen, setIsDesignModalOpen] = useState(false);

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

  const { data: customLayoutRequests, isLoading: customRequestsLoading } = useQuery({
    queryKey: ['admin-custom-layouts'],
    queryFn: async () => {
      const token = await getToken();
      const res = await fetch('/api/admin/custom-layouts/pending', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to fetch custom layout requests');
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
    onSuccess: () => {
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-payments'] });
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success('Payment rejected.');
    }
  });

  const approveLayoutMutation = useMutation({
    mutationFn: async ({ requestId, invoiceLayout }: { requestId: number, invoiceLayout?: any }) => {
      const token = await getToken();
      const res = await fetch(`/api/admin/custom-layouts/${requestId}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ invoiceLayout })
      });
      if (!res.ok) throw new Error('Failed to approve custom layout');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-custom-layouts'] });
      setIsDesignModalOpen(false);
      setSelectedRequest(null);
      toast.success('Custom layout created & access granted to the user!');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to approve custom layout');
    }
  });

  const rejectLayoutMutation = useMutation({
    mutationFn: async ({ requestId, note }: { requestId: number, note: string }) => {
      const token = await getToken();
      const res = await fetch(`/api/admin/custom-layouts/${requestId}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ note })
      });
      if (!res.ok) throw new Error('Failed to reject custom layout');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-custom-layouts'] });
      toast.success('Custom layout request rejected.');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to reject custom layout');
    }
  });

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-100 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <Shield className="h-6 w-6 text-black" /> Admin Control Dashboard
          </h1>
          <p className="text-gray-500 mt-1">Manage users, payment approvals, and custom layout design requests</p>
        </div>
        <div className="flex space-x-2 bg-gray-100 p-1 rounded-xl">
          <button
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors ${activeTab === 'users' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            onClick={() => setActiveTab('users')}
          >
            Users
          </button>
          <button
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 ${activeTab === 'payments' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            onClick={() => setActiveTab('payments')}
          >
            Payments
            {payments?.length > 0 && (
              <span className="inline-flex items-center justify-center bg-red-100 text-red-600 text-xs rounded-full h-5 w-5 font-bold">
                {payments.length}
              </span>
            )}
          </button>
          <button
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 ${activeTab === 'custom-layouts' ? 'bg-white text-purple-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            onClick={() => setActiveTab('custom-layouts')}
          >
            <LayoutTemplate className="w-3.5 h-3.5 text-purple-600" />
            Custom Layout Requests
            {customLayoutRequests?.length > 0 && (
              <span className="inline-flex items-center justify-center bg-purple-100 text-purple-700 text-xs rounded-full h-5 w-5 font-bold">
                {customLayoutRequests.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* 1. USERS TAB */}
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
                        <div className="text-gray-500 text-xs">{u.name || u.role}</div>
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

      {/* 2. PAYMENTS TAB */}
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

      {/* 3. CUSTOM LAYOUT REQUESTS TAB (ADMIN BUILDS & GRANTS ACCESS) */}
      {activeTab === 'custom-layouts' && (
        <div className="space-y-4">
          {customRequestsLoading ? (
            <div className="p-8 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-gray-400" /></div>
          ) : customLayoutRequests?.length === 0 ? (
            <div className="bg-white p-12 text-center rounded-2xl shadow-sm border border-gray-100 space-y-2">
              <CheckCircle2 className="w-10 h-10 text-green-500 mx-auto" />
              <h3 className="text-base font-bold text-gray-900">No Pending Custom Layout Requests</h3>
              <p className="text-xs text-gray-500">When users upload custom bill designs in Settings, they will appear here for you to design and grant access.</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {customLayoutRequests?.map((req: any) => (
                <div key={req.id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 flex flex-col lg:flex-row gap-6 items-start">
                  
                  {/* Uploaded Design Thumbnail */}
                  <div className="w-full lg:w-1/4 bg-gray-50 rounded-xl overflow-hidden border border-gray-200 group relative">
                    <img 
                      src={req.fileUrl} 
                      alt="Custom Design" 
                      className="w-full h-48 object-contain cursor-pointer transition-transform group-hover:scale-105" 
                      onClick={() => setPreviewImage(req.fileUrl)}
                    />
                    <button
                      type="button"
                      onClick={() => setPreviewImage(req.fileUrl)}
                      className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs font-bold gap-1 transition-opacity"
                    >
                      <ExternalLink className="w-4 h-4" /> View Full Image
                    </button>
                  </div>

                  {/* Request Information */}
                  <div className="w-full lg:w-3/4 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 pb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
                            PENDING REVIEW
                          </span>
                          <h3 className="font-bold text-base text-gray-900">
                            Organization: {req.organization?.name || 'User Organization'}
                          </h3>
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">
                          Requested by: <span className="font-semibold text-gray-700">{req.user?.name || req.user?.email}</span> ({req.user?.email})
                        </p>
                      </div>
                      <span className="text-xs text-gray-400 font-mono">
                        Submitted: {new Date(req.submittedAt).toLocaleString()}
                      </span>
                    </div>

                    <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
                      <Label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">User's Notes & Instructions:</Label>
                      <p className="text-xs text-gray-800 mt-1 italic">
                        "{req.note || 'No specific instructions provided.'}"
                      </p>
                    </div>

                    {/* Admin Actions */}
                    <div className="flex flex-wrap items-center gap-3 pt-2">
                      <Button
                        onClick={() => {
                          setSelectedRequest(req);
                          setCustomLayoutDesign(defaultCanvaDesign);
                          setIsDesignModalOpen(true);
                        }}
                        className="bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-sm"
                      >
                        <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                        Design & Grant Custom Layout
                      </Button>

                      <Button
                        variant="outline"
                        onClick={() => approveLayoutMutation.mutate({ requestId: req.id })}
                        disabled={approveLayoutMutation.isPending}
                        className="border-green-300 text-green-700 hover:bg-green-50 text-xs font-bold"
                      >
                        <Check className="w-3.5 h-3.5 mr-1 text-green-600" />
                        Quick Grant Access
                      </Button>

                      <Button
                        variant="outline"
                        onClick={() => {
                          const note = window.prompt("Reason for rejecting custom layout request:");
                          if (note !== null) {
                            rejectLayoutMutation.mutate({ requestId: req.id, note });
                          }
                        }}
                        disabled={rejectLayoutMutation.isPending}
                        className="border-red-200 text-red-600 hover:bg-red-50 text-xs"
                      >
                        <X className="w-3.5 h-3.5 mr-1" />
                        Reject Request
                      </Button>
                    </div>

                  </div>

                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Full Image Preview Modal */}
      <Dialog open={!!previewImage} onOpenChange={() => setPreviewImage(null)}>
        <DialogContent className="max-w-4xl p-2 bg-black/90">
          <div className="flex justify-center p-4">
            {previewImage && (
              <img src={previewImage} alt="Full Preview" className="max-h-[80vh] object-contain rounded" />
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Admin Design & Grant Access Builder Modal */}
      <Dialog open={isDesignModalOpen} onOpenChange={setIsDesignModalOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-gray-900 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-600" />
              Craft Custom Layout for {selectedRequest?.organization?.name || selectedRequest?.user?.email}
            </DialogTitle>
            <DialogDescription className="text-xs text-gray-500">
              Select or customize the invoice design format to grant specifically to this organization.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Reference user upload */}
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 space-y-2">
                <Label className="text-xs font-bold text-gray-700">User's Uploaded Reference:</Label>
                <div className="h-44 bg-white rounded-lg border flex items-center justify-center overflow-hidden">
                  {selectedRequest?.fileUrl && (
                    <img src={selectedRequest.fileUrl} alt="Reference" className="max-h-full object-contain" />
                  )}
                </div>
                <p className="text-[11px] text-gray-500 italic">"{selectedRequest?.note}"</p>
              </div>

              {/* Template Style Choice */}
              <div className="space-y-2">
                <Label className="text-xs font-bold text-gray-700">Assign Layout Format to Organization:</Label>
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {predefinedLayouts.map((tpl) => (
                    <div 
                      key={tpl.id}
                      onClick={() => {
                        setSelectedLayoutForUser(tpl.id);
                        toast.success(`Selected "${tpl.name}" format for user`);
                      }}
                      className={`p-2.5 rounded-xl border cursor-pointer transition-all text-xs ${
                        selectedLayoutForUser === tpl.id 
                          ? 'border-purple-600 bg-purple-50 ring-1 ring-purple-600' 
                          : 'border-gray-200 hover:border-purple-400 bg-white'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-gray-900">{tpl.name}</span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 text-gray-700">
                          {tpl.badge}
                        </span>
                      </div>
                      <p className="text-[10px] text-gray-500 mt-0.5">{tpl.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setIsDesignModalOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (!selectedRequest) return;
                approveLayoutMutation.mutate({
                  requestId: selectedRequest.id,
                  invoiceLayout: selectedLayoutForUser
                });
              }}
              disabled={approveLayoutMutation.isPending}
              className="bg-purple-600 hover:bg-purple-700 text-white font-bold"
            >
              {approveLayoutMutation.isPending && <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />}
              Grant Layout Access to User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
