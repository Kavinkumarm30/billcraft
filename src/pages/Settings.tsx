import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { useAuth } from '../contexts/AuthContext';
import { 
  Loader2, 
  ArrowUp, 
  ArrowDown, 
  Eye, 
  EyeOff, 
  Palette, 
  Type, 
  LayoutTemplate, 
  Building2, 
  Check, 
  Sparkles,
  MoveVertical,
  CheckCircle2
} from 'lucide-react';

export interface LayoutConfig {
  primaryColor: string;
  fontFamily: 'sans' | 'serif' | 'mono';
  headerAlignment: 'left' | 'center' | 'right' | 'split';
  tableHeaderStyle: 'accent' | 'dark' | 'light' | 'minimal';
  borderStyle: 'clean' | 'card' | 'double' | 'rounded';
  showLogo: boolean;
  showGst: boolean;
  showPhone: boolean;
  showAddress: boolean;
  showNotes: boolean;
  showSignature: boolean;
  showBankDetails: boolean;
  showFooterMessage: boolean;
  signatureText: string;
  footerMessage: string;
  sectionOrder: string[];
}

export const defaultLayoutConfig: LayoutConfig = {
  primaryColor: '#18181b', // Obsidian Black
  fontFamily: 'sans',
  headerAlignment: 'split',
  tableHeaderStyle: 'light',
  borderStyle: 'card',
  showLogo: true,
  showGst: true,
  showPhone: true,
  showAddress: true,
  showNotes: true,
  showSignature: true,
  showBankDetails: false,
  showFooterMessage: true,
  signatureText: 'Authorized Signature',
  footerMessage: 'Thank you for your business!',
  sectionOrder: ['header', 'billed_to', 'table', 'totals', 'bank_details', 'notes_signature']
};

const sectionNames: Record<string, { label: string; desc: string }> = {
  header: { label: 'Header & Company Details', desc: 'Logo, Company name, GST, and Invoice Meta' },
  billed_to: { label: 'Billed To (Customer Details)', desc: 'Customer name, phone, billing address' },
  table: { label: 'Items & Products Table', desc: 'Item description, quantity, rate, and amounts' },
  totals: { label: 'Summary & Grand Total', desc: 'Subtotal, discounts, tax, and total amount' },
  bank_details: { label: 'Bank & UPI Payment Info', desc: 'Bank Name, Account #, IFSC, and UPI ID' },
  notes_signature: { label: 'Notes, Signature & Footer', desc: 'Terms, authorized sign line, and thank you message' }
};

const colorPresets = [
  { name: 'Obsidian Black', hex: '#18181b' },
  { name: 'Royal Blue', hex: '#2563eb' },
  { name: 'Emerald Green', hex: '#059669' },
  { name: 'Sunset Orange', hex: '#ea580c' },
  { name: 'Ruby Red', hex: '#dc2626' },
  { name: 'Deep Purple', hex: '#7c3aed' },
  { name: 'Warm Amber', hex: '#d97706' },
  { name: 'Slate Charcoal', hex: '#475569' },
  { name: 'Rose Pink', hex: '#e11d48' },
  { name: 'Cyan Ocean', hex: '#0891b2' },
];

export default function Settings() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<'profile' | 'layout'>('layout');
  
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

  // Layout Builder configuration state
  const [layoutConfig, setLayoutConfig] = useState<LayoutConfig>(defaultLayoutConfig);

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

      // Parse custom layout config if saved
      if (settings.invoiceLayout) {
        try {
          if (settings.invoiceLayout.startsWith('{')) {
            const parsed = JSON.parse(settings.invoiceLayout);
            setLayoutConfig({ ...defaultLayoutConfig, ...parsed });
          } else {
            // Map legacy preset names to customizer settings
            const presetMap: Record<string, Partial<LayoutConfig>> = {
              'modern': { headerAlignment: 'split', tableHeaderStyle: 'dark', primaryColor: '#2563eb' },
              'minimal': { headerAlignment: 'center', tableHeaderStyle: 'minimal', primaryColor: '#18181b', borderStyle: 'clean' },
              'bold': { primaryColor: '#000000', tableHeaderStyle: 'dark', borderStyle: 'card' },
              'elegant': { fontFamily: 'serif', primaryColor: '#78350f', borderStyle: 'double' },
              'tech': { fontFamily: 'mono', primaryColor: '#0284c7', borderStyle: 'card' },
              'orange-classic': { primaryColor: '#ea580c', fontFamily: 'serif', borderStyle: 'double', tableHeaderStyle: 'accent' },
            };
            if (presetMap[settings.invoiceLayout]) {
              setLayoutConfig({ ...defaultLayoutConfig, ...presetMap[settings.invoiceLayout] });
            }
          }
        } catch (e) {
          console.error("Error parsing layout config:", e);
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
      toast.success('Settings and bill layout saved successfully!');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to update settings');
    }
  });

  const handleSave = () => {
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
      invoiceLayout: JSON.stringify(layoutConfig),
    };
    mutation.mutate(payload);
  };

  // Section Reordering Helpers
  const moveSection = (index: number, direction: 'up' | 'down') => {
    const newOrder = [...layoutConfig.sectionOrder];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newOrder.length) return;
    
    const [moved] = newOrder.splice(index, 1);
    newOrder.splice(targetIndex, 0, moved);
    setLayoutConfig(prev => ({ ...prev, sectionOrder: newOrder }));
  };

  const applyPreset = (preset: Partial<LayoutConfig>) => {
    setLayoutConfig(prev => ({
      ...prev,
      ...preset,
      sectionOrder: preset.sectionOrder || prev.sectionOrder
    }));
    toast.success('Preset applied! Click Save to apply across all invoices.');
  };

  if (isLoading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Company & Bill Settings</h1>
          <p className="text-gray-500 mt-1">Customize your organization details and visually design your invoice layout</p>
        </div>
        <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-xl">
          <button
            type="button"
            onClick={() => setActiveTab('layout')}
            className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all ${
              activeTab === 'layout' ? 'bg-white text-black shadow-sm' : 'text-gray-600 hover:text-black'
            }`}
          >
            <Sparkles className="w-4 h-4 inline-block mr-1.5 text-orange-500" />
            Visual Bill Customizer
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all ${
              activeTab === 'profile' ? 'bg-white text-black shadow-sm' : 'text-gray-600 hover:text-black'
            }`}
          >
            <Building2 className="w-4 h-4 inline-block mr-1.5 text-blue-500" />
            Company Profile
          </button>
        </div>
      </div>

      {/* TAB 1: VISUAL BILL CUSTOMIZER */}
      {activeTab === 'layout' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Controls Column (5 cols) */}
          <div className="lg:col-span-6 space-y-6">
            
            {/* Quick Presets */}
            <Card className="border-0 shadow-sm ring-1 ring-gray-100">
              <CardHeader className="py-4 border-b border-gray-100">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <LayoutTemplate className="w-4 h-4 text-purple-600" />
                  Quick Style Presets
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm"
                    className="text-xs justify-start h-9"
                    onClick={() => applyPreset({
                      primaryColor: '#18181b',
                      fontFamily: 'sans',
                      headerAlignment: 'split',
                      tableHeaderStyle: 'light',
                      borderStyle: 'card'
                    })}
                  >
                    ✨ Standard Modern
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm"
                    className="text-xs justify-start h-9"
                    onClick={() => applyPreset({
                      primaryColor: '#2563eb',
                      fontFamily: 'sans',
                      headerAlignment: 'split',
                      tableHeaderStyle: 'dark',
                      borderStyle: 'card'
                    })}
                  >
                    🔷 Royal Corporate
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm"
                    className="text-xs justify-start h-9"
                    onClick={() => applyPreset({
                      primaryColor: '#059669',
                      fontFamily: 'sans',
                      headerAlignment: 'split',
                      tableHeaderStyle: 'accent',
                      borderStyle: 'rounded'
                    })}
                  >
                    🍃 Fresh Emerald
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm"
                    className="text-xs justify-start h-9"
                    onClick={() => applyPreset({
                      primaryColor: '#ea580c',
                      fontFamily: 'serif',
                      headerAlignment: 'split',
                      tableHeaderStyle: 'accent',
                      borderStyle: 'double'
                    })}
                  >
                    🍊 Orange Classic
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm"
                    className="text-xs justify-start h-9"
                    onClick={() => applyPreset({
                      primaryColor: '#18181b',
                      fontFamily: 'sans',
                      headerAlignment: 'center',
                      tableHeaderStyle: 'minimal',
                      borderStyle: 'clean'
                    })}
                  >
                    📄 Minimal Clean
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm"
                    className="text-xs justify-start h-9"
                    onClick={() => applyPreset({
                      primaryColor: '#78350f',
                      fontFamily: 'serif',
                      headerAlignment: 'split',
                      tableHeaderStyle: 'light',
                      borderStyle: 'double'
                    })}
                  >
                    🏛️ Luxury Serif
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Move & Reorder Sections */}
            <Card className="border-0 shadow-sm ring-1 ring-gray-100">
              <CardHeader className="py-4 border-b border-gray-100">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <MoveVertical className="w-4 h-4 text-blue-600" />
                  Move & Rearrange Bill Sections
                </CardTitle>
                <CardDescription>
                  Use the arrows to reposition sections anywhere on the bill in real-time
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 space-y-2.5">
                {layoutConfig.sectionOrder.map((sectionId, idx) => {
                  const meta = sectionNames[sectionId] || { label: sectionId, desc: '' };
                  return (
                    <div 
                      key={sectionId} 
                      className="flex items-center justify-between p-3 bg-gray-50/80 hover:bg-gray-100/80 rounded-xl border border-gray-200/80 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-full bg-white border border-gray-200 flex items-center justify-center text-xs font-bold text-gray-700 shadow-sm">
                          {idx + 1}
                        </span>
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{meta.label}</p>
                          <p className="text-xs text-gray-500">{meta.desc}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button 
                          type="button" 
                          size="icon" 
                          variant="ghost" 
                          className="h-8 w-8 text-gray-600 hover:text-black hover:bg-white disabled:opacity-30"
                          disabled={idx === 0}
                          onClick={() => moveSection(idx, 'up')}
                          title="Move Up"
                        >
                          <ArrowUp className="h-4 w-4" />
                        </Button>
                        <Button 
                          type="button" 
                          size="icon" 
                          variant="ghost" 
                          className="h-8 w-8 text-gray-600 hover:text-black hover:bg-white disabled:opacity-30"
                          disabled={idx === layoutConfig.sectionOrder.length - 1}
                          onClick={() => moveSection(idx, 'down')}
                          title="Move Down"
                        >
                          <ArrowDown className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            {/* Colors & Fonts */}
            <Card className="border-0 shadow-sm ring-1 ring-gray-100">
              <CardHeader className="py-4 border-b border-gray-100">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Palette className="w-4 h-4 text-emerald-600" />
                  Colors & Typography
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                {/* Color Swatches */}
                <div className="space-y-2">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-gray-500">Theme Color</Label>
                  <div className="flex flex-wrap gap-2 items-center">
                    {colorPresets.map(c => (
                      <button
                        key={c.hex}
                        type="button"
                        onClick={() => setLayoutConfig(p => ({ ...p, primaryColor: c.hex }))}
                        className={`w-8 h-8 rounded-full flex items-center justify-center transition-transform hover:scale-110 shadow-sm ${
                          layoutConfig.primaryColor === c.hex ? 'ring-2 ring-offset-2 ring-black scale-110' : ''
                        }`}
                        style={{ backgroundColor: c.hex }}
                        title={c.name}
                      >
                        {layoutConfig.primaryColor === c.hex && <Check className="w-4 h-4 text-white" />}
                      </button>
                    ))}
                    <div className="flex items-center gap-1.5 ml-2 border rounded-lg px-2 py-1 bg-gray-50">
                      <input 
                        type="color" 
                        value={layoutConfig.primaryColor}
                        onChange={(e) => setLayoutConfig(p => ({ ...p, primaryColor: e.target.value }))}
                        className="w-6 h-6 rounded cursor-pointer border-0 bg-transparent" 
                      />
                      <span className="text-xs font-mono font-medium text-gray-700 uppercase">{layoutConfig.primaryColor}</span>
                    </div>
                  </div>
                </div>

                {/* Typography Selection */}
                <div className="grid grid-cols-3 gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setLayoutConfig(p => ({ ...p, fontFamily: 'sans' }))}
                    className={`p-2.5 rounded-lg border text-center transition-all ${
                      layoutConfig.fontFamily === 'sans' ? 'border-black bg-gray-50 font-bold ring-1 ring-black' : 'border-gray-200'
                    }`}
                  >
                    <div className="text-sm font-sans">Modern Sans</div>
                    <div className="text-[10px] text-gray-500">Inter / Roboto</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setLayoutConfig(p => ({ ...p, fontFamily: 'serif' }))}
                    className={`p-2.5 rounded-lg border text-center transition-all ${
                      layoutConfig.fontFamily === 'serif' ? 'border-black bg-gray-50 font-bold ring-1 ring-black' : 'border-gray-200'
                    }`}
                  >
                    <div className="text-sm font-serif">Classic Serif</div>
                    <div className="text-[10px] text-gray-500">Merriweather</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setLayoutConfig(p => ({ ...p, fontFamily: 'mono' }))}
                    className={`p-2.5 rounded-lg border text-center transition-all ${
                      layoutConfig.fontFamily === 'mono' ? 'border-black bg-gray-50 font-bold ring-1 ring-black' : 'border-gray-200'
                    }`}
                  >
                    <div className="text-sm font-mono">Tech Mono</div>
                    <div className="text-[10px] text-gray-500">Fira Code</div>
                  </button>
                </div>
              </CardContent>
            </Card>

            {/* Header & Table Alignment Options */}
            <Card className="border-0 shadow-sm ring-1 ring-gray-100">
              <CardHeader className="py-4 border-b border-gray-100">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Type className="w-4 h-4 text-indigo-600" />
                  Header & Table Styles
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                <div className="space-y-2">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-gray-500">Header Layout</Label>
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { id: 'split', label: 'Split Left/Right' },
                      { id: 'left', label: 'All Left' },
                      { id: 'center', label: 'Centered' },
                      { id: 'right', label: 'Reversed' },
                    ].map(h => (
                      <button
                        key={h.id}
                        type="button"
                        onClick={() => setLayoutConfig(p => ({ ...p, headerAlignment: h.id as any }))}
                        className={`p-2 rounded-lg border text-xs text-center font-medium transition-all ${
                          layoutConfig.headerAlignment === h.id ? 'border-black bg-black text-white' : 'border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        {h.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2 pt-2">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-gray-500">Table Header Style</Label>
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { id: 'light', label: 'Light Gray' },
                      { id: 'accent', label: 'Theme Accent' },
                      { id: 'dark', label: 'Solid Black' },
                      { id: 'minimal', label: 'Minimalist' },
                    ].map(t => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setLayoutConfig(p => ({ ...p, tableHeaderStyle: t.id as any }))}
                        className={`p-2 rounded-lg border text-xs text-center font-medium transition-all ${
                          layoutConfig.tableHeaderStyle === t.id ? 'border-black bg-black text-white' : 'border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Show/Hide Toggles */}
                <div className="space-y-3 pt-3 border-t border-gray-100">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-gray-500">Visible Elements</Label>
                  <div className="grid grid-cols-2 gap-3">
                    <label className="flex items-center gap-2 text-xs font-medium text-gray-700 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={layoutConfig.showLogo}
                        onChange={(e) => setLayoutConfig(p => ({ ...p, showLogo: e.target.checked }))}
                        className="rounded text-black focus:ring-black" 
                      />
                      <span>Show Logo</span>
                    </label>
                    <label className="flex items-center gap-2 text-xs font-medium text-gray-700 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={layoutConfig.showGst}
                        onChange={(e) => setLayoutConfig(p => ({ ...p, showGst: e.target.checked }))}
                        className="rounded text-black focus:ring-black" 
                      />
                      <span>Show GST Number</span>
                    </label>
                    <label className="flex items-center gap-2 text-xs font-medium text-gray-700 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={layoutConfig.showSignature}
                        onChange={(e) => setLayoutConfig(p => ({ ...p, showSignature: e.target.checked }))}
                        className="rounded text-black focus:ring-black" 
                      />
                      <span>Authorized Signature</span>
                    </label>
                    <label className="flex items-center gap-2 text-xs font-medium text-gray-700 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={layoutConfig.showBankDetails}
                        onChange={(e) => setLayoutConfig(p => ({ ...p, showBankDetails: e.target.checked }))}
                        className="rounded text-black focus:ring-black" 
                      />
                      <span>Bank & UPI Details</span>
                    </label>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Save Button */}
            <div className="sticky bottom-4 z-10 bg-white/95 backdrop-blur p-4 rounded-2xl border shadow-lg flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-gray-900">Apply Layout Globally</p>
                <p className="text-xs text-gray-500">Saves your custom bill styling to all generated invoices</p>
              </div>
              <Button 
                onClick={handleSave} 
                disabled={mutation.isPending} 
                className="bg-black hover:bg-gray-800 text-white px-6 font-semibold"
              >
                {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Bill Layout
              </Button>
            </div>
          </div>

          {/* Right Column: Live Interactive Bill Preview (6 cols) */}
          <div className="lg:col-span-6 sticky top-6">
            <Card className="border-0 shadow-sm ring-1 ring-gray-200 overflow-hidden">
              <CardHeader className="py-3 px-4 bg-gray-900 text-white flex flex-row items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-green-400 animate-pulse"></div>
                  <CardTitle className="text-xs font-bold uppercase tracking-wider text-gray-200">Live Bill Preview</CardTitle>
                </div>
                <span className="text-[11px] text-gray-400">Updates in real-time</span>
              </CardHeader>
              
              {/* Dynamic Live Invoice Mockup */}
              <div className="p-6 bg-gray-100 flex justify-center overflow-auto max-h-[850px]">
                <div 
                  className={`w-full max-w-[540px] bg-white p-6 shadow-md transition-all ${
                    layoutConfig.fontFamily === 'serif' ? 'font-serif' : 
                    layoutConfig.fontFamily === 'mono' ? 'font-mono' : 'font-sans'
                  } ${
                    layoutConfig.borderStyle === 'double' ? 'border-[3px] border-double' : 
                    layoutConfig.borderStyle === 'rounded' ? 'border-2 rounded-2xl' : 'border border-gray-200'
                  }`}
                  style={{ borderColor: layoutConfig.primaryColor }}
                >
                  {/* Render sections in the dynamic order */}
                  {layoutConfig.sectionOrder.map((sec) => {
                    if (sec === 'header') {
                      return (
                        <div 
                          key="header" 
                          className={`pb-4 mb-4 border-b flex ${
                            layoutConfig.headerAlignment === 'center' ? 'flex-col items-center text-center gap-3' :
                            layoutConfig.headerAlignment === 'right' ? 'flex-row-reverse justify-between text-right' :
                            layoutConfig.headerAlignment === 'left' ? 'flex-col items-start gap-2' :
                            'justify-between items-start'
                          }`}
                          style={{ borderColor: layoutConfig.primaryColor + '40' }}
                        >
                          <div className={`flex items-center gap-3 ${layoutConfig.headerAlignment === 'center' ? 'flex-col' : ''}`}>
                            {layoutConfig.showLogo && (
                              logoUrl ? (
                                <img src={logoUrl} alt="Logo" className="h-10 w-10 object-contain rounded" />
                              ) : (
                                <div 
                                  className="h-10 w-10 rounded-lg flex items-center justify-center text-white shadow-sm font-bold text-xs"
                                  style={{ backgroundColor: layoutConfig.primaryColor }}
                                >
                                  {companyName ? companyName.slice(0, 2).toUpperCase() : 'BC'}
                                </div>
                              )
                            )}
                            <div>
                              <h2 className="text-base font-bold" style={{ color: layoutConfig.primaryColor }}>
                                {companyName || 'My Company Name'}
                              </h2>
                              {layoutConfig.showAddress && (
                                <p className="text-[11px] text-gray-500 leading-tight">{address || '123 Business Way, Suite 100'}</p>
                              )}
                              {layoutConfig.showGst && gstNo && (
                                <p className="text-[10px] font-semibold text-gray-600">GST: {gstNo}</p>
                              )}
                            </div>
                          </div>

                          <div className={`space-y-0.5 ${layoutConfig.headerAlignment === 'center' ? 'text-center' : 'text-right'}`}>
                            <span 
                              className="text-lg font-black tracking-wider uppercase opacity-80"
                              style={{ color: layoutConfig.primaryColor }}
                            >
                              INVOICE
                            </span>
                            <p className="text-[11px] font-medium text-gray-700">INV-849201</p>
                            <p className="text-[10px] text-gray-500">Date: {new Date().toISOString().split('T')[0]}</p>
                            <div className="mt-1">
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-100 text-green-800 border border-green-200">
                                <CheckCircle2 className="w-2.5 h-2.5 text-green-600" />
                                PAID
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    }

                    if (sec === 'billed_to') {
                      return (
                        <div key="billed_to" className="mb-4 text-xs">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Billed To</span>
                          <p className="font-bold text-gray-900 mt-0.5">m.kavinkumar</p>
                          <p className="text-gray-500 text-[11px]">1/239 kk palli, Phone: +91 9361654668</p>
                        </div>
                      );
                    }

                    if (sec === 'table') {
                      return (
                        <div key="table" className="mb-4">
                          <table className="w-full text-left text-xs border-collapse">
                            <thead>
                              <tr 
                                className="border-b"
                                style={{
                                  backgroundColor: layoutConfig.tableHeaderStyle === 'accent' ? layoutConfig.primaryColor :
                                                   layoutConfig.tableHeaderStyle === 'dark' ? '#18181b' :
                                                   layoutConfig.tableHeaderStyle === 'light' ? '#f3f4f6' : 'transparent',
                                  color: (layoutConfig.tableHeaderStyle === 'accent' || layoutConfig.tableHeaderStyle === 'dark') ? '#ffffff' : '#374151'
                                }}
                              >
                                <th className="py-1.5 px-2 font-semibold">Description</th>
                                <th className="py-1.5 px-2 text-center">Qty</th>
                                <th className="py-1.5 px-2 text-right">Rate</th>
                                <th className="py-1.5 px-2 text-right">Amount</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 text-[11px]">
                              <tr>
                                <td className="py-1.5 px-2 text-gray-800 font-medium">Sample Item 1</td>
                                <td className="py-1.5 px-2 text-center text-gray-600">2</td>
                                <td className="py-1.5 px-2 text-right text-gray-600">₹250.00</td>
                                <td className="py-1.5 px-2 text-right font-medium text-gray-900">₹500.00</td>
                              </tr>
                              <tr>
                                <td className="py-1.5 px-2 text-gray-800 font-medium">Premium Service 2</td>
                                <td className="py-1.5 px-2 text-center text-gray-600">1</td>
                                <td className="py-1.5 px-2 text-right text-gray-600">₹450.00</td>
                                <td className="py-1.5 px-2 text-right font-medium text-gray-900">₹450.00</td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      );
                    }

                    if (sec === 'totals') {
                      return (
                        <div key="totals" className="flex justify-end pt-2 mb-4 border-t border-gray-100">
                          <div className="w-48 space-y-1 text-xs">
                            <div className="flex justify-between text-gray-600">
                              <span>Subtotal</span>
                              <span>₹950.00</span>
                            </div>
                            <div className="flex justify-between text-gray-600">
                              <span>Tax (5%)</span>
                              <span>₹47.50</span>
                            </div>
                            <div 
                              className="flex justify-between font-bold text-sm pt-1.5 border-t mt-1"
                              style={{ borderColor: layoutConfig.primaryColor, color: layoutConfig.primaryColor }}
                            >
                              <span>Total Amount</span>
                              <span>₹997.50</span>
                            </div>
                          </div>
                        </div>
                      );
                    }

                    if (sec === 'bank_details') {
                      if (!layoutConfig.showBankDetails && !bankName && !upiId) return null;
                      return (
                        <div key="bank_details" className="p-2.5 rounded-lg bg-gray-50 border border-gray-200 mb-4 text-[10px]">
                          <span className="font-bold text-gray-800 uppercase tracking-wider block mb-1">Bank & Payment Details</span>
                          <div className="grid grid-cols-2 gap-1 text-gray-600">
                            <div>Bank: <span className="font-medium text-gray-800">{bankName || 'State Bank of India'}</span></div>
                            <div>A/C: <span className="font-medium text-gray-800">{accountNo || 'XXXX123456'}</span></div>
                            <div>IFSC: <span className="font-medium text-gray-800">{ifsc || 'SBIN0001234'}</span></div>
                            <div>UPI ID: <span className="font-medium text-gray-800">{upiId || 'company@upi'}</span></div>
                          </div>
                        </div>
                      );
                    }

                    if (sec === 'notes_signature') {
                      return (
                        <div key="notes_signature" className="pt-2 border-t border-gray-100 text-xs">
                          {layoutConfig.showNotes && (
                            <p className="text-[10px] text-gray-500 mb-3 italic">
                              Notes: Payment due within 15 days of invoice date. Thank you!
                            </p>
                          )}

                          <div className="flex justify-between items-end pt-2">
                            {layoutConfig.showFooterMessage && (
                              <p className="text-[11px] font-semibold" style={{ color: layoutConfig.primaryColor }}>
                                {layoutConfig.footerMessage}
                              </p>
                            )}

                            {layoutConfig.showSignature && (
                              <div className="text-center">
                                <div className="w-28 border-b border-gray-400 mb-1"></div>
                                <span className="text-[10px] text-gray-500 block">{layoutConfig.signatureText}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    }

                    return null;
                  })}
                </div>
              </div>
            </Card>
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
                onClick={handleSave} 
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
