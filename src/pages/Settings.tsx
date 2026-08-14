import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { useAuth } from '../contexts/AuthContext';
import { 
  Loader2, 
  LayoutTemplate, 
  Building2, 
  Check, 
  Eye, 
  CheckCircle2,
  Upload,
  FileCode,
  X,
  FileUp,
  Clock,
  ShieldCheck
} from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '../components/ui/dialog';

// Predefined Prebuilt Standard Invoice Layouts
export const predefinedLayouts = [
  { id: 'standard', name: 'Standard', badge: 'Logo Left', desc: 'Classic business invoice with company details on the left' },
  { id: 'modern', name: 'Modern', badge: 'Logo Right', desc: 'Contemporary layout with brand logo on the right side' },
  { id: 'minimal', name: 'Minimal', badge: 'Centered', desc: 'Clean centered typography with slim divider lines' },
  { id: 'professional', name: 'Professional', badge: 'Boxed', desc: 'Card containers for customer details and totals' },
  { id: 'bold', name: 'Bold', badge: 'Dark Accent', desc: 'Dark solid header with high contrast summary values' },
  { id: 'elegant', name: 'Elegant', badge: 'Serif & Soft', desc: 'Timeless serif fonts with soft rounded borders' },
  { id: 'tech', name: 'Tech', badge: 'Monospace', desc: 'Clean monospace typography for tech companies' },
  { id: 'corporate', name: 'Corporate', badge: 'Solid Header', desc: 'Formal executive layout designed for corporate billing' },
  { id: 'playful', name: 'Playful', badge: 'Rounded', desc: 'Vibrant rounded cards with colorful badges' },
  { id: 'orange-classic', name: 'Orange Classic', badge: 'Custom Monisha', desc: 'Exclusive warm orange boxed theme with highlighted totals card', isCustom: true },
  { id: 'classic', name: 'Classic', badge: 'Traditional', desc: 'Traditional paper invoice layout with standard grid' },
];

export default function Settings() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  // 2 Distinct Main Pages inside Settings: Upload the Bill & Company Details
  const [activeTab, setActiveTab] = useState<'upload' | 'details'>('details');
  
  // Organization profile states
  const [companyName, setCompanyName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [gstNo, setGstNo] = useState('');
  const [address, setAddress] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [bankName, setBankName] = useState('');
  const [accountNo, setAccountNo] = useState('');
  const [ifsc, setIfsc] = useState('');
  const [upiId, setUpiId] = useState('');
  const [selectedLayoutId, setSelectedLayoutId] = useState('standard');

  // Preview Layout Modal state
  const [previewingLayout, setPreviewingLayout] = useState<any | null>(null);

  // Upload Custom Bill state
  const [customFile, setCustomFile] = useState<File | null>(null);
  const [customFilePreview, setCustomFilePreview] = useState<string | null>(null);
  const [customNote, setCustomNote] = useState('');
  const [isSubmittingCustom, setIsSubmittingCustom] = useState(false);
  const [fullPreviewUrl, setFullPreviewUrl] = useState<string | null>(null);

  const { data: settings, isLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const token = await getToken();
      const res = await fetch('/api/settings', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to fetch settings');
      return res.json().catch(() => ({}));
    }
  });

  const { data: customRequests, refetch: refetchCustomRequests } = useQuery({
    queryKey: ['customLayoutRequests'],
    queryFn: async () => {
      const token = await getToken();
      const res = await fetch('/api/custom-layout-requests', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) return [];
      return res.json().catch(() => []);
    }
  });

  useEffect(() => {
    if (settings) {
      setCompanyName(settings.companyName || 'My Company');
      setEmail(settings.email || '');
      setPhone(settings.phone || '');
      setGstNo(settings.gstNo || '');
      setAddress(settings.address || '');
      setLogoUrl(settings.logoUrl || '');
      setBankName(settings.bankName || '');
      setAccountNo(settings.accountNo || '');
      setIfsc(settings.ifsc || '');
      setUpiId(settings.upiId || '');

      if (settings.invoiceLayout) {
        if (!settings.invoiceLayout.startsWith('{')) {
          setSelectedLayoutId(settings.invoiceLayout);
        }
      }
    }
  }, [settings]);

  const mutation = useMutation({
    mutationFn: async (payload: any) => {
      const token = await getToken();
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Failed to update settings');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      toast.success('Settings & invoice layout saved successfully!');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to update settings');
    }
  });

  const handleSaveProfileAndLayout = (layoutToSave?: string) => {
    const payload = {
      companyName,
      email,
      phone,
      gstNo,
      address,
      logoUrl,
      bankName,
      accountNo,
      ifsc,
      upiId,
      invoiceLayout: layoutToSave || selectedLayoutId,
    };
    mutation.mutate(payload);
  };

  // Submit custom template request for team review
  const handleSubmitCustomRequest = async () => {
    if (!customFile) {
      toast.error('Please select your bill image or PDF to upload');
      return;
    }

    setIsSubmittingCustom(true);
    try {
      const formData = new FormData();
      formData.append('file', customFile);
      formData.append('note', customNote || 'Custom layout design upload');

      const token = await getToken();
      const res = await fetch('/api/custom-layout-requests', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: formData,
      });

      if (!res.ok) throw new Error('Failed to submit design request');

      toast.success('Custom bill submitted! Our team will craft your layout and grant access.');
      setCustomFile(null);
      setCustomFilePreview(null);
      setCustomNote('');
      refetchCustomRequests();
    } catch (err: any) {
      toast.error(err.message || 'Failed to submit design request');
    } finally {
      setIsSubmittingCustom(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      
      {/* Top Main Navigation Header */}
      <div className="p-4 sm:p-6 bg-white border-b border-gray-200 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs rounded-2xl">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="px-3 py-1 rounded-full text-xs font-black bg-black text-white shadow-xs">
              BILL-CRAFT
            </span>
            <h1 className="text-xl font-black text-gray-900 tracking-tight">Organization & Bill Settings</h1>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Upload custom layouts, manage predefined bill templates, and update company profile
          </p>
        </div>

        {/* 2 Main Tabs: Upload the Bill & Company Details */}
        <div className="flex items-center gap-2">
          <div className="flex bg-gray-100 p-1 rounded-xl">
            {/* Page 1: Upload the Bill */}
            <button
              type="button"
              onClick={() => setActiveTab('upload')}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
                activeTab === 'upload' 
                  ? 'bg-amber-500 text-white shadow-sm' 
                  : 'text-gray-600 hover:text-black'
              }`}
            >
              <FileUp className="w-3.5 h-3.5" />
              Upload the Bill
            </button>

            {/* Page 2: Company Details (Predefined Layouts) */}
            <button
              type="button"
              onClick={() => setActiveTab('details')}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
                activeTab === 'details' 
                  ? 'bg-blue-600 text-white shadow-sm' 
                  : 'text-gray-600 hover:text-black'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              Company Details (Predefined Layouts)
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* PAGE 1: UPLOAD THE BILL (CUSTOM BILL LAYOUT SUBMISSION & STATUS)           */}
      {/* ========================================================================= */}
      {activeTab === 'upload' && (
        <div className="space-y-6">
          
          {/* Main Upload Card */}
          <Card className="border-0 shadow-sm ring-1 ring-gray-100 overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-amber-50 to-orange-50/60 border-b border-amber-100 p-6">
              <div className="flex items-start gap-3.5">
                <div className="p-3 bg-amber-100 text-amber-800 rounded-2xl shrink-0">
                  <FileCode className="w-6 h-6" />
                </div>
                <div>
                  <CardTitle className="text-lg font-black text-amber-950">
                    Have your own custom bill layout?
                  </CardTitle>
                  <CardDescription className="text-xs text-amber-800/90 mt-1">
                    Upload your existing bill, invoice, or receipt format. Our team will review the design, build the pixel-perfect layout, and grant access specifically to your account!
                  </CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-6 space-y-6">
              
              {/* Drag and drop upload zone */}
              <div>
                <Label className="text-xs font-bold text-gray-700 uppercase tracking-wider block mb-2">
                  1. Select Bill Image or PDF
                </Label>
                
                {!customFilePreview ? (
                  <label 
                    htmlFor="fullBillUploadInput"
                    className="border-2 border-dashed border-amber-300 hover:border-amber-500 bg-amber-50/30 hover:bg-amber-50/60 transition-all rounded-2xl p-10 flex flex-col items-center justify-center cursor-pointer text-center group"
                  >
                    <div className="w-14 h-14 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 mb-3 group-hover:scale-110 transition-transform shadow-xs">
                      <Upload className="w-7 h-7" />
                    </div>
                    <p className="text-sm font-bold text-gray-900">
                      Click to upload or drag & drop your bill format
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Support for JPG, PNG, JPEG, and PDF documents (up to 15MB)
                    </p>
                    <input 
                      type="file" 
                      id="fullBillUploadInput" 
                      accept="image/*,.pdf"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setCustomFile(file);
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            setCustomFilePreview(reader.result as string);
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                  </label>
                ) : (
                  <div className="p-4 bg-gray-50 border rounded-2xl flex flex-col sm:flex-row items-center gap-4">
                    <div className="w-40 h-40 bg-white rounded-xl border flex items-center justify-center overflow-hidden shrink-0 shadow-xs relative">
                      <img src={customFilePreview} alt="Bill Preview" className="max-h-full object-contain" />
                    </div>
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-bold text-gray-900">{customFile?.name}</p>
                        <button
                          type="button"
                          onClick={() => {
                            setCustomFile(null);
                            setCustomFilePreview(null);
                          }}
                          className="p-1 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          title="Remove file"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                      <p className="text-xs text-gray-500">
                        Size: {(customFile ? customFile.size / (1024 * 1024) : 0).toFixed(2)} MB
                      </p>
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-bold">
                        <Check className="w-3.5 h-3.5" /> File Attached Ready to Submit
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Special Instructions */}
              <div className="space-y-2">
                <Label className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                  2. Special Formatting Notes or Requirements (Optional)
                </Label>
                <textarea
                  rows={3}
                  value={customNote}
                  onChange={(e) => setCustomNote(e.target.value)}
                  placeholder="e.g. Please put our logo on the top center, add a GST tax summary table, and include terms at the bottom."
                  className="w-full text-xs p-3 border rounded-xl bg-white focus:ring-1 focus:ring-black outline-none"
                />
              </div>

              {/* Submit Button */}
              <div className="pt-2 flex justify-end">
                <Button
                  type="button"
                  onClick={handleSubmitCustomRequest}
                  disabled={!customFile || isSubmittingCustom}
                  className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs h-10 px-6 shadow-md transition-transform active:scale-95"
                >
                  {isSubmittingCustom ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Submitting Request...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      Submit Bill Layout to Our Team
                    </>
                  )}
                </Button>
              </div>

            </CardContent>
          </Card>

          {/* User's Previous Layout Requests Tracker */}
          <Card className="border-0 shadow-sm ring-1 ring-gray-100">
            <CardHeader className="bg-gray-50/50 border-b border-gray-100 py-4 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold text-gray-900 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-gray-500" />
                  Your Custom Bill Requests & Access Status
                </CardTitle>
                <CardDescription className="text-xs">
                  Track the status of your submitted layouts
                </CardDescription>
              </div>
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-700">
                {customRequests?.length || 0} Submissions
              </span>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              {customRequests && customRequests.length > 0 ? (
                customRequests.map((req: any) => (
                  <div key={req.id} className="p-4 rounded-xl border border-gray-200 bg-white hover:shadow-xs transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3.5">
                      <div 
                        className="w-16 h-16 rounded-lg bg-gray-50 border flex items-center justify-center overflow-hidden cursor-pointer hover:opacity-80 shrink-0"
                        onClick={() => setFullPreviewUrl(req.fileUrl)}
                      >
                        <img src={req.fileUrl} alt="Bill Preview" className="max-h-full object-contain" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-gray-900">{req.note || 'Custom Bill Layout Request'}</p>
                        <p className="text-[11px] text-gray-400 font-mono mt-0.5">
                          Submitted: {new Date(req.submittedAt).toLocaleDateString()} at {new Date(req.submittedAt).toLocaleTimeString()}
                        </p>
                        {req.status === 'APPROVED' && (
                          <p className="text-[11px] text-green-700 font-bold mt-1 flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Layout crafted & granted by Admin. Check Predefined Layouts!
                          </p>
                        )}
                      </div>
                    </div>

                    <div>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        req.status === 'APPROVED' ? 'bg-green-100 text-green-800 border border-green-200' :
                        req.status === 'REJECTED' ? 'bg-red-100 text-red-800 border border-red-200' :
                        'bg-amber-100 text-amber-800 border border-amber-200'
                      }`}>
                        {req.status === 'APPROVED' ? '🟢 ACCESS GRANTED' :
                         req.status === 'REJECTED' ? '🔴 NEEDS REVISION' :
                         '🟡 UNDER REVIEW'}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-gray-500 text-xs">
                  No custom bill requests submitted yet. Use the uploader above to submit your bill!
                </div>
              )}
            </CardContent>
          </Card>

        </div>
      )}

      {/* ========================================================================= */}
      {/* PAGE 2: COMPANY DETAILS (PREDEFINED LAYOUTS GALLERY & ORG PROFILE)         */}
      {/* ========================================================================= */}
      {activeTab === 'details' && (
        <div className="space-y-6">
          
          {/* Predefined Invoice Layouts Selection Gallery */}
          <Card className="border-0 shadow-sm ring-1 ring-gray-100">
            <CardHeader className="bg-gray-50/50 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-bold text-gray-900 flex items-center gap-2">
                    <LayoutTemplate className="w-4 h-4 text-blue-600" />
                    Predefined Invoice Layouts
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Click any layout to preview and activate it for your business bills
                  </CardDescription>
                </div>
                {settings?.hasCustomLayoutAccess && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-800 border border-green-200">
                    <ShieldCheck className="w-3.5 h-3.5 text-green-600" />
                    Custom Layout Unlocked
                  </span>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
                {predefinedLayouts.map((layout) => {
                  const isSelected = selectedLayoutId === layout.id;
                  const isCustomUnlocked = layout.isCustom && settings?.hasCustomLayoutAccess;
                  const isCustomLocked = layout.isCustom && !settings?.hasCustomLayoutAccess;

                  return (
                    <div
                      key={layout.id}
                      onClick={() => {
                        setPreviewingLayout(layout);
                      }}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between group hover:shadow-md ${
                        isSelected 
                          ? 'border-blue-600 bg-blue-50/50 ring-2 ring-blue-600 shadow-sm' 
                          : isCustomLocked 
                            ? 'border-gray-200 bg-gray-50/70 opacity-75' 
                            : 'border-gray-200 bg-white hover:border-blue-400'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="font-black text-sm text-gray-900 group-hover:text-blue-600 transition-colors">
                            {layout.name}
                          </span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            layout.isCustom 
                              ? isCustomUnlocked ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'
                              : isSelected ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'
                          }`}>
                            {layout.badge}
                          </span>
                        </div>
                        <p className="text-[11px] text-gray-500 leading-snug">{layout.desc}</p>
                      </div>

                      <div className="mt-4 pt-2.5 border-t border-gray-100 flex items-center justify-between">
                        {isSelected ? (
                          <span className="text-xs font-bold text-blue-600 flex items-center gap-1">
                            <Check className="w-3.5 h-3.5" /> Active Layout
                          </span>
                        ) : isCustomLocked ? (
                          <span className="text-[11px] font-bold text-amber-600">
                            Upload bill to unlock
                          </span>
                        ) : (
                          <span className="text-xs font-semibold text-gray-400 group-hover:text-blue-600 flex items-center gap-1 transition-colors">
                            <Eye className="w-3.5 h-3.5" /> Click to Preview & Apply
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Organization Profile Form */}
          <Card className="border-0 shadow-sm ring-1 ring-gray-100">
            <CardHeader className="bg-gray-50/50 border-b border-gray-100">
              <CardTitle className="text-base font-bold text-gray-900">Organization Profile & Business Details</CardTitle>
              <CardDescription className="text-xs">This information will automatically populate on your invoices and receipts</CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-gray-700">Company / Business Name *</Label>
                  <Input 
                    value={companyName} 
                    onChange={(e) => setCompanyName(e.target.value)} 
                    placeholder="Your Business Name"
                    className="h-9 text-xs"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-gray-700">Email Address</Label>
                  <Input 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)} 
                    placeholder="billing@yourcompany.com"
                    className="h-9 text-xs"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-gray-700">Phone Number</Label>
                  <Input 
                    value={phone} 
                    onChange={(e) => setPhone(e.target.value)} 
                    placeholder="+91 9876543210"
                    className="h-9 text-xs"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-gray-700">GST / Tax Identification Number</Label>
                  <Input 
                    value={gstNo} 
                    onChange={(e) => setGstNo(e.target.value)} 
                    placeholder="33AAAAA0000A1Z5"
                    className="h-9 text-xs"
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label className="text-xs font-bold text-gray-700">Business Address</Label>
                  <Input 
                    value={address} 
                    onChange={(e) => setAddress(e.target.value)} 
                    placeholder="Street, City, State, PIN"
                    className="h-9 text-xs"
                  />
                </div>

                {/* Bank Details */}
                <div className="space-y-2 sm:col-span-2 pt-2 border-t border-gray-100">
                  <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider">Bank & Payment Information (Optional)</h4>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-gray-700">Bank Name</Label>
                  <Input 
                    value={bankName} 
                    onChange={(e) => setBankName(e.target.value)} 
                    placeholder="State Bank of India"
                    className="h-9 text-xs"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-gray-700">Account Number</Label>
                  <Input 
                    value={accountNo} 
                    onChange={(e) => setAccountNo(e.target.value)} 
                    placeholder="123456789012"
                    className="h-9 text-xs"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-gray-700">IFSC Code</Label>
                  <Input 
                    value={ifsc} 
                    onChange={(e) => setIfsc(e.target.value)} 
                    placeholder="SBIN0001234"
                    className="h-9 text-xs"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-gray-700">UPI ID</Label>
                  <Input 
                    value={upiId} 
                    onChange={(e) => setUpiId(e.target.value)} 
                    placeholder="business@upi"
                    className="h-9 text-xs"
                  />
                </div>

                {/* Logo Upload */}
                <div className="space-y-2 sm:col-span-2 pt-2 border-t border-gray-100">
                  <Label className="text-xs font-bold text-gray-700">Company Logo</Label>
                  <Input 
                    type="file" 
                    accept="image/*"
                    className="h-9 text-xs"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          setLogoUrl(reader.result as string);
                        };
                        reader.readAsDataURL(file);
                      }
                    }} 
                  />
                  {logoUrl && (
                    <div className="mt-2 h-16 w-32 relative border rounded-lg p-2 bg-gray-50 flex items-center justify-center">
                      <img src={logoUrl} alt="Logo preview" className="object-contain max-h-full max-w-full" />
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-4 flex justify-end border-t border-gray-100">
                <Button 
                  onClick={() => handleSaveProfileAndLayout()} 
                  disabled={mutation.isPending} 
                  className="bg-black hover:bg-gray-800 text-white font-bold text-xs h-9 px-6 shadow-sm"
                >
                  {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save Company Profile
                </Button>
              </div>
            </CardContent>
          </Card>

        </div>
      )}

      {/* ========================================================================= */}
      {/* LIVE INTERACTIVE LAYOUT PREVIEW MODAL                                     */}
      {/* ========================================================================= */}
      <Dialog open={!!previewingLayout} onOpenChange={() => setPreviewingLayout(null)}>
        <DialogContent className="max-w-4xl max-h-[92vh] flex flex-col p-0 overflow-hidden bg-gray-100">
          
          {/* Modal Header */}
          <div className="p-3.5 sm:p-4 bg-white border-b flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shrink-0">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-bold bg-blue-100 text-blue-800">
                  {previewingLayout?.badge}
                </span>
                <DialogTitle className="text-sm sm:text-base font-black text-gray-900">
                  {previewingLayout?.name} Layout Preview
                </DialogTitle>
              </div>
              <DialogDescription className="text-[11px] sm:text-xs text-gray-500 mt-0.5">
                {previewingLayout?.desc}
              </DialogDescription>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              {selectedLayoutId === previewingLayout?.id ? (
                <span className="text-xs font-bold text-green-700 bg-green-50 border border-green-200 px-3 py-1.5 rounded-xl flex items-center gap-1.5 w-full sm:w-auto justify-center">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  Currently Active Layout
                </span>
              ) : previewingLayout?.isCustom && !settings?.hasCustomLayoutAccess ? (
                <Button
                  onClick={() => {
                    setPreviewingLayout(null);
                    setActiveTab('upload');
                  }}
                  className="w-full sm:w-auto bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold h-8"
                >
                  Upload Bill to Unlock
                </Button>
              ) : (
                <Button
                  onClick={() => {
                    setSelectedLayoutId(previewingLayout.id);
                    handleSaveProfileAndLayout(previewingLayout.id);
                    setPreviewingLayout(null);
                    toast.success(`"${previewingLayout.name}" layout activated for your business bills!`);
                  }}
                  className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold h-9 shadow-sm"
                >
                  <Check className="w-3.5 h-3.5 mr-1" />
                  Activate This Layout
                </Button>
              )}
            </div>
          </div>

          {/* Modal Scrollable Bill Canvas Body */}
          <div className="flex-1 overflow-auto p-2 sm:p-6 flex justify-center bg-gray-200/80">
            
            {/* Visual Simulated Invoice Preview Container */}
            <div 
              style={{ width: '100%', maxWidth: '680px', minHeight: '800px' }}
              className={`bg-white shadow-xl rounded-xl p-4 sm:p-8 border border-gray-300 space-y-4 sm:space-y-6 select-none ${
                previewingLayout?.id === 'elegant' ? 'font-serif' :
                previewingLayout?.id === 'tech' ? 'font-mono' : 'font-sans'
              }`}
            >
              {/* Header Rendering based on layout type */}
              {previewingLayout?.id === 'minimal' ? (
                <div className="text-center border-b pb-6 space-y-1">
                  <h1 className="text-2xl font-black tracking-tight text-gray-900">{companyName || 'BillCraft Inc.'}</h1>
                  <p className="text-xs text-gray-500">{address || '123 Tech Hub, Chennai, India'}</p>
                  {gstNo && <p className="text-xs font-semibold text-gray-600">GSTIN: {gstNo}</p>}
                </div>
              ) : previewingLayout?.id === 'modern' ? (
                <div className="flex justify-between items-start border-b pb-6">
                  <div>
                    <h2 className="text-3xl font-black text-blue-600 tracking-wider">INVOICE</h2>
                    <p className="text-xs font-bold text-gray-700 mt-1">#INV-2026-0042</p>
                    <p className="text-xs text-gray-500">Date: {new Date().toISOString().split('T')[0]}</p>
                  </div>
                  <div className="text-right">
                    <h1 className="text-xl font-black text-gray-900">{companyName || 'BillCraft Inc.'}</h1>
                    <p className="text-xs text-gray-500 mt-0.5">{address || '123 Tech Hub, Chennai'}</p>
                    {gstNo && <p className="text-xs font-bold text-gray-600">GST: {gstNo}</p>}
                  </div>
                </div>
              ) : previewingLayout?.id === 'bold' || previewingLayout?.id === 'corporate' ? (
                <div className="bg-slate-900 text-white p-6 rounded-xl flex justify-between items-center -mx-2 -mt-2 shadow-md">
                  <div>
                    <h1 className="text-2xl font-black tracking-wider text-white">{companyName || 'BillCraft Corporate'}</h1>
                    <p className="text-xs text-slate-300 mt-0.5">{address || '123 Tech Hub, Chennai'}</p>
                  </div>
                  <div className="text-right">
                    <h2 className="text-2xl font-black tracking-widest text-slate-100 uppercase">INVOICE</h2>
                    <p className="text-xs text-slate-300">#INV-2026-0042</p>
                  </div>
                </div>
              ) : previewingLayout?.id === 'orange-classic' ? (
                <div className="flex justify-between items-start border-b-2 border-orange-500 pb-5">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-orange-600 text-white rounded-xl flex items-center justify-center font-black text-base shadow-sm">
                      {companyName ? companyName.slice(0, 2).toUpperCase() : 'BC'}
                    </div>
                    <div>
                      <h1 className="text-xl font-black text-orange-600">{companyName || 'Monisha Retail Corp'}</h1>
                      <p className="text-xs text-gray-600">{address || '123 Market Road'}</p>
                      {gstNo && <p className="text-xs font-bold text-gray-800">GST: {gstNo}</p>}
                    </div>
                  </div>
                  <div className="text-right">
                    <h2 className="text-3xl font-black text-orange-600">INVOICE</h2>
                    <p className="text-xs font-bold text-gray-900">#INV-2026-0042</p>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-green-100 text-green-800 border border-green-200 inline-block mt-1">
                      PAID
                    </span>
                  </div>
                </div>
              ) : (
                <div className="flex justify-between items-start border-b pb-6">
                  <div className="flex items-center gap-3">
                    {logoUrl ? (
                      <img src={logoUrl} alt="Logo" className="h-12 w-12 object-contain rounded-lg" />
                    ) : (
                      <div className="w-12 h-12 bg-black text-white rounded-xl flex items-center justify-center font-bold text-base shadow-sm">
                        {companyName ? companyName.slice(0, 2).toUpperCase() : 'BC'}
                      </div>
                    )}
                    <div>
                      <h1 className="text-xl font-bold text-gray-900 tracking-tight">{companyName || 'BillCraft Inc.'}</h1>
                      <p className="text-xs text-gray-500 mt-0.5">{address || '123 Business Way, Suite 100'}</p>
                      {gstNo && <p className="text-xs font-semibold text-gray-600">GST: {gstNo}</p>}
                    </div>
                  </div>
                  <div className="text-right">
                    <h2 className="text-2xl font-black tracking-wider text-gray-900">INVOICE</h2>
                    <p className="text-xs font-bold text-gray-900 mt-1">#INV-2026-0042</p>
                    <p className="text-xs text-gray-500">Date: {new Date().toISOString().split('T')[0]}</p>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-green-100 text-green-800 border border-green-200 inline-block mt-1">
                      PAID
                    </span>
                  </div>
                </div>
              )}

              {/* Billed To Customer Details */}
              <div className={`p-4 rounded-xl ${
                previewingLayout?.id === 'orange-classic' ? 'bg-orange-50/60 border border-orange-200' :
                previewingLayout?.id === 'professional' ? 'bg-gray-50 border border-gray-200' :
                previewingLayout?.id === 'playful' ? 'bg-purple-50/50 border border-purple-100 rounded-2xl' :
                'bg-gray-50'
              }`}>
                <p className="text-[10px] font-black uppercase tracking-wider text-gray-400 mb-0.5">Billed To Customer</p>
                <h4 className="font-bold text-sm text-gray-900">M. Kavin Kumar</h4>
                <p className="text-xs text-gray-600 mt-0.5">1/239 KK Palli, Phone: +91 9361654668</p>
              </div>

              {/* Items Table */}
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className={`border-b ${
                    previewingLayout?.id === 'bold' || previewingLayout?.id === 'corporate' ? 'bg-slate-900 text-white' :
                    previewingLayout?.id === 'orange-classic' ? 'bg-orange-600 text-white font-bold' :
                    previewingLayout?.id === 'playful' ? 'bg-purple-100 text-purple-950 font-bold' :
                    'bg-gray-100 text-gray-700 font-bold'
                  }`}>
                    <th className="py-2.5 px-3">Item Description</th>
                    <th className="py-2.5 px-3 text-center">Qty</th>
                    <th className="py-2.5 px-3 text-right">Rate</th>
                    <th className="py-2.5 px-3 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 text-gray-800">
                  <tr>
                    <td className="py-2.5 px-3 font-medium">Software Development & Consulting</td>
                    <td className="py-2.5 px-3 text-center">1</td>
                    <td className="py-2.5 px-3 text-right">₹2,500.00</td>
                    <td className="py-2.5 px-3 text-right font-bold">₹2,500.00</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-medium">Cloud Infrastructure & Setup</td>
                    <td className="py-2.5 px-3 text-center">1</td>
                    <td className="py-2.5 px-3 text-right">₹1,450.00</td>
                    <td className="py-2.5 px-3 text-right font-bold">₹1,450.00</td>
                  </tr>
                </tbody>
              </table>

              {/* Summary and Bank Details Section */}
              <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                <div className="space-y-1 text-xs text-gray-600">
                  <p className="font-bold text-gray-800 uppercase tracking-wider text-[10px]">Payment Details</p>
                  <p>Bank: <span className="font-semibold text-gray-900">{bankName || 'State Bank of India'}</span></p>
                  <p>Account: <span className="font-semibold text-gray-900">{accountNo || 'XXXX123456'}</span></p>
                  <p>UPI ID: <span className="font-semibold text-gray-900">{upiId || 'business@upi'}</span></p>
                </div>

                <div className={`space-y-2 p-4 rounded-xl text-xs ${
                  previewingLayout?.id === 'orange-classic' ? 'bg-orange-600 text-white shadow-sm' :
                  previewingLayout?.id === 'bold' || previewingLayout?.id === 'corporate' ? 'bg-slate-900 text-white shadow-sm' :
                  previewingLayout?.id === 'modern' ? 'bg-blue-600 text-white shadow-sm' :
                  'bg-gray-50 border'
                }`}>
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span className="font-bold">₹3,950.00</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tax (5%):</span>
                    <span className="font-bold">₹197.50</span>
                  </div>
                  <div className="flex justify-between font-black text-base pt-2 border-t border-current">
                    <span>Grand Total:</span>
                    <span>₹4,147.50</span>
                  </div>
                </div>
              </div>

              {/* Footer and Sign */}
              <div className="flex justify-between items-end pt-8 text-xs text-gray-500">
                <div>
                  <p className="font-bold text-gray-700">Terms & Conditions</p>
                  <p className="text-[11px] text-gray-500">Payment due within 15 days. Thank you for your business!</p>
                </div>
                <div className="text-center">
                  <div className="w-32 border-b border-gray-400 mx-auto mb-1"></div>
                  <p className="font-bold text-gray-800">Authorized Signature</p>
                </div>
              </div>

            </div>

          </div>

        </DialogContent>
      </Dialog>

      {/* Full Image Preview Modal */}
      <Dialog open={!!fullPreviewUrl} onOpenChange={() => setFullPreviewUrl(null)}>
        <DialogContent className="max-w-3xl p-2 bg-black/90">
          <div className="flex justify-center p-4">
            {fullPreviewUrl && (
              <img src={fullPreviewUrl} alt="Full Bill Preview" className="max-h-[80vh] object-contain rounded" />
            )}
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
}
