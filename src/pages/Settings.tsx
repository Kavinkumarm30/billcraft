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
  Trash2,
  Eye,
  EyeOff,
  RotateCcw,
  Maximize2,
  ZoomIn,
  ZoomOut,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Bold,
  Plus,
  Sliders,
  CheckCircle2
} from 'lucide-react';

export interface CanvasElement {
  id: string;
  name: string;
  type: 'company_header' | 'invoice_meta' | 'billed_to' | 'items_table' | 'totals_card' | 'bank_details' | 'signature_block' | 'notes_terms' | 'custom_banner';
  x: number; // in pixels relative to 800px width canvas
  y: number; // in pixels
  width: number; // in pixels
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
      name: 'Invoice Title & Details',
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
      y: 175,
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
      y: 310,
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
      y: 570,
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
      y: 570,
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
      y: 720,
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
      y: 720,
      width: 240,
      fontSize: 12,
      textColor: '#4b5563',
      bgColor: 'transparent',
      textAlign: 'center',
      visible: true
    }
  ]
};

const prebuiltCanvaTemplates: { name: string; desc: string; design: CanvaLayoutDesign }[] = [
  {
    name: 'Canva Modern Minimalist',
    desc: 'Clean aesthetics with soft borders & spacious layout',
    design: defaultCanvaDesign
  },
  {
    name: 'Executive Dark Header',
    desc: 'Bold dark top banner with high-contrast summary',
    design: {
      canvasBg: '#ffffff',
      primaryColor: '#0f172a',
      fontFamily: 'sans',
      canvasHeight: 1050,
      elements: [
        { ...defaultCanvaDesign.elements[0], x: 40, y: 40, width: 420 },
        { ...defaultCanvaDesign.elements[1], x: 480, y: 40, width: 280, textColor: '#0f172a' },
        { ...defaultCanvaDesign.elements[2], x: 40, y: 170, width: 720, bgColor: '#f8fafc', borderColor: '#cbd5e1' },
        { ...defaultCanvaDesign.elements[3], x: 40, y: 310, width: 720 },
        { ...defaultCanvaDesign.elements[4], x: 470, y: 570, width: 290, bgColor: '#0f172a', textColor: '#ffffff' },
        { ...defaultCanvaDesign.elements[5], x: 40, y: 570, width: 410, bgColor: '#f8fafc' },
        { ...defaultCanvaDesign.elements[6], x: 40, y: 720, width: 440 },
        { ...defaultCanvaDesign.elements[7], x: 530, y: 720, width: 230 },
      ]
    }
  },
  {
    name: 'Creative Sunset Orange',
    desc: 'Warm orange accents with elegant serif headers',
    design: {
      canvasBg: '#ffffff',
      primaryColor: '#ea580c',
      fontFamily: 'serif',
      canvasHeight: 1050,
      elements: [
        { ...defaultCanvaDesign.elements[0], x: 40, y: 40, width: 400, textColor: '#ea580c' },
        { ...defaultCanvaDesign.elements[1], x: 480, y: 40, width: 280, textColor: '#ea580c' },
        { ...defaultCanvaDesign.elements[2], x: 40, y: 170, width: 720, borderColor: '#fdba74', bgColor: '#fff7ed' },
        { ...defaultCanvaDesign.elements[3], x: 40, y: 305, width: 720, borderColor: '#ea580c' },
        { ...defaultCanvaDesign.elements[4], x: 480, y: 565, width: 280, bgColor: '#ea580c', textColor: '#ffffff' },
        { ...defaultCanvaDesign.elements[5], x: 40, y: 565, width: 410, bgColor: '#fff7ed', borderColor: '#fdba74' },
        { ...defaultCanvaDesign.elements[6], x: 40, y: 720, width: 440 },
        { ...defaultCanvaDesign.elements[7], x: 520, y: 720, width: 240 },
      ]
    }
  },
  {
    name: 'Emerald Corporate',
    desc: 'Fresh botanical green theme with centered header',
    design: {
      canvasBg: '#ffffff',
      primaryColor: '#059669',
      fontFamily: 'sans',
      canvasHeight: 1050,
      elements: [
        { ...defaultCanvaDesign.elements[0], x: 200, y: 40, width: 400, textAlign: 'center' },
        { ...defaultCanvaDesign.elements[1], x: 200, y: 155, width: 400, textAlign: 'center' },
        { ...defaultCanvaDesign.elements[2], x: 40, y: 245, width: 720, bgColor: '#ecfdf5', borderColor: '#a7f3d0' },
        { ...defaultCanvaDesign.elements[3], x: 40, y: 375, width: 720 },
        { ...defaultCanvaDesign.elements[4], x: 480, y: 620, width: 280, bgColor: '#059669', textColor: '#ffffff' },
        { ...defaultCanvaDesign.elements[5], x: 40, y: 620, width: 410, bgColor: '#ecfdf5', borderColor: '#a7f3d0' },
        { ...defaultCanvaDesign.elements[6], x: 40, y: 760, width: 440 },
        { ...defaultCanvaDesign.elements[7], x: 520, y: 760, width: 240 },
      ]
    }
  }
];

export default function Settings() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<'canva' | 'profile'>('canva');
  
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
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [sidebarPanel, setSidebarPanel] = useState<'elements' | 'templates' | 'styles'>('elements');

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
          // Snap to 5px grid for clean alignment
          const rawX = dragStartPosRef.current.elemX + deltaX;
          const rawY = dragStartPosRef.current.elemY + deltaY;
          const snappedX = Math.max(10, Math.min(790 - el.width, Math.round(rawX / 5) * 5));
          const snappedY = Math.max(10, Math.min(prev.canvasHeight - 50, Math.round(rawY / 5) * 5));
          return { ...el, x: snappedX, y: snappedY };
        }

        if (isResizingRef.current) {
          const rawW = dragStartPosRef.current.elemWidth + deltaX;
          const snappedW = Math.max(150, Math.min(780 - el.x, Math.round(rawW / 5) * 5));
          return { ...el, width: snappedW };
        }

        return el;
      });
      return { ...prev, elements: newElements };
    });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
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
      {/* Header Bar */}
      <div className="p-4 sm:p-6 bg-white border-b border-gray-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-800 border border-purple-200">
              Canva Studio Editor
            </span>
            <h1 className="text-xl font-bold text-gray-900 tracking-tight">Invoice Design Studio</h1>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">Click & drag any invoice section anywhere on the canvas just like Canva</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex bg-gray-100 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setActiveTab('canva')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                activeTab === 'canva' ? 'bg-white text-black shadow-sm' : 'text-gray-600 hover:text-black'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 inline-block mr-1 text-purple-600" />
              Canva Editor
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('profile')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                activeTab === 'profile' ? 'bg-white text-black shadow-sm' : 'text-gray-600 hover:text-black'
              }`}
            >
              <Building2 className="w-3.5 h-3.5 inline-block mr-1 text-blue-600" />
              Company Profile
            </button>
          </div>

          {activeTab === 'canva' && (
            <Button 
              onClick={handleSaveDesign} 
              disabled={mutation.isPending} 
              className="bg-black hover:bg-gray-800 text-white text-xs font-semibold px-4 h-9 shadow-sm"
            >
              {mutation.isPending && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
              Save Design
            </Button>
          )}
        </div>
      </div>

      {activeTab === 'canva' && (
        <div className="flex flex-col lg:flex-row h-[calc(100vh-140px)] min-h-[700px] border border-gray-200 bg-gray-100 rounded-xl overflow-hidden shadow-sm">
          
          {/* Canva Left Sidebar */}
          <div className="w-full lg:w-80 bg-white border-r border-gray-200 flex flex-col shrink-0">
            {/* Sidebar Tabs */}
            <div className="flex border-b border-gray-100 bg-gray-50/70 p-1.5 gap-1">
              <button
                type="button"
                onClick={() => setSidebarPanel('elements')}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                  sidebarPanel === 'elements' ? 'bg-white text-black shadow-sm' : 'text-gray-500 hover:text-black'
                }`}
              >
                Elements
              </button>
              <button
                type="button"
                onClick={() => setSidebarPanel('templates')}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                  sidebarPanel === 'templates' ? 'bg-white text-black shadow-sm' : 'text-gray-500 hover:text-black'
                }`}
              >
                Templates
              </button>
              <button
                type="button"
                onClick={() => setSidebarPanel('styles')}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                  sidebarPanel === 'styles' ? 'bg-white text-black shadow-sm' : 'text-gray-500 hover:text-black'
                }`}
              >
                Styles
              </button>
            </div>

            {/* Sidebar Content Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              
              {/* ELEMENTS PANEL */}
              {sidebarPanel === 'elements' && (
                <div className="space-y-3">
                  <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Canvas Elements</p>
                  <div className="space-y-2">
                    {design.elements.map((elem) => (
                      <div
                        key={elem.id}
                        onClick={() => setSelectedElementId(elem.id)}
                        className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                          selectedElementId === elem.id ? 'border-purple-600 bg-purple-50/50 shadow-sm' : 'border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <Move className="w-3.5 h-3.5 text-gray-400" />
                          <div>
                            <p className="text-xs font-semibold text-gray-900">{elem.name}</p>
                            <p className="text-[10px] text-gray-400">Position: ({elem.x}px, {elem.y}px)</p>
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
                          className="p-1 hover:bg-gray-200 rounded text-gray-500"
                          title={elem.visible ? 'Hide' : 'Show'}
                        >
                          {elem.visible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5 text-red-500" />}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TEMPLATES PANEL */}
              {sidebarPanel === 'templates' && (
                <div className="space-y-3">
                  <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Pre-built Canva Layouts</p>
                  <div className="space-y-3">
                    {prebuiltCanvaTemplates.map((t, idx) => (
                      <div
                        key={idx}
                        onClick={() => {
                          setDesign(t.design);
                          toast.success(`Loaded "${t.name}"! You can drag elements around to customize further.`);
                        }}
                        className="p-3 rounded-xl border border-gray-200 hover:border-black cursor-pointer bg-white transition-all hover:shadow-sm"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-bold text-gray-900">{t.name}</span>
                          <span className="w-3 h-3 rounded-full" style={{ backgroundColor: t.design.primaryColor }}></span>
                        </div>
                        <p className="text-[11px] text-gray-500">{t.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* STYLES PANEL */}
              {sidebarPanel === 'styles' && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase tracking-wider text-gray-400">Primary Brand Accent</Label>
                    <div className="flex flex-wrap gap-2 items-center">
                      {['#18181b', '#2563eb', '#059669', '#ea580c', '#dc2626', '#7c3aed', '#0891b2'].map(hex => (
                        <button
                          key={hex}
                          type="button"
                          onClick={() => setDesign(p => ({ ...p, primaryColor: hex }))}
                          className={`w-7 h-7 rounded-full transition-transform hover:scale-110 ${
                            design.primaryColor === hex ? 'ring-2 ring-offset-2 ring-black scale-110' : ''
                          }`}
                          style={{ backgroundColor: hex }}
                        />
                      ))}
                      <input 
                        type="color" 
                        value={design.primaryColor}
                        onChange={(e) => setDesign(p => ({ ...p, primaryColor: e.target.value }))}
                        className="w-7 h-7 rounded cursor-pointer border-0 bg-transparent" 
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase tracking-wider text-gray-400">Typography Font</Label>
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
                          className={`py-2 text-xs font-semibold rounded-lg border text-center transition-all ${
                            design.fontFamily === f.id ? 'border-black bg-black text-white' : 'border-gray-200 hover:bg-gray-50'
                          }`}
                        >
                          {f.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase tracking-wider text-gray-400">Canvas Page Height</Label>
                    <div className="flex items-center gap-2">
                      <Input 
                        type="number"
                        value={design.canvasHeight}
                        onChange={(e) => setDesign(p => ({ ...p, canvasHeight: Math.max(800, parseInt(e.target.value) || 1050) }))}
                        className="h-8 text-xs"
                      />
                      <span className="text-xs text-gray-500">px</span>
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>

          {/* Canva Canvas Workspace */}
          <div className="flex-1 flex flex-col overflow-hidden">
            
            {/* Canva Top Action Toolbar */}
            <div className="p-2.5 bg-white border-b border-gray-200 flex flex-wrap items-center justify-between gap-2 shadow-xs z-10">
              
              {/* Selected Element Quick Formatting Bar */}
              {selectedElem ? (
                <div className="flex items-center gap-2 flex-wrap text-xs">
                  <span className="font-bold text-gray-800 bg-purple-50 text-purple-700 px-2 py-1 rounded border border-purple-200">
                    {selectedElem.name}
                  </span>

                  {/* Text Alignment */}
                  <div className="flex border rounded-lg overflow-hidden">
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

                  {/* Font Size */}
                  <div className="flex items-center gap-1 border rounded-lg px-2 py-0.5 bg-white">
                    <span className="text-gray-400 text-[10px]">Size:</span>
                    <input 
                      type="number" 
                      value={selectedElem.fontSize || 13}
                      onChange={(e) => updateSelectedElement({ fontSize: parseInt(e.target.value) || 12 })}
                      className="w-10 text-xs text-center border-0 p-0 focus:outline-none"
                    />
                  </div>

                  {/* Text Color */}
                  <div className="flex items-center gap-1 border rounded-lg px-2 py-0.5 bg-white">
                    <span className="text-gray-400 text-[10px]">Color:</span>
                    <input 
                      type="color" 
                      value={selectedElem.textColor || '#000000'}
                      onChange={(e) => updateSelectedElement({ textColor: e.target.value })}
                      className="w-5 h-5 rounded cursor-pointer border-0 bg-transparent"
                    />
                  </div>

                  {/* Bg Color */}
                  <div className="flex items-center gap-1 border rounded-lg px-2 py-0.5 bg-white">
                    <span className="text-gray-400 text-[10px]">Bg:</span>
                    <input 
                      type="color" 
                      value={selectedElem.bgColor && selectedElem.bgColor !== 'transparent' ? selectedElem.bgColor : '#ffffff'}
                      onChange={(e) => updateSelectedElement({ bgColor: e.target.value })}
                      className="w-5 h-5 rounded cursor-pointer border-0 bg-transparent"
                    />
                    <button 
                      type="button" 
                      onClick={() => updateSelectedElement({ bgColor: 'transparent' })}
                      className="text-[10px] text-gray-500 hover:text-black"
                    >
                      Clear
                    </button>
                  </div>

                  {/* Position Coordinates Display */}
                  <div className="text-[11px] text-gray-400 ml-2">
                    X: <span className="font-mono text-gray-700">{selectedElem.x}px</span> | Y: <span className="font-mono text-gray-700">{selectedElem.y}px</span> | W: <span className="font-mono text-gray-700">{selectedElem.width}px</span>
                  </div>
                </div>
              ) : (
                <div className="text-xs text-gray-500 flex items-center gap-1.5">
                  <Move className="w-3.5 h-3.5 text-purple-600 animate-bounce" />
                  <span>Click and drag any box on the canvas below to reposition it freely</span>
                </div>
              )}

              {/* Zoom Controls */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setZoomLevel(prev => Math.max(0.6, prev - 0.1))}
                  className="p-1 hover:bg-gray-100 rounded text-gray-600"
                  title="Zoom Out"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <span className="text-xs font-mono text-gray-600 font-semibold">{Math.round(zoomLevel * 100)}%</span>
                <button
                  type="button"
                  onClick={() => setZoomLevel(prev => Math.min(1.4, prev + 0.1))}
                  className="p-1 hover:bg-gray-100 rounded text-gray-600"
                  title="Zoom In"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setZoomLevel(1)}
                  className="text-[11px] text-gray-500 hover:text-black underline ml-1"
                >
                  Reset Zoom
                </button>
              </div>

            </div>

            {/* Interactive Canvas Board */}
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
                {/* Visual Canvas Grid Background Indicator */}
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#f1f5f9_1px,transparent_1px),linear-gradient(to_bottom,#f1f5f9_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none opacity-40"></div>

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
                          ? 'ring-2 ring-purple-600 ring-offset-2 shadow-lg z-30' 
                          : 'hover:ring-1 hover:ring-purple-400 hover:shadow-md'
                      }`}
                    >
                      {/* Canva Selection Badge & Drag Handle */}
                      {isSelected && (
                        <>
                          <div className="absolute -top-6 left-0 bg-purple-600 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-sm flex items-center gap-1 pointer-events-none">
                            <Move className="w-2.5 h-2.5" />
                            {el.name}
                          </div>
                          
                          {/* Right Resize Handle */}
                          <div 
                            onPointerDown={(e) => handlePointerDown(e, el.id, true)}
                            className="absolute -right-1.5 top-1/2 -translate-y-1/2 w-3 h-6 bg-purple-600 rounded-sm cursor-ew-resize hover:scale-125 transition-transform z-40"
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
                              className="h-12 w-12 rounded-lg flex items-center justify-center text-white shadow-sm font-bold text-base shrink-0"
                              style={{ backgroundColor: design.primaryColor }}
                            >
                              {companyName ? companyName.slice(0, 2).toUpperCase() : 'BC'}
                            </div>
                          )}
                          <div>
                            <h2 className="text-lg font-bold leading-tight" style={{ color: design.primaryColor }}>
                              {companyName || 'My Company Name'}
                            </h2>
                            <p className="text-xs text-gray-500 leading-tight mt-0.5">{address || '123 Business Way, Suite 100'}</p>
                            {gstNo && <p className="text-[11px] font-semibold text-gray-600 mt-0.5">GST: {gstNo}</p>}
                          </div>
                        </div>
                      )}

                      {el.type === 'invoice_meta' && (
                        <div className="space-y-0.5">
                          <h3 className="text-2xl font-black tracking-wider uppercase leading-none" style={{ color: design.primaryColor }}>
                            INVOICE
                          </h3>
                          <p className="text-xs font-semibold text-gray-900">Invoice No: INV-591499</p>
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
                          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">Billed To</p>
                          <p className="font-bold text-base text-gray-900">m.kavinkumar</p>
                          <p className="text-xs text-gray-500 mt-0.5">1/239 kk palli, Phone: +91 9361654668</p>
                        </div>
                      )}

                      {el.type === 'items_table' && (
                        <table className="w-full text-left border-collapse text-xs">
                          <thead>
                            <tr className="border-b bg-gray-50/80">
                              <th className="py-2 px-3 font-bold text-gray-700">Description</th>
                              <th className="py-2 px-3 font-bold text-gray-700 text-center">Qty</th>
                              <th className="py-2 px-3 font-bold text-gray-700 text-right">Rate</th>
                              <th className="py-2 px-3 font-bold text-gray-700 text-right">Amount</th>
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
                            <span className="font-medium">₹950.00</span>
                          </div>
                          <div className="flex justify-between text-gray-600">
                            <span>Tax (5%):</span>
                            <span className="font-medium">₹47.50</span>
                          </div>
                          <div 
                            className="flex justify-between font-bold text-base pt-2 border-t mt-1"
                            style={{ borderColor: design.primaryColor, color: el.textColor || design.primaryColor }}
                          >
                            <span>Total Amount:</span>
                            <span>₹997.50</span>
                          </div>
                        </div>
                      )}

                      {el.type === 'bank_details' && (
                        <div>
                          <p className="font-bold text-xs uppercase tracking-wider text-gray-700 mb-1">Bank & Payment Details</p>
                          <div className="grid grid-cols-2 gap-1 text-[11px] text-gray-600">
                            <div>Bank: <span className="font-semibold text-gray-800">{bankName || 'State Bank of India'}</span></div>
                            <div>A/C: <span className="font-semibold text-gray-800">{accountNo || 'XXXX123456'}</span></div>
                            <div>IFSC: <span className="font-semibold text-gray-800">{ifsc || 'SBIN0001234'}</span></div>
                            <div>UPI: <span className="font-semibold text-gray-800">{upiId || 'company@upi'}</span></div>
                          </div>
                        </div>
                      )}

                      {el.type === 'notes_terms' && (
                        <div>
                          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Notes & Terms</p>
                          <p className="text-xs text-gray-600 leading-relaxed">
                            Payment due within 15 days of invoice date. Thank you for your business!
                          </p>
                        </div>
                      )}

                      {el.type === 'signature_block' && (
                        <div className="text-center">
                          <div className="w-32 border-b border-gray-400 mx-auto mb-1.5"></div>
                          <p className="text-xs font-semibold text-gray-700">Authorized Signature</p>
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
    </div>
  );
}
