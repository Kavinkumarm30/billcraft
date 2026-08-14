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
  Type, 
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
  Info,
  Upload,
  ShieldCheck,
  Users,
  Lock,
  Unlock,
  FileText,
  Clock,
  AlertCircle,
  FileCode,
  X
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

const prebuiltCanvaTemplates = [
  {
    name: 'Canva Modern Clean',
    badge: 'Popular',
    desc: 'Balanced spacing, soft gray container boxes, and sleek borders',
    color: '#18181b',
    design: defaultCanvaDesign
  },
  {
    name: 'Executive Dark Slate',
    badge: 'Corporate',
    desc: 'High contrast dark header and premium highlighted grand total',
    color: '#0f172a',
    design: {
      canvasBg: '#ffffff',
      primaryColor: '#0f172a',
      fontFamily: 'sans' as const,
      canvasHeight: 1050,
      elements: [
        { ...defaultCanvaDesign.elements[0], x: 40, y: 40, width: 420 },
        { ...defaultCanvaDesign.elements[1], x: 480, y: 40, width: 280, textColor: '#0f172a' },
        { ...defaultCanvaDesign.elements[2], x: 40, y: 160, width: 720, bgColor: '#f8fafc', borderColor: '#cbd5e1' },
        { ...defaultCanvaDesign.elements[3], x: 40, y: 290, width: 720 },
        { ...defaultCanvaDesign.elements[4], x: 470, y: 540, width: 290, bgColor: '#0f172a', textColor: '#ffffff' },
        { ...defaultCanvaDesign.elements[5], x: 40, y: 540, width: 410, bgColor: '#f8fafc' },
        { ...defaultCanvaDesign.elements[6], x: 40, y: 690, width: 440 },
        { ...defaultCanvaDesign.elements[7], x: 530, y: 690, width: 230 },
      ]
    }
  },
  {
    name: 'Creative Sunset Gold',
    badge: 'Creative',
    desc: 'Warm orange tones with classic serif typography and boxed cards',
    color: '#ea580c',
    design: {
      canvasBg: '#ffffff',
      primaryColor: '#ea580c',
      fontFamily: 'serif' as const,
      canvasHeight: 1050,
      elements: [
        { ...defaultCanvaDesign.elements[0], x: 40, y: 40, width: 400, textColor: '#ea580c' },
        { ...defaultCanvaDesign.elements[1], x: 480, y: 40, width: 280, textColor: '#ea580c' },
        { ...defaultCanvaDesign.elements[2], x: 40, y: 160, width: 720, borderColor: '#fdba74', bgColor: '#fff7ed' },
        { ...defaultCanvaDesign.elements[3], x: 40, y: 290, width: 720, borderColor: '#ea580c' },
        { ...defaultCanvaDesign.elements[4], x: 480, y: 540, width: 280, bgColor: '#ea580c', textColor: '#ffffff' },
        { ...defaultCanvaDesign.elements[5], x: 40, y: 540, width: 410, bgColor: '#fff7ed', borderColor: '#fdba74' },
        { ...defaultCanvaDesign.elements[6], x: 40, y: 690, width: 440 },
        { ...defaultCanvaDesign.elements[7], x: 520, y: 690, width: 240 },
      ]
    }
  },
  {
    name: 'Emerald Fresh',
    badge: 'Fresh',
    desc: 'Botanical green accents with centered header and rounded cards',
    color: '#059669',
    design: {
      canvasBg: '#ffffff',
      primaryColor: '#059669',
      fontFamily: 'sans' as const,
      canvasHeight: 1050,
      elements: [
        { ...defaultCanvaDesign.elements[0], x: 200, y: 35, width: 400, textAlign: 'center' as const },
        { ...defaultCanvaDesign.elements[1], x: 200, y: 140, width: 400, textAlign: 'center' as const },
        { ...defaultCanvaDesign.elements[2], x: 40, y: 230, width: 720, bgColor: '#ecfdf5', borderColor: '#a7f3d0' },
        { ...defaultCanvaDesign.elements[3], x: 40, y: 360, width: 720 },
        { ...defaultCanvaDesign.elements[4], x: 480, y: 600, width: 280, bgColor: '#059669', textColor: '#ffffff' },
        { ...defaultCanvaDesign.elements[5], x: 40, y: 600, width: 410, bgColor: '#ecfdf5', borderColor: '#a7f3d0' },
        { ...defaultCanvaDesign.elements[6], x: 40, y: 740, width: 440 },
        { ...defaultCanvaDesign.elements[7], x: 520, y: 740, width: 240 },
      ]
    }
  }
];

export default function Settings() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<'canva' | 'profile' | 'permissions'>('canva');
  
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

  // Canva Designer state
  const [design, setDesign] = useState<CanvaLayoutDesign>(defaultCanvaDesign);
  const [selectedElementId, setSelectedElementId] = useState<string | null>('company_header');
  const [zoomLevel, setZoomLevel] = useState<number>(0.85);
  const [sidebarPanel, setSidebarPanel] = useState<'templates' | 'elements' | 'styles'>('templates');

  // Custom layout request modal
  const [isCustomModalOpen, setIsCustomModalOpen] = useState(false);
  const [customFile, setCustomFile] = useState<File | null>(null);
  const [customFilePreview, setCustomFilePreview] = useState<string | null>(null);
  const [customNote, setCustomNote] = useState('');
  const [isSubmittingCustom, setIsSubmittingCustom] = useState(false);

  // Dragging state
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

  const { data: teamMembers, refetch: refetchTeam } = useQuery({
    queryKey: ['teamMembers'],
    queryFn: async () => {
      const token = await getToken();
      const res = await fetch('/api/team', {
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

      // Load Canva design if saved
      if (settings.invoiceLayout) {
        try {
          if (settings.invoiceLayout.startsWith('{')) {
            const parsed = JSON.parse(settings.invoiceLayout);
            if (parsed.elements && Array.isArray(parsed.elements)) {
              setDesign(parsed);
            }
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
      toast.success('Canva layout & settings saved successfully!');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to update settings');
    }
  });

  const handleSaveDesign = () => {
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
      invoiceLayout: JSON.stringify(design),
    };
    mutation.mutate(payload);
  };

  // Submit custom template request for team review
  const handleSubmitCustomRequest = async () => {
    if (!customFile) {
      toast.error('Please select an invoice design or photo to upload');
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

      toast.success('Custom design submitted! Our team will review it and grant you access.');
      setIsCustomModalOpen(false);
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

  // Update team member permission
  const handleUpdatePermission = async (userId: number, updates: any) => {
    try {
      const token = await getToken();
      const res = await fetch(`/api/team/${userId}/permissions`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(updates),
      });

      if (!res.ok) throw new Error('Failed to update member permissions');
      toast.success('Member permissions updated successfully!');
      refetchTeam();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update permissions');
    }
  };

  // Drag and drop event handlers
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
    toast.success('✨ Auto-Aligned all bill sections with perfect professional spacing!');
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
      {/* Top Navigation Bar */}
      <div className="p-4 sm:p-6 bg-white border-b border-gray-200 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="px-3 py-1 rounded-full text-xs font-black bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-xs">
              STUDIO
            </span>
            <h1 className="text-xl font-black text-gray-900 tracking-tight">Organization & Bill Settings</h1>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Customize invoice layout, organization profile, custom templates, and user access permissions
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex bg-gray-100 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setActiveTab('canva')}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all ${
                activeTab === 'canva' ? 'bg-white text-black shadow-xs' : 'text-gray-600 hover:text-black'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 inline-block mr-1 text-purple-600" />
              Canva Customizer
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('profile')}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all ${
                activeTab === 'profile' ? 'bg-white text-black shadow-xs' : 'text-gray-600 hover:text-black'
              }`}
            >
              <Building2 className="w-3.5 h-3.5 inline-block mr-1 text-blue-600" />
              Company Details
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('permissions')}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all ${
                activeTab === 'permissions' ? 'bg-white text-black shadow-xs' : 'text-gray-600 hover:text-black'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 inline-block mr-1 text-green-600" />
              Access & Permissions
            </button>
          </div>

          {activeTab === 'canva' && (
            <Button 
              onClick={handleSaveDesign} 
              disabled={mutation.isPending} 
              className="bg-black hover:bg-gray-800 text-white text-xs font-bold px-5 h-9 shadow-md transition-transform active:scale-95"
            >
              {mutation.isPending && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
              Save Design
            </Button>
          )}
        </div>
      </div>

      {/* TAB 1: CANVA STUDIO CUSTOMIZER */}
      {activeTab === 'canva' && (
        <div className="flex flex-col lg:flex-row h-[calc(100vh-135px)] min-h-[720px] border border-gray-200 bg-gray-100 rounded-2xl overflow-hidden shadow-sm">
          
          {/* Canva Left Control Sidebar */}
          <div className="w-full lg:w-80 bg-white border-r border-gray-200 flex flex-col shrink-0">
            {/* Sidebar Navigation */}
            <div className="flex border-b border-gray-100 bg-gray-50/80 p-1.5 gap-1">
              <button
                type="button"
                onClick={() => setSidebarPanel('templates')}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                  sidebarPanel === 'templates' ? 'bg-white text-purple-700 shadow-xs' : 'text-gray-500 hover:text-black'
                }`}
              >
                <LayoutTemplate className="w-3.5 h-3.5" />
                Templates
              </button>
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
                Themes
              </button>
            </div>

            {/* Sidebar Panel Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              
              {/* 1. TEMPLATES & CUSTOM TEMPLATE REQUEST PANEL */}
              {sidebarPanel === 'templates' && (
                <div className="space-y-4">
                  {/* Custom Bill Layout Upload Section (Restored as requested) */}
                  <div className="p-4 rounded-xl border border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50/40 space-y-2.5">
                    <div className="flex items-start gap-2.5">
                      <div className="p-2 bg-amber-100 rounded-lg text-amber-700 shrink-0 mt-0.5">
                        <FileCode className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-black text-amber-950">Have a custom bill layout?</h4>
                        <p className="text-[11px] text-amber-800 leading-tight mt-0.5">
                          Upload your design, and our team will review it and grant you access.
                        </p>
                      </div>
                    </div>

                    <Button
                      type="button"
                      onClick={() => setIsCustomModalOpen(true)}
                      className="w-full bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold h-8 shadow-xs"
                    >
                      <Upload className="w-3.5 h-3.5 mr-1.5" />
                      Upload Custom Design
                    </Button>

                    {/* Show Submitted Requests if any */}
                    {customRequests && customRequests.length > 0 && (
                      <div className="pt-2 border-t border-amber-200/60 space-y-1.5">
                        <p className="text-[10px] font-bold text-amber-900 uppercase tracking-wider">Your Requests</p>
                        {customRequests.map((req: any) => (
                          <div key={req.id} className="p-2 bg-white rounded-lg border border-amber-200 flex items-center justify-between text-[11px]">
                            <span className="font-semibold text-gray-700 truncate max-w-[120px]">
                              {req.note || 'Custom Design'}
                            </span>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              req.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                              req.status === 'REJECTED' ? 'bg-red-100 text-red-800' :
                              'bg-amber-100 text-amber-800'
                            }`}>
                              {req.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-black uppercase tracking-wider text-gray-400">1-Click Layout Presets</p>
                      <span className="text-[10px] text-purple-600 font-bold bg-purple-50 px-2 py-0.5 rounded">Ready to Use</span>
                    </div>

                    {prebuiltCanvaTemplates.map((t, idx) => (
                      <div
                        key={idx}
                        onClick={() => {
                          setDesign(t.design);
                          toast.success(`Applied "${t.name}"! You can drag elements around to customize further.`);
                        }}
                        className="group p-3 rounded-xl border border-gray-200 hover:border-purple-600 cursor-pointer bg-white transition-all hover:shadow-md relative overflow-hidden"
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs font-black text-gray-900 group-hover:text-purple-600 transition-colors">
                            {t.name}
                          </span>
                          <span 
                            className="px-2 py-0.5 rounded-full text-[10px] font-bold text-white shadow-xs"
                            style={{ backgroundColor: t.color }}
                          >
                            {t.badge}
                          </span>
                        </div>
                        <p className="text-[11px] text-gray-500 leading-tight">{t.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 2. ELEMENTS PANEL */}
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

              {/* 3. THEMES & STYLES PANEL */}
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

      {/* TAB 2: COMPANY PROFILE */}
      {activeTab === 'profile' && (
        <Card className="border-0 shadow-sm ring-1 ring-gray-100 max-w-3xl">
          <CardHeader className="bg-gray-50/50 border-b border-gray-100">
            <CardTitle className="text-lg">Organization Profile</CardTitle>
            <CardDescription>This information will appear automatically on your generated invoices</CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Company Name *</Label>
                <Input 
                  value={companyName} 
                  onChange={(e) => setCompanyName(e.target.value)} 
                  placeholder="Your Business Name"
                />
              </div>
              <div className="space-y-2">
                <Label>Email Address</Label>
                <Input 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  placeholder="billing@yourcompany.com"
                />
              </div>
              <div className="space-y-2">
                <Label>Phone Number</Label>
                <Input 
                  value={phone} 
                  onChange={(e) => setPhone(e.target.value)} 
                  placeholder="+91 9876543210"
                />
              </div>
              <div className="space-y-2">
                <Label>GST / Tax Number</Label>
                <Input 
                  value={gstNo} 
                  onChange={(e) => setGstNo(e.target.value)} 
                  placeholder="33AAAAA0000A1Z5"
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Business Address</Label>
                <Input 
                  value={address} 
                  onChange={(e) => setAddress(e.target.value)} 
                  placeholder="Street, City, State, PIN"
                />
              </div>

              {/* Bank Details */}
              <div className="space-y-2 sm:col-span-2 pt-2 border-t border-gray-100">
                <h4 className="text-sm font-semibold text-gray-900">Bank & Payment Information (Optional)</h4>
              </div>
              <div className="space-y-2">
                <Label>Bank Name</Label>
                <Input 
                  value={bankName} 
                  onChange={(e) => setBankName(e.target.value)} 
                  placeholder="State Bank of India"
                />
              </div>
              <div className="space-y-2">
                <Label>Account Number</Label>
                <Input 
                  value={accountNo} 
                  onChange={(e) => setAccountNo(e.target.value)} 
                  placeholder="123456789012"
                />
              </div>
              <div className="space-y-2">
                <Label>IFSC Code</Label>
                <Input 
                  value={ifsc} 
                  onChange={(e) => setIfsc(e.target.value)} 
                  placeholder="SBIN0001234"
                />
              </div>
              <div className="space-y-2">
                <Label>UPI ID</Label>
                <Input 
                  value={upiId} 
                  onChange={(e) => setUpiId(e.target.value)} 
                  placeholder="business@upi"
                />
              </div>

              {/* Logo Upload */}
              <div className="space-y-2 sm:col-span-2 pt-2 border-t border-gray-100">
                <Label>Company Logo</Label>
                <Input 
                  type="file" 
                  accept="image/*"
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
                onClick={handleSaveDesign} 
                disabled={mutation.isPending} 
                className="bg-black hover:bg-gray-800 text-white"
              >
                {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Company Profile
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* TAB 3: ACCESS & PERMISSIONS CONTROL (READ, WRITE, LAYOUT ACCESS) */}
      {activeTab === 'permissions' && (
        <div className="space-y-6 max-w-5xl">
          {/* Permissions Overview Cards */}
          <div className="grid sm:grid-cols-3 gap-4">
            <Card className="border border-blue-100 bg-blue-50/40 shadow-xs">
              <CardContent className="p-4 flex items-start gap-3">
                <div className="p-2 bg-blue-100 text-blue-700 rounded-xl">
                  <Eye className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-blue-950">Read Access</h4>
                  <p className="text-[11px] text-blue-800 mt-0.5">Can view dashboard metrics, history list, and download PDFs</p>
                </div>
              </CardContent>
            </Card>

            <Card className="border border-emerald-100 bg-emerald-50/40 shadow-xs">
              <CardContent className="p-4 flex items-start gap-3">
                <div className="p-2 bg-emerald-100 text-emerald-700 rounded-xl">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-emerald-950">Write Access</h4>
                  <p className="text-[11px] text-emerald-800 mt-0.5">Can upload receipts, edit line items, and generate invoices</p>
                </div>
              </CardContent>
            </Card>

            <Card className="border border-purple-100 bg-purple-50/40 shadow-xs">
              <CardContent className="p-4 flex items-start gap-3">
                <div className="p-2 bg-purple-100 text-purple-700 rounded-xl">
                  <Palette className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-purple-950">Layout Customizer Access</h4>
                  <p className="text-[11px] text-purple-800 mt-0.5">Can rearrange canvas sections, change styles, and save layouts</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Team Members Permissions Table */}
          <Card className="border-0 shadow-sm ring-1 ring-gray-100">
            <CardHeader className="bg-gray-50/50 border-b border-gray-100 py-4 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold text-gray-900">Team Members & Access Controls</CardTitle>
                <CardDescription className="text-xs">Manage Read, Write, and Layout Customization permissions per user</CardDescription>
              </div>
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-700">
                {teamMembers?.length || 0} Members
              </span>
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b bg-gray-50/70 text-gray-600">
                    <th className="py-3 px-4 font-bold">User</th>
                    <th className="py-3 px-3 font-bold">Role</th>
                    <th className="py-3 px-3 font-bold text-center">Read Access</th>
                    <th className="py-3 px-3 font-bold text-center">Write Access</th>
                    <th className="py-3 px-3 font-bold text-center">Layout Access</th>
                    <th className="py-3 px-3 font-bold text-center">Customers</th>
                    <th className="py-3 px-4 font-bold text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {teamMembers && teamMembers.length > 0 ? (
                    teamMembers.map((member: any) => (
                      <tr key={member.id} className="hover:bg-gray-50/50">
                        <td className="py-3 px-4">
                          <p className="font-bold text-gray-900">{member.name || member.email?.split('@')[0]}</p>
                          <p className="text-[11px] text-gray-500 font-mono">{member.email}</p>
                        </td>
                        <td className="py-3 px-3">
                          <select
                            value={member.role}
                            onChange={(e) => handleUpdatePermission(member.id, { role: e.target.value })}
                            className="text-xs border rounded-lg px-2 py-1 bg-white font-semibold text-gray-800 focus:ring-1 focus:ring-black"
                          >
                            <option value="SUPER_ADMIN">Super Admin</option>
                            <option value="ADMIN">Admin</option>
                            <option value="EMPLOYEE">Employee</option>
                          </select>
                        </td>
                        <td className="py-3 px-3 text-center">
                          <input 
                            type="checkbox"
                            checked={member.canReadInvoices !== false}
                            onChange={(e) => handleUpdatePermission(member.id, { canReadInvoices: e.target.checked })}
                            className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-600 cursor-pointer"
                          />
                        </td>
                        <td className="py-3 px-3 text-center">
                          <input 
                            type="checkbox"
                            checked={member.canWriteInvoices !== false}
                            onChange={(e) => handleUpdatePermission(member.id, { canWriteInvoices: e.target.checked })}
                            className="w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-600 cursor-pointer"
                          />
                        </td>
                        <td className="py-3 px-3 text-center">
                          <input 
                            type="checkbox"
                            checked={member.canCustomizeLayout !== false}
                            onChange={(e) => handleUpdatePermission(member.id, { canCustomizeLayout: e.target.checked })}
                            className="w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-purple-600 cursor-pointer"
                          />
                        </td>
                        <td className="py-3 px-3 text-center">
                          <input 
                            type="checkbox"
                            checked={member.canManageCustomers !== false}
                            onChange={(e) => handleUpdatePermission(member.id, { canManageCustomers: e.target.checked })}
                            className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600 cursor-pointer"
                          />
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => handleUpdatePermission(member.id, { isActive: !member.isActive })}
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              member.isActive !== false ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {member.isActive !== false ? 'Active' : 'Disabled'}
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-gray-500">
                        No team members registered yet
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Upload Custom Design Request Modal */}
      <Dialog open={isCustomModalOpen} onOpenChange={setIsCustomModalOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-amber-100 text-amber-700">
                <FileCode className="w-5 h-5" />
              </div>
              <div>
                <DialogTitle className="text-base font-bold text-gray-900">
                  Upload Custom Bill Layout
                </DialogTitle>
                <DialogDescription className="text-xs text-gray-500">
                  Upload your design file and our team will review it and grant access
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {!customFilePreview ? (
              <label 
                htmlFor="customTemplateUploadInput" 
                className="border-2 border-dashed border-amber-200 hover:border-amber-500 bg-amber-50/40 hover:bg-amber-50/70 transition-all rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer text-center group"
              >
                <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 mb-2 group-hover:scale-110 transition-transform">
                  <Upload className="w-5 h-5" />
                </div>
                <p className="text-xs font-bold text-gray-800">
                  Upload your bill layout design / screenshot
                </p>
                <p className="text-[11px] text-gray-500 mt-0.5">
                  PNG, JPG, or PDF format
                </p>
                <input 
                  type="file" 
                  id="customTemplateUploadInput" 
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
              <div className="space-y-2">
                <div className="relative border rounded-xl overflow-hidden bg-gray-900 flex justify-center max-h-[220px]">
                  <img src={customFilePreview} alt="Preview" className="max-h-[220px] object-contain" />
                  <button
                    type="button"
                    onClick={() => {
                      setCustomFile(null);
                      setCustomFilePreview(null);
                    }}
                    className="absolute top-2 right-2 p-1 bg-black/70 hover:bg-black text-white rounded-full transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-[11px] text-center text-gray-500 font-medium">
                  {customFile?.name} ({(customFile ? customFile.size / (1024 * 1024) : 0).toFixed(2)} MB)
                </p>
              </div>
            )}

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-gray-700">Special Notes or Instructions</Label>
              <Input
                value={customNote}
                onChange={(e) => setCustomNote(e.target.value)}
                placeholder="e.g. Please add our custom header banner and tax columns"
                className="h-9 text-xs"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsCustomModalOpen(false);
                setCustomFile(null);
                setCustomFilePreview(null);
              }}
              disabled={isSubmittingCustom}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSubmitCustomRequest}
              disabled={!customFile || isSubmittingCustom}
              className="bg-amber-600 hover:bg-amber-700 text-white font-bold"
            >
              {isSubmittingCustom ? (
                <>
                  <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Submit for Team Review'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
