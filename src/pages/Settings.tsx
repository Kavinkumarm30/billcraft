import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { useAuth } from '../contexts/AuthContext';
import { 
  Loader2, 
  Palette, 
  LayoutTemplate, 
  Building2, 
  Check, 
  Sparkles, 
  Move, 
  Eye, 
  EyeOff, 
  ZoomIn, 
  ZoomOut, 
  AlignLeft, 
  AlignCenter, 
  AlignRight, 
  CheckCircle2,
  Wand2,
  Layers,
  Upload,
  FileCode,
  X,
  FileUp,
  Clock,
  ExternalLink,
  ShieldCheck,
  Smartphone,
  CreditCard
} from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../components/ui/dialog';

export interface CanvasElement {
  id: string;
  name: string;
  type: 'company_header' | 'invoice_meta' | 'billed_to' | 'items_table' | 'totals_card' | 'bank_details' | 'signature_block' | 'notes_terms';
  x: number;
  y: number;
  width: number;
  fontSize?: number;
  textColor?: string;
  bgColor?: string;
  borderColor?: string;
  borderWidth?: number;
  borderRadius?: number;
  padding?: number;
  textAlign?: 'left' | 'center' | 'right';
  fontWeight?: 'normal' | 'medium' | 'bold';
  visible: boolean;
}

export interface CanvaLayoutDesign {
  canvasBg: string;
  primaryColor: string;
  fontFamily: 'sans' | 'serif' | 'mono';
  canvasHeight: number;
  elements: CanvasElement[];
}

export const defaultCanvaDesign: CanvaLayoutDesign = {
  canvasBg: '#ffffff',
  primaryColor: '#18181b',
  fontFamily: 'sans',
  canvasHeight: 1050,
  elements: [
    {
      id: 'company_header',
      name: 'Company Header & Logo',
      type: 'company_header',
      x: 40,
      y: 40,
      width: 400,
      fontSize: 14,
      textColor: '#18181b',
      bgColor: 'transparent',
      textAlign: 'left',
      fontWeight: 'bold',
      visible: true
    },
    {
      id: 'invoice_meta',
      name: 'Invoice Title & Meta',
      type: 'invoice_meta',
      x: 480,
      y: 40,
      width: 280,
      fontSize: 13,
      textColor: '#18181b',
      bgColor: 'transparent',
      textAlign: 'right',
      fontWeight: 'bold',
      visible: true
    },
    {
      id: 'billed_to',
      name: 'Billed To (Customer Details)',
      type: 'billed_to',
      x: 40,
      y: 160,
      width: 720,
      fontSize: 13,
      textColor: '#1f2937',
      bgColor: '#f9fafb',
      borderColor: '#e5e7eb',
      borderWidth: 1,
      borderRadius: 12,
      padding: 16,
      textAlign: 'left',
      visible: true
    },
    {
      id: 'items_table',
      name: 'Products & Items Table',
      type: 'items_table',
      x: 40,
      y: 290,
      width: 720,
      fontSize: 13,
      textColor: '#1f2937',
      bgColor: '#ffffff',
      borderColor: '#e5e7eb',
      borderWidth: 1,
      borderRadius: 8,
      textAlign: 'left',
      visible: true
    },
    {
      id: 'totals_card',
      name: 'Subtotal & Grand Total',
      type: 'totals_card',
      x: 480,
      y: 540,
      width: 280,
      fontSize: 13,
      textColor: '#111827',
      bgColor: '#f9fafb',
      borderColor: '#e5e7eb',
      borderWidth: 1,
      borderRadius: 12,
      padding: 16,
      textAlign: 'right',
      visible: true
    },
    {
      id: 'bank_details',
      name: 'Bank & UPI Payment Info',
      type: 'bank_details',
      x: 40,
      y: 540,
      width: 410,
      fontSize: 12,
      textColor: '#374151',
      bgColor: '#f9fafb',
      borderColor: '#e5e7eb',
      borderWidth: 1,
      borderRadius: 12,
      padding: 16,
      textAlign: 'left',
      visible: true
    },
    {
      id: 'notes_terms',
      name: 'Notes & Terms',
      type: 'notes_terms',
      x: 40,
      y: 690,
      width: 440,
      fontSize: 12,
      textColor: '#6b7280',
      bgColor: 'transparent',
      textAlign: 'left',
      visible: true
    },
    {
      id: 'signature_block',
      name: 'Authorized Signature',
      type: 'signature_block',
      x: 520,
      y: 690,
      width: 240,
      fontSize: 12,
      textColor: '#4b5563',
      bgColor: 'transparent',
      textAlign: 'center',
      visible: true
    }
  ]
};

// Predefined Prebuilt Standard Invoice Layouts
const predefinedLayouts = [
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

  // 3 Distinct Main Pages inside Settings
  const [activeTab, setActiveTab] = useState<'upload' | 'canva' | 'details'>('details');
  
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

  // Canva Designer state
  const [design, setDesign] = useState<CanvaLayoutDesign>(defaultCanvaDesign);
  const [selectedElementId, setSelectedElementId] = useState<string | null>('company_header');
  const [zoomLevel, setZoomLevel] = useState<number>(0.85);
  const [sidebarPanel, setSidebarPanel] = useState<'elements' | 'styles'>('elements');

  // Upload Custom Bill state
  const [customFile, setCustomFile] = useState<File | null>(null);
  const [customFilePreview, setCustomFilePreview] = useState<string | null>(null);
  const [customNote, setCustomNote] = useState('');
  const [isSubmittingCustom, setIsSubmittingCustom] = useState(false);
  const [fullPreviewUrl, setFullPreviewUrl] = useState<string | null>(null);

  // Dragging state for Canva
  const canvasRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);
  const isResizingRef = useRef(false);
  const dragTargetIdRef = useRef<string | null>(null);
  const dragStartPosRef = useRef<{ mouseX: number; mouseY: number; elemX: number; elemY: number; elemWidth: number }>({
    mouseX: 0,
    mouseY: 0,
    elemX: 0,
    elemY: 0,
    elemWidth: 0
  });

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

      // Load Canva design or predefined layout
      if (settings.invoiceLayout) {
        try {
          if (settings.invoiceLayout.startsWith('{')) {
            const parsed = JSON.parse(settings.invoiceLayout);
            if (parsed.elements && Array.isArray(parsed.elements)) {
              setDesign(parsed);
            }
          } else {
            setSelectedLayoutId(settings.invoiceLayout);
          }
        } catch (e) {
          console.error("Error parsing design:", e);
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
      invoiceLayout: layoutToSave || (activeTab === 'canva' ? JSON.stringify(design) : selectedLayoutId),
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

  // Canva Drag and Drop event handlers
  const handlePointerDown = (e: React.PointerEvent, elementId: string, isResizeHandle: boolean = false) => {
    e.stopPropagation();
    setSelectedElementId(elementId);
    
    const elem = design.elements.find(el => el.id === elementId);
    if (!elem) return;

    if (isResizeHandle) {
      isResizingRef.current = true;
    } else {
      isDraggingRef.current = true;
    }

    dragTargetIdRef.current = elementId;
    dragStartPosRef.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      elemX: elem.x,
      elemY: elem.y,
      elemWidth: elem.width || 300
    };

    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDraggingRef.current && !isResizingRef.current) return;
    if (!dragTargetIdRef.current) return;

    const deltaX = (e.clientX - dragStartPosRef.current.mouseX) / zoomLevel;
    const deltaY = (e.clientY - dragStartPosRef.current.mouseY) / zoomLevel;

    setDesign(prev => {
      const newElements = prev.elements.map(el => {
        if (el.id !== dragTargetIdRef.current) return el;
        
        if (isDraggingRef.current) {
          const rawX = dragStartPosRef.current.elemX + deltaX;
          const rawY = dragStartPosRef.current.elemY + deltaY;
          const snappedX = Math.max(20, Math.min(780 - el.width, Math.round(rawX / 10) * 10));
          const snappedY = Math.max(20, Math.min(prev.canvasHeight - 50, Math.round(rawY / 10) * 10));
          return { ...el, x: snappedX, y: snappedY };
        }

        if (isResizingRef.current) {
          const rawW = dragStartPosRef.current.elemWidth + deltaX;
          const snappedW = Math.max(160, Math.min(780 - el.x, Math.round(rawW / 10) * 10));
          return { ...el, width: snappedW };
        }

        return el;
      });
      return { ...prev, elements: newElements };
    });
  };

  const handlePointerUp = () => {
    isDraggingRef.current = false;
    isResizingRef.current = false;
    dragTargetIdRef.current = null;
  };

  const updateSelectedElement = (updates: Partial<CanvasElement>) => {
    if (!selectedElementId) return;
    setDesign(prev => ({
      ...prev,
      elements: prev.elements.map(el => el.id === selectedElementId ? { ...el, ...updates } : el)
    }));
  };

  // 1-Click Auto Align
  const handleAutoAlign = () => {
    setDesign(prev => ({
      ...prev,
      elements: [
        { ...prev.elements[0], x: 40, y: 40, width: 400, textAlign: 'left' },
        { ...prev.elements[1], x: 480, y: 40, width: 280, textAlign: 'right' },
        { ...prev.elements[2], x: 40, y: 160, width: 720 },
        { ...prev.elements[3], x: 40, y: 290, width: 720 },
        { ...prev.elements[4], x: 480, y: 540, width: 280 },
        { ...prev.elements[5], x: 40, y: 540, width: 410 },
        { ...prev.elements[6], x: 40, y: 690, width: 440 },
        { ...prev.elements[7], x: 520, y: 690, width: 240, textAlign: 'center' },
      ]
    }));
    toast.success('✨ Auto-Aligned all bill sections with perfect spacing!');
  };

  // Center Element Horizontally
  const handleCenterElement = () => {
    if (!selectedElementId) return;
    const elem = design.elements.find(el => el.id === selectedElementId);
    if (!elem) return;
    const centeredX = Math.round((800 - elem.width) / 20) * 10;
    updateSelectedElement({ x: centeredX });
    toast.success(`Centered "${elem.name}" on canvas`);
  };

  const selectedElem = design.elements.find(el => el.id === selectedElementId);

  if (isLoading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-full">
      
      {/* Top Main Navigation Header with 3 Pages */}
      <div className="p-4 sm:p-6 bg-white border-b border-gray-200 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="px-3 py-1 rounded-full text-xs font-black bg-black text-white shadow-xs">
              BILL-CRAFT
            </span>
            <h1 className="text-xl font-black text-gray-900 tracking-tight">Organization & Bill Settings</h1>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Upload custom layouts, edit bills with Canva studio, or manage company profile & presets
          </p>
        </div>

        {/* 3 Main Tabs */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex bg-gray-100 p-1 rounded-xl">
            {/* Page 1: Upload the Bill */}
            <button
              type="button"
              onClick={() => setActiveTab('upload')}
              className={`px-3.5 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
                activeTab === 'upload' 
                  ? 'bg-amber-500 text-white shadow-sm' 
                  : 'text-gray-600 hover:text-black'
              }`}
            >
              <FileUp className="w-3.5 h-3.5" />
              Upload the Bill
            </button>

            {/* Page 2: Canva Editor */}
            <button
              type="button"
              onClick={() => setActiveTab('canva')}
              className={`px-3.5 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
                activeTab === 'canva' 
                  ? 'bg-purple-600 text-white shadow-sm' 
                  : 'text-gray-600 hover:text-black'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              Canva Editor
            </button>

            {/* Page 3: Company Details & Predefined Layouts */}
            <button
              type="button"
              onClick={() => setActiveTab('details')}
              className={`px-3.5 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
                activeTab === 'details' 
                  ? 'bg-blue-600 text-white shadow-sm' 
                  : 'text-gray-600 hover:text-black'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              Company Details (Predefined Layouts)
            </button>
          </div>

          {activeTab === 'canva' && (
            <Button 
              onClick={() => handleSaveProfileAndLayout(JSON.stringify(design))} 
              disabled={mutation.isPending} 
              className="bg-black hover:bg-gray-800 text-white text-xs font-bold px-5 h-9 shadow-md transition-transform active:scale-95"
            >
              {mutation.isPending && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
              Save Design
            </Button>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* PAGE 1: UPLOAD THE BILL (CUSTOM BILL LAYOUT SUBMISSION & STATUS)           */}
      {/* ========================================================================= */}
      {activeTab === 'upload' && (
        <div className="space-y-6 max-w-5xl">
          
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
      {/* PAGE 2: CANVA EDITOR (FREEFORM DRAG & DROP CUSTOMIZER)                    */}
      {/* ========================================================================= */}
      {activeTab === 'canva' && (
        <div className="flex flex-col lg:flex-row h-[calc(100vh-135px)] min-h-[720px] border border-gray-200 bg-gray-100 rounded-2xl overflow-hidden shadow-sm">
          
          {/* Canva Left Control Sidebar */}
          <div className="w-full lg:w-80 bg-white border-r border-gray-200 flex flex-col shrink-0">
            {/* Sidebar Navigation */}
            <div className="flex border-b border-gray-100 bg-gray-50/80 p-1.5 gap-1">
              <button
                type="button"
                onClick={() => setSidebarPanel('elements')}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                  sidebarPanel === 'elements' ? 'bg-white text-purple-700 shadow-xs' : 'text-gray-500 hover:text-black'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                Elements
              </button>
              <button
                type="button"
                onClick={() => setSidebarPanel('styles')}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                  sidebarPanel === 'styles' ? 'bg-white text-purple-700 shadow-xs' : 'text-gray-500 hover:text-black'
                }`}
              >
                <Palette className="w-3.5 h-3.5" />
                Colors & Themes
              </button>
            </div>

            {/* Sidebar Panel Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              
              {/* 1. ELEMENTS PANEL */}
              {sidebarPanel === 'elements' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-black uppercase tracking-wider text-gray-400">Invoice Blocks</p>
                    <button
                      type="button"
                      onClick={handleAutoAlign}
                      className="text-[11px] text-purple-700 font-bold flex items-center gap-1 hover:underline"
                    >
                      <Wand2 className="w-3 h-3" /> Auto-Align
                    </button>
                  </div>

                  <div className="space-y-2">
                    {design.elements.map((elem) => (
                      <div
                        key={elem.id}
                        onClick={() => setSelectedElementId(elem.id)}
                        className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                          selectedElementId === elem.id ? 'border-purple-600 bg-purple-50/70 shadow-xs ring-1 ring-purple-600' : 'border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <Move className="w-3.5 h-3.5 text-gray-400" />
                          <div>
                            <p className="text-xs font-bold text-gray-900">{elem.name}</p>
                            <p className="text-[10px] text-gray-400 font-mono">({elem.x}px, {elem.y}px)</p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDesign(prev => ({
                              ...prev,
                              elements: prev.elements.map(el => el.id === elem.id ? { ...el, visible: !el.visible } : el)
                            }));
                          }}
                          className="p-1 hover:bg-gray-200 rounded text-gray-500 transition-colors"
                          title={elem.visible ? 'Hide from canvas' : 'Show on canvas'}
                        >
                          {elem.visible ? <Eye className="w-4 h-4 text-gray-600" /> : <EyeOff className="w-4 h-4 text-red-500" />}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 2. THEMES & STYLES PANEL */}
              {sidebarPanel === 'styles' && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-black uppercase tracking-wider text-gray-400">Theme Color Swatches</Label>
                    <div className="flex flex-wrap gap-2 items-center">
                      {[
                        { name: 'Obsidian', hex: '#18181b' },
                        { name: 'Royal Blue', hex: '#2563eb' },
                        { name: 'Emerald', hex: '#059669' },
                        { name: 'Sunset', hex: '#ea580c' },
                        { name: 'Ruby', hex: '#dc2626' },
                        { name: 'Purple', hex: '#7c3aed' },
                        { name: 'Amber', hex: '#d97706' },
                        { name: 'Cyan', hex: '#0891b2' },
                      ].map(swatch => (
                        <button
                          key={swatch.hex}
                          type="button"
                          onClick={() => setDesign(p => ({ ...p, primaryColor: swatch.hex }))}
                          className={`w-7 h-7 rounded-full transition-transform hover:scale-110 shadow-xs flex items-center justify-center ${
                            design.primaryColor === swatch.hex ? 'ring-2 ring-offset-2 ring-black scale-110' : ''
                          }`}
                          style={{ backgroundColor: swatch.hex }}
                          title={swatch.name}
                        >
                          {design.primaryColor === swatch.hex && <Check className="w-3.5 h-3.5 text-white" />}
                        </button>
                      ))}
                      <div className="flex items-center gap-1 border rounded-lg px-2 py-1 bg-gray-50 ml-1">
                        <input 
                          type="color" 
                          value={design.primaryColor}
                          onChange={(e) => setDesign(p => ({ ...p, primaryColor: e.target.value }))}
                          className="w-5 h-5 rounded cursor-pointer border-0 bg-transparent" 
                        />
                        <span className="text-[10px] font-mono font-bold uppercase">{design.primaryColor}</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-black uppercase tracking-wider text-gray-400">Typography Font</Label>
                    <div className="grid grid-cols-3 gap-1.5">
                      {[
                        { id: 'sans', label: 'Sans' },
                        { id: 'serif', label: 'Serif' },
                        { id: 'mono', label: 'Mono' }
                      ].map(f => (
                        <button
                          key={f.id}
                          type="button"
                          onClick={() => setDesign(p => ({ ...p, fontFamily: f.id as any }))}
                          className={`py-2 text-xs font-bold rounded-lg border text-center transition-all ${
                            design.fontFamily === f.id ? 'border-black bg-black text-white shadow-xs' : 'border-gray-200 hover:bg-gray-50'
                          }`}
                        >
                          {f.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-gray-100">
                    <Label className="text-xs font-black uppercase tracking-wider text-gray-400">Canvas Page Height</Label>
                    <div className="flex items-center gap-2">
                      <Input 
                        type="number"
                        value={design.canvasHeight}
                        onChange={(e) => setDesign(p => ({ ...p, canvasHeight: Math.max(800, parseInt(e.target.value) || 1050) }))}
                        className="h-8 text-xs font-mono font-bold"
                      />
                      <span className="text-xs text-gray-500 font-semibold">px (A4 Height)</span>
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>

          {/* Canva Canvas Workspace & Top Bar */}
          <div className="flex-1 flex flex-col overflow-hidden">
            
            {/* Canva Top Floating Toolbar */}
            <div className="p-2 px-4 bg-white border-b border-gray-200 flex flex-wrap items-center justify-between gap-3 shadow-xs z-10">
              
              {/* Quick Actions */}
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  onClick={handleAutoAlign}
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs font-bold border-purple-200 bg-purple-50 text-purple-700 hover:bg-purple-100 hover:text-purple-900 shadow-xs"
                >
                  <Wand2 className="w-3.5 h-3.5 mr-1" />
                  Auto-Align
                </Button>

                {selectedElem && (
                  <Button
                    type="button"
                    onClick={handleCenterElement}
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs font-medium text-gray-700 hover:bg-gray-100"
                  >
                    <AlignCenter className="w-3.5 h-3.5 mr-1" />
                    Center Element
                  </Button>
                )}
              </div>

              {/* Selected Element Formatting Bar */}
              {selectedElem && (
                <div className="flex items-center gap-2 flex-wrap text-xs bg-gray-50 p-1 rounded-xl border border-gray-200">
                  <span className="font-black text-gray-800 px-2 py-0.5 rounded bg-white text-xs shadow-2xs">
                    {selectedElem.name}
                  </span>

                  {/* Alignment */}
                  <div className="flex border rounded-lg bg-white overflow-hidden">
                    <button
                      type="button"
                      onClick={() => updateSelectedElement({ textAlign: 'left' })}
                      className={`p-1.5 ${selectedElem.textAlign === 'left' ? 'bg-gray-200 font-bold' : 'hover:bg-gray-100'}`}
                      title="Align Left"
                    >
                      <AlignLeft className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => updateSelectedElement({ textAlign: 'center' })}
                      className={`p-1.5 ${selectedElem.textAlign === 'center' ? 'bg-gray-200 font-bold' : 'hover:bg-gray-100'}`}
                      title="Align Center"
                    >
                      <AlignCenter className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => updateSelectedElement({ textAlign: 'right' })}
                      className={`p-1.5 ${selectedElem.textAlign === 'right' ? 'bg-gray-200 font-bold' : 'hover:bg-gray-100'}`}
                      title="Align Right"
                    >
                      <AlignRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Text Color */}
                  <div className="flex items-center gap-1 bg-white border rounded-lg px-2 py-1">
                    <span className="text-gray-400 text-[10px] font-bold">Text:</span>
                    <input 
                      type="color" 
                      value={selectedElem.textColor || '#000000'}
                      onChange={(e) => updateSelectedElement({ textColor: e.target.value })}
                      className="w-4 h-4 rounded cursor-pointer border-0 bg-transparent"
                    />
                  </div>

                  {/* Bg Color */}
                  <div className="flex items-center gap-1 bg-white border rounded-lg px-2 py-1">
                    <span className="text-gray-400 text-[10px] font-bold">Bg:</span>
                    <input 
                      type="color" 
                      value={selectedElem.bgColor && selectedElem.bgColor !== 'transparent' ? selectedElem.bgColor : '#ffffff'}
                      onChange={(e) => updateSelectedElement({ bgColor: e.target.value })}
                      className="w-4 h-4 rounded cursor-pointer border-0 bg-transparent"
                    />
                    <button 
                      type="button" 
                      onClick={() => updateSelectedElement({ bgColor: 'transparent' })}
                      className="text-[10px] text-gray-500 hover:text-black font-semibold ml-0.5"
                    >
                      Clear
                    </button>
                  </div>
                </div>
              )}

              {/* Zoom Controls */}
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setZoomLevel(prev => Math.max(0.5, prev - 0.1))}
                  className="p-1.5 hover:bg-gray-100 rounded text-gray-600"
                  title="Zoom Out"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <span className="text-xs font-mono text-gray-700 font-bold px-1">{Math.round(zoomLevel * 100)}%</span>
                <button
                  type="button"
                  onClick={() => setZoomLevel(prev => Math.min(1.4, prev + 0.1))}
                  className="p-1.5 hover:bg-gray-100 rounded text-gray-600"
                  title="Zoom In"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setZoomLevel(0.85)}
                  className="text-[11px] font-bold text-gray-500 hover:text-black underline ml-1"
                >
                  Fit View
                </button>
              </div>

            </div>

            {/* Interactive Drag & Drop Canvas Board */}
            <div 
              className="flex-1 overflow-auto p-8 flex justify-center items-start bg-gray-200/70 select-none cursor-default"
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
            >
              <div 
                ref={canvasRef}
                style={{
                  width: '800px',
                  height: `${design.canvasHeight}px`,
                  transform: `scale(${zoomLevel})`,
                  transformOrigin: 'top center',
                  backgroundColor: design.canvasBg,
                }}
                className={`relative bg-white shadow-2xl transition-transform border border-gray-300 rounded-sm ${
                  design.fontFamily === 'serif' ? 'font-serif' : 
                  design.fontFamily === 'mono' ? 'font-mono' : 'font-sans'
                }`}
              >
                {/* Visual Canvas Grid Background */}
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#f1f5f9_1px,transparent_1px),linear-gradient(to_bottom,#f1f5f9_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none opacity-50"></div>

                {/* Canva Draggable Elements */}
                {design.elements.filter(el => el.visible).map((el) => {
                  const isSelected = selectedElementId === el.id;

                  return (
                    <div
                      key={el.id}
                      onPointerDown={(e) => handlePointerDown(e, el.id, false)}
                      style={{
                        position: 'absolute',
                        left: `${el.x}px`,
                        top: `${el.y}px`,
                        width: `${el.width}px`,
                        backgroundColor: el.bgColor || 'transparent',
                        color: el.textColor || 'inherit',
                        fontSize: el.fontSize ? `${el.fontSize}px` : undefined,
                        borderColor: el.borderColor || 'transparent',
                        borderWidth: el.borderWidth ? `${el.borderWidth}px` : undefined,
                        borderRadius: el.borderRadius ? `${el.borderRadius}px` : undefined,
                        padding: el.padding ? `${el.padding}px` : undefined,
                        textAlign: el.textAlign || 'left',
                        cursor: 'grab'
                      }}
                      className={`group transition-shadow ${
                        isSelected 
                          ? 'ring-2 ring-purple-600 ring-offset-2 shadow-xl z-30' 
                          : 'hover:ring-1 hover:ring-purple-400 hover:shadow-md'
                      }`}
                    >
                      {/* Selection Badge & Resize Handle */}
                      {isSelected && (
                        <>
                          <div className="absolute -top-7 left-0 bg-purple-600 text-white text-[10px] font-black px-2.5 py-0.5 rounded shadow-sm flex items-center gap-1.5 pointer-events-none tracking-wide">
                            <Move className="w-2.5 h-2.5" />
                            {el.name} ({el.x}px, {el.y}px)
                          </div>
                          
                          <div 
                            onPointerDown={(e) => handlePointerDown(e, el.id, true)}
                            className="absolute -right-2 top-1/2 -translate-y-1/2 w-3.5 h-7 bg-purple-600 border border-white rounded cursor-ew-resize hover:scale-125 transition-transform z-40 shadow-sm"
                            title="Drag to resize width"
                          />
                        </>
                      )}

                      {/* Element Type Renderers */}
                      {el.type === 'company_header' && (
                        <div className="flex items-center gap-3">
                          {logoUrl ? (
                            <img src={logoUrl} alt="Logo" className="h-12 w-12 object-contain rounded" />
                          ) : (
                            <div 
                              className="h-12 w-12 rounded-xl flex items-center justify-center text-white shadow-sm font-black text-base shrink-0"
                              style={{ backgroundColor: design.primaryColor }}
                            >
                              {companyName ? companyName.slice(0, 2).toUpperCase() : 'BC'}
                            </div>
                          )}
                          <div>
                            <h2 className="text-lg font-black leading-tight" style={{ color: design.primaryColor }}>
                              {companyName || 'My Company Name'}
                            </h2>
                            <p className="text-xs text-gray-500 leading-tight mt-0.5">{address || '123 Business Way, Suite 100'}</p>
                            {gstNo && <p className="text-[11px] font-bold text-gray-600 mt-0.5">GST: {gstNo}</p>}
                          </div>
                        </div>
                      )}

                      {el.type === 'invoice_meta' && (
                        <div className="space-y-0.5">
                          <h3 className="text-2xl font-black tracking-wider uppercase leading-none" style={{ color: design.primaryColor }}>
                            INVOICE
                          </h3>
                          <p className="text-xs font-bold text-gray-900">Invoice No: INV-591499</p>
                          <p className="text-xs text-gray-500">Date: {new Date().toISOString().split('T')[0]}</p>
                          <div className="mt-1">
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-green-100 text-green-800 border border-green-200">
                              <CheckCircle2 className="w-3 h-3 text-green-600" />
                              PAID
                            </span>
                          </div>
                        </div>
                      )}

                      {el.type === 'billed_to' && (
                        <div>
                          <p className="text-[11px] font-black text-gray-400 uppercase tracking-wider mb-1">Billed To</p>
                          <p className="font-black text-base text-gray-900">m.kavinkumar</p>
                          <p className="text-xs text-gray-500 mt-0.5">1/239 kk palli, Phone: +91 9361654668</p>
                        </div>
                      )}

                      {el.type === 'items_table' && (
                        <table className="w-full text-left border-collapse text-xs">
                          <thead>
                            <tr className="border-b bg-gray-50/80">
                              <th className="py-2.5 px-3 font-bold text-gray-700">Description</th>
                              <th className="py-2.5 px-3 font-bold text-gray-700 text-center">Qty</th>
                              <th className="py-2.5 px-3 font-bold text-gray-700 text-right">Rate</th>
                              <th className="py-2.5 px-3 font-bold text-gray-700 text-right">Amount</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            <tr>
                              <td className="py-2 px-3 text-gray-800 font-medium">Sample Item 1</td>
                              <td className="py-2 px-3 text-gray-600 text-center">2</td>
                              <td className="py-2 px-3 text-gray-600 text-right">₹250.00</td>
                              <td className="py-2 px-3 text-gray-900 font-bold text-right">₹500.00</td>
                            </tr>
                            <tr>
                              <td className="py-2 px-3 text-gray-800 font-medium">Premium Service 2</td>
                              <td className="py-2 px-3 text-gray-600 text-center">1</td>
                              <td className="py-2 px-3 text-gray-600 text-right">₹450.00</td>
                              <td className="py-2 px-3 text-gray-900 font-bold text-right">₹450.00</td>
                            </tr>
                          </tbody>
                        </table>
                      )}

                      {el.type === 'totals_card' && (
                        <div className="space-y-1.5 text-xs">
                          <div className="flex justify-between text-gray-600">
                            <span>Subtotal:</span>
                            <span className="font-semibold">₹950.00</span>
                          </div>
                          <div className="flex justify-between text-gray-600">
                            <span>Tax (5%):</span>
                            <span className="font-semibold">₹47.50</span>
                          </div>
                          <div 
                            className="flex justify-between font-black text-base pt-2 border-t mt-1"
                            style={{ borderColor: design.primaryColor, color: el.textColor || design.primaryColor }}
                          >
                            <span>Total Amount:</span>
                            <span>₹997.50</span>
                          </div>
                        </div>
                      )}

                      {el.type === 'bank_details' && (
                        <div>
                          <p className="font-black text-xs uppercase tracking-wider text-gray-700 mb-1.5">Bank & Payment Details</p>
                          <div className="grid grid-cols-2 gap-1 text-[11px] text-gray-600">
                            <div>Bank: <span className="font-bold text-gray-800">{bankName || 'State Bank of India'}</span></div>
                            <div>A/C: <span className="font-bold text-gray-800">{accountNo || 'XXXX123456'}</span></div>
                            <div>IFSC: <span className="font-bold text-gray-800">{ifsc || 'SBIN0001234'}</span></div>
                            <div>UPI: <span className="font-bold text-gray-800">{upiId || 'company@upi'}</span></div>
                          </div>
                        </div>
                      )}

                      {el.type === 'notes_terms' && (
                        <div>
                          <p className="text-[11px] font-black text-gray-400 uppercase tracking-wider mb-0.5">Notes & Terms</p>
                          <p className="text-xs text-gray-600 leading-relaxed">
                            Payment due within 15 days of invoice date. Thank you for your business!
                          </p>
                        </div>
                      )}

                      {el.type === 'signature_block' && (
                        <div className="text-center">
                          <div className="w-32 border-b border-gray-400 mx-auto mb-1.5"></div>
                          <p className="text-xs font-bold text-gray-700">Authorized Signature</p>
                          <p className="text-[10px] text-gray-400">{companyName || 'For Organization'}</p>
                        </div>
                      )}

                    </div>
                  );
                })}

              </div>
            </div>

          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* PAGE 3: COMPANY DETAILS (PREDEFINED LAYOUTS GALLERY & ORG PROFILE)         */}
      {/* ========================================================================= */}
      {activeTab === 'details' && (
        <div className="space-y-6 max-w-5xl">
          
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
          <div className="p-4 bg-white border-b flex items-center justify-between shrink-0">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800">
                  {previewingLayout?.badge}
                </span>
                <DialogTitle className="text-base font-black text-gray-900">
                  {previewingLayout?.name} Layout Preview
                </DialogTitle>
              </div>
              <DialogDescription className="text-xs text-gray-500 mt-0.5">
                {previewingLayout?.desc}
              </DialogDescription>
            </div>

            <div className="flex items-center gap-2">
              {selectedLayoutId === previewingLayout?.id ? (
                <span className="text-xs font-bold text-green-700 bg-green-50 border border-green-200 px-3 py-1.5 rounded-xl flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  Currently Active Layout
                </span>
              ) : previewingLayout?.isCustom && !settings?.hasCustomLayoutAccess ? (
                <Button
                  onClick={() => {
                    setPreviewingLayout(null);
                    setActiveTab('upload');
                  }}
                  className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold h-8"
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
                  className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold h-8 shadow-sm"
                >
                  <Check className="w-3.5 h-3.5 mr-1" />
                  Activate This Layout
                </Button>
              )}
            </div>
          </div>

          {/* Modal Scrollable Bill Canvas Body */}
          <div className="flex-1 overflow-y-auto p-6 flex justify-center bg-gray-200/80">
            
            {/* Visual Simulated Invoice Preview Container */}
            <div 
              style={{ width: '700px', minHeight: '850px' }}
              className={`bg-white shadow-xl rounded-lg p-8 border border-gray-300 space-y-6 select-none ${
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
