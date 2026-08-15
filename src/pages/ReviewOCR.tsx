import LoadingScreen from '../components/LoadingScreen';
import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Plus, Trash2, ArrowRight, Loader2, CreditCard, CheckCircle2, Circle, ChevronLeft, ChevronRight, Layers, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../contexts/AuthContext';
import { Dialog, DialogContent } from '../components/ui/dialog';

export default function ReviewOCR() {
  const navigate = useNavigate();
  const location = useLocation();
  const { getToken } = useAuth();
  
  const [data, setData] = useState<any>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [activePageIndex, setActivePageIndex] = useState<number>(0);
  const [isZoomOpen, setIsZoomOpen] = useState(false);

  const [isSaving, setIsSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingInvoiceId, setEditingInvoiceId] = useState<number | null>(null);

  useEffect(() => {
    // Check if passed via location state for editing
    if (location.state?.isEditing && location.state?.invoiceId) {
      setIsEditing(true);
      setEditingInvoiceId(location.state.invoiceId);
      sessionStorage.setItem('editingInvoiceId', String(location.state.invoiceId));
    } else {
      const savedEditId = sessionStorage.getItem('editingInvoiceId');
      if (savedEditId) {
        setIsEditing(true);
        setEditingInvoiceId(parseInt(savedEditId));
      }
    }

    const savedData = sessionStorage.getItem('extractedBillData');
    const savedImagesStr = sessionStorage.getItem('billImagePreviews');
    const savedImage = sessionStorage.getItem('billImagePreview');
    
    if (!savedData) {
      navigate('/bills/create');
      return;
    }
    
    try {
      const parsed = JSON.parse(savedData);
      // Ensure items array exists
      if (!parsed.items) parsed.items = [];
      parsed.items = parsed.items.map((item: any) => {
        let q = String(item.quantity || '').trim();
        let r = String(item.rate || '').trim();
        let a = parseFloat(String(item.amount || 0));
        
        if ((!q || q === '0') && (!r || r === '0') && a > 0) {
          q = '1';
          r = String(a);
        }
        
        let qNum = parseFloat(q) || 0;
        let rNum = parseFloat(r) || 0;
        let amount = a;
        
        if (qNum > 0 && rNum === 0 && amount > 0) {
           rNum = Number((amount / qNum).toFixed(2));
        } else if (rNum > 0 && qNum === 0 && amount > 0) {
           qNum = 1;
        } else if (qNum > 0 && rNum > 0) {
           amount = qNum * rNum;
        }
        
        return { ...item, description: item.description || '', quantity: qNum || 1, rate: rNum || 0, amount };
      });
      if (!parsed.date) parsed.date = new Date().toISOString().split('T')[0];
      if (typeof parsed.date === 'string' && parsed.date.includes('T')) {
        parsed.date = parsed.date.split('T')[0];
      }
      if (!parsed.invoiceNumber) parsed.invoiceNumber = 'INV-' + Date.now().toString().slice(-6);
      if (!parsed.status) parsed.status = 'PAID';
      if (!parsed.paymentMethod) parsed.paymentMethod = 'Cash';
      
      const subtotal = parsed.items.reduce((sum: number, item: any) => sum + (parseFloat(item.amount) || 0), 0);
      const tax = parseFloat(parsed.taxAmount) || 0;
      const discount = parseFloat(parsed.discount) || 0;
      parsed.subtotal = subtotal;
      parsed.grandTotal = subtotal + tax - discount;
      
      setData(parsed);
    } catch (e) {
      console.error(e);
      navigate('/bills/create');
    }
    
    // Parse multi-page previews
    let previewsList: string[] = [];
    if (savedImagesStr) {
      try {
        const parsedPreviews = JSON.parse(savedImagesStr);
        if (Array.isArray(parsedPreviews) && parsedPreviews.length > 0) {
          previewsList = parsedPreviews;
        }
      } catch (e) {}
    }
    if (previewsList.length === 0 && savedImage) {
      previewsList = [savedImage];
    }

    setImagePreviews(previewsList);
    if (previewsList.length > 0) {
      setImagePreview(previewsList[0]);
    }
  }, [navigate, location]);

  const updateField = (field: string, value: string | number) => {
    setData((prev: any) => {
      const updated = { ...prev, [field]: value };
      calculateTotals(updated);
      return updated;
    });
  };

  const updateItem = (index: number, field: string, value: string | number) => {
    const newItems = [...data.items];
    newItems[index] = { ...newItems[index], [field]: value };
    
    // Auto calculate amount if rate or quantity changes
    if (field === 'quantity' || field === 'rate') {
      const q = parseFloat(String(newItems[index].quantity)) || 0;
      const r = parseFloat(String(newItems[index].rate)) || 0;
      newItems[index].amount = q * r;
    } else if (field === 'amount') {
      const a = parseFloat(String(value)) || 0;
      const qStr = String(newItems[index].quantity || '').trim();
      
      let q = parseFloat(qStr);
      if (isNaN(q) || q === 0) {
         newItems[index].quantity = 1;
         newItems[index].rate = a;
      } else {
         newItems[index].rate = Number((a / q).toFixed(2));
      }
    }
    
    const newData = { ...data, items: newItems };
    setData(newData);
    calculateTotals(newData);
  };

  const addItem = () => {
    setData((prev: any) => {
      const updated = {
        ...prev,
        items: [...prev.items, { description: '', quantity: 1, rate: 0, amount: 0 }]
      };
      calculateTotals(updated);
      return updated;
    });
  };

  const removeItem = (index: number) => {
    const newItems = [...data.items];
    newItems.splice(index, 1);
    const newData = { ...data, items: newItems };
    setData(newData);
    calculateTotals(newData);
  };

  const calculateTotals = (currentData: any) => {
    const subtotal = currentData.items.reduce((sum: number, item: any) => sum + (parseFloat(item.amount) || 0), 0);
    const tax = parseFloat(currentData.taxAmount) || 0;
    const discount = parseFloat(currentData.discount) || 0;
    const grandTotal = subtotal + tax - discount;
    
    setData((prev: any) => ({
      ...prev,
      subtotal,
      grandTotal
    }));
  };

  const handleGenerateInvoice = async () => {
    if (!data.customerName?.trim()) {
      toast.error('Customer Name is required');
      return;
    }
    
    if (!data.items || data.items.length === 0) {
      toast.error('At least one item is required');
      return;
    }

    setIsSaving(true);
    try {
      // Recalculate totals
      const subtotal = data.items.reduce((sum: number, item: any) => sum + (parseFloat(item.amount) || 0), 0);
      const tax = parseFloat(data.taxAmount) || 0;
      const discount = parseFloat(data.discount) || 0;
      const grandTotal = subtotal + tax - discount;
      
      let cleanDate = data.date || new Date().toISOString().split('T')[0];
      if (typeof cleanDate === 'string' && cleanDate.includes('T')) {
        cleanDate = cleanDate.split('T')[0];
      }

      const payload = {
        customerName: data.customerName.trim(),
        phone: data.phone || null,
        address: data.address || null,
        invoiceNumber: data.invoiceNumber || `INV-${Date.now().toString().slice(-6)}`,
        date: cleanDate,
        subtotal,
        discount,
        taxAmount: tax,
        grandTotal,
        notes: data.notes || null,
        status: data.status || 'PAID',
        paymentMethod: data.status === 'PAID' ? (data.paymentMethod || 'Cash') : null,
        paymentReference: data.status === 'PAID' ? (data.paymentReference || null) : null,
        items: data.items.map((i: any) => ({
          description: i.description || 'Item',
          quantity: Number(i.quantity) || 1,
          rate: Number(i.rate) || 0,
          amount: Number(i.amount) || 0,
        }))
      };

      const token = await getToken();
      const targetEditId = isEditing ? (editingInvoiceId || sessionStorage.getItem('editingInvoiceId')) : null;
      let endpoint = targetEditId ? `/api/invoices/${targetEditId}` : '/api/invoices';
      let method = targetEditId ? 'PUT' : 'POST';

      let response = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      // If PUT responded with 404, smoothly fallback to POST (create)
      if (!response.ok && response.status === 404 && method === 'PUT') {
        console.warn("PUT returned 404, creating invoice via POST...");
        response = await fetch('/api/invoices', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });
      }

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || `Failed to save invoice (${response.status})`);
      }

      const savedInvoice = await response.json();
      toast.success(targetEditId ? 'Invoice updated in History!' : 'Bill generated and saved to History!');

      sessionStorage.setItem('finalInvoiceData', JSON.stringify(payload));
      sessionStorage.removeItem('extractedBillData');
      sessionStorage.removeItem('billImagePreview');
      sessionStorage.removeItem('editingInvoiceId');

      navigate('/bills/preview', { state: { invoiceData: payload, isSaved: true, invoiceId: savedInvoice.id || targetEditId } });
    } catch (error: any) {
      console.error("Save invoice error:", error);
      toast.error(error.message || 'Failed to save invoice');
    } finally {
      setIsSaving(false);
    }
  };

  if (!data) return <LoadingScreen message="Loading bill data..." />;

  const isPaid = data.status === 'PAID';

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            {isEditing ? `Edit Invoice (${data.invoiceNumber || ''})` : 'Review & Generate Bill'}
          </h1>
          <p className="text-gray-500 mt-1">
            {isEditing ? 'Make your adjustments and save changes to history' : 'Verify details, adjust items, set payment status, and generate your invoice'}
          </p>
        </div>
      </div>

      <div className={`grid ${imagePreviews.length > 0 ? 'lg:grid-cols-2' : 'lg:grid-cols-1 max-w-4xl mx-auto'} gap-8`}>
        {/* Left Col - Multi-Page Image Reference */}
        {imagePreviews.length > 0 && (
          <div className="space-y-6">
            <Card className="border-0 shadow-sm ring-1 ring-gray-100 sticky top-6 overflow-hidden">
              <CardHeader className="bg-gray-50/80 border-b border-gray-100 py-3.5 px-4 flex flex-row items-center justify-between">
                <div className="flex items-center gap-2">
                  <Layers className="h-4 w-4 text-gray-700" />
                  <CardTitle className="text-sm font-bold text-gray-900">
                    Original Bill {imagePreviews.length > 1 && `(Page ${activePageIndex + 1} of ${imagePreviews.length})`}
                  </CardTitle>
                </div>

                <div className="flex items-center gap-1.5">
                  {imagePreviews.length > 1 && (
                    <div className="flex items-center bg-gray-200/80 rounded-lg p-0.5">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 rounded-md text-gray-700 hover:bg-white"
                        disabled={activePageIndex === 0}
                        onClick={() => {
                          const nextIdx = Math.max(0, activePageIndex - 1);
                          setActivePageIndex(nextIdx);
                          setImagePreview(imagePreviews[nextIdx]);
                        }}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <span className="text-[11px] font-bold px-2 text-gray-800">
                        {activePageIndex + 1}/{imagePreviews.length}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 rounded-md text-gray-700 hover:bg-white"
                        disabled={activePageIndex === imagePreviews.length - 1}
                        onClick={() => {
                          const nextIdx = Math.min(imagePreviews.length - 1, activePageIndex + 1);
                          setActivePageIndex(nextIdx);
                          setImagePreview(imagePreviews[nextIdx]);
                        }}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  )}

                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs font-bold px-2.5 bg-white hover:bg-gray-100"
                    onClick={() => setIsZoomOpen(true)}
                  >
                    <Eye className="h-3.5 w-3.5 mr-1" /> Expand
                  </Button>
                </div>
              </CardHeader>

              {/* Active Image Canvas */}
              <div 
                className="p-0 overflow-hidden bg-gray-950 flex justify-center cursor-pointer relative group"
                onClick={() => setIsZoomOpen(true)}
              >
                <img 
                  src={imagePreviews[activePageIndex] || imagePreview} 
                  alt={`Original Bill Page ${activePageIndex + 1}`} 
                  className="w-full max-h-[750px] object-contain transition-transform group-hover:scale-102" 
                />
                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold gap-1 pointer-events-none">
                  <Eye className="w-4 h-4" /> Click to Zoom
                </div>
              </div>

              {/* Multi-Page Thumbnails Switcher */}
              {imagePreviews.length > 1 && (
                <div className="p-3 bg-gray-50 border-t border-gray-100 flex items-center gap-2 overflow-x-auto">
                  {imagePreviews.map((url, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setActivePageIndex(idx);
                        setImagePreview(url);
                      }}
                      className={`relative shrink-0 rounded-lg overflow-hidden border-2 transition-all p-0.5 ${
                        activePageIndex === idx 
                          ? 'border-black ring-2 ring-black/20 bg-white' 
                          : 'border-gray-200 hover:border-gray-400 opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img 
                        src={url} 
                        alt={`Thumb ${idx + 1}`} 
                        className="h-14 w-14 object-cover rounded" 
                      />
                      <span className="absolute bottom-1 right-1 bg-black/80 text-white text-[9px] font-black px-1 rounded">
                        P{idx + 1}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </Card>
          </div>
        )}

        {/* Right Col - Editable Form */}
        <div className="space-y-6">
          {/* Customer & Invoice Info */}
          <Card className="border-0 shadow-sm ring-1 ring-gray-100">
            <CardHeader className="bg-gray-50/50 border-b border-gray-100 py-4">
              <CardTitle className="text-sm font-medium">Customer & Invoice Details</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2 col-span-2">
                  <Label htmlFor="customerName">Customer Name *</Label>
                  <Input 
                    id="customerName" 
                    value={data.customerName || ''} 
                    onChange={(e) => updateField('customerName', e.target.value)} 
                    placeholder="Enter customer name"
                    className="h-10"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input 
                    id="phone" 
                    value={data.phone || ''} 
                    onChange={(e) => updateField('phone', e.target.value)} 
                    placeholder="+91 9876543210"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="invoiceNumber">Invoice Number</Label>
                  <Input 
                    id="invoiceNumber" 
                    value={data.invoiceNumber || ''} 
                    onChange={(e) => updateField('invoiceNumber', e.target.value)} 
                  />
                </div>
                <div className="space-y-2 col-span-2">
                  <Label htmlFor="address">Address</Label>
                  <Input 
                    id="address" 
                    value={data.address || ''} 
                    onChange={(e) => updateField('address', e.target.value)} 
                    placeholder="Customer billing address"
                  />
                </div>
                <div className="space-y-2 col-span-2 sm:col-span-1">
                  <Label htmlFor="date">Date</Label>
                  <Input 
                    id="date" 
                    type="date"
                    value={data.date ? (data.date.includes('T') ? data.date.split('T')[0] : data.date) : ''} 
                    onChange={(e) => updateField('date', e.target.value)} 
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Status & Method Card */}
          <Card className="border-0 shadow-sm ring-1 ring-gray-100">
            <CardHeader className="bg-gray-50/50 border-b border-gray-100 py-4 flex flex-row items-center justify-between">
              <div className="flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-gray-500" />
                <CardTitle className="text-sm font-medium">Payment & Status</CardTitle>
              </div>
              <div className="flex items-center gap-2">
                <label 
                  htmlFor="paidCheckbox" 
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold cursor-pointer transition-colors ${
                    isPaid ? 'bg-green-100 text-green-800 border border-green-300' : 'bg-orange-100 text-orange-800 border border-orange-200'
                  }`}
                >
                  {isPaid ? <CheckCircle2 className="h-3.5 w-3.5 text-green-600" /> : <Circle className="h-3.5 w-3.5 text-orange-500" />}
                  <span>{isPaid ? 'PAID' : 'PENDING'}</span>
                </label>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                <div>
                  <p className="text-sm font-semibold text-gray-900">Mark as Paid</p>
                  <p className="text-xs text-gray-500">Enable if the customer has completed payment</p>
                </div>
                <input 
                  type="checkbox"
                  id="paidCheckbox"
                  checked={isPaid}
                  onChange={(e) => updateField('status', e.target.checked ? 'PAID' : 'PENDING')}
                  className="w-5 h-5 rounded border-gray-300 text-black focus:ring-black cursor-pointer"
                />
              </div>

              {isPaid && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div className="space-y-2">
                    <Label htmlFor="paymentMethod">Payment Method</Label>
                    <select
                      id="paymentMethod"
                      value={data.paymentMethod || 'Cash'}
                      onChange={(e) => updateField('paymentMethod', e.target.value)}
                      className="w-full h-10 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
                    >
                      <option value="Cash">Cash</option>
                      <option value="UPI">UPI / QR Code</option>
                      <option value="Card">Credit / Debit Card</option>
                      <option value="Bank Transfer">Bank Transfer / NetBanking</option>
                      <option value="Cheque">Cheque</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="paymentReference">Transaction ID / Ref (Optional)</Label>
                    <Input 
                      id="paymentReference"
                      value={data.paymentReference || ''}
                      onChange={(e) => updateField('paymentReference', e.target.value)}
                      placeholder="e.g. UPI Ref / TXN12345"
                      className="h-10"
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Items Table Card */}
          <Card className="border-0 shadow-sm ring-1 ring-gray-100 overflow-hidden">
            <CardHeader className="bg-gray-50/50 border-b border-gray-100 py-3.5 px-4 sm:px-6 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm font-bold text-gray-900">Items & Products</CardTitle>
                <p className="text-[11px] text-gray-500 mt-0.5">{data.items?.length || 0} line item(s)</p>
              </div>
              <Button size="sm" variant="outline" onClick={addItem} className="h-8 text-xs font-bold bg-white">
                <Plus className="mr-1 h-3.5 w-3.5" /> Add Item
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              {/* 1. Mobile Item Cards (Visible on < sm screens) */}
              <div className="sm:hidden divide-y divide-gray-100">
                {data.items?.map((item: any, idx: number) => (
                  <div key={idx} className="p-3.5 space-y-2.5 bg-white">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider">#{idx + 1}</span>
                      <Input 
                        value={item.description || ''} 
                        onChange={(e) => updateItem(idx, 'description', e.target.value)}
                        placeholder="Item Description"
                        className="h-8 text-xs font-semibold flex-1"
                      />
                      <button 
                        type="button" 
                        onClick={() => removeItem(idx)} 
                        className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg shrink-0"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <Label className="text-[10px] text-gray-500 font-semibold mb-0.5 block">Qty</Label>
                        <Input 
                          type="number"
                          value={item.quantity !== undefined && item.quantity !== null && !Number.isNaN(item.quantity) ? item.quantity : ''} 
                          onChange={(e) => updateItem(idx, 'quantity', parseFloat(e.target.value))}
                          className="h-8 text-xs font-bold text-center"
                          placeholder="1"
                        />
                      </div>
                      <div>
                        <Label className="text-[10px] text-gray-500 font-semibold mb-0.5 block">Rate (₹)</Label>
                        <Input 
                          type="number"
                          value={item.rate !== undefined && item.rate !== null && !Number.isNaN(item.rate) ? item.rate : ''} 
                          onChange={(e) => updateItem(idx, 'rate', parseFloat(e.target.value))}
                          className="h-8 text-xs font-bold text-center"
                          placeholder="0.00"
                        />
                      </div>
                      <div>
                        <Label className="text-[10px] text-gray-500 font-semibold mb-0.5 block text-right">Amount</Label>
                        <div className="h-8 flex items-center justify-end px-2 bg-gray-50 rounded-md border text-xs font-black text-gray-900">
                          ₹{Number(item.amount || 0).toFixed(2)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* 2. Desktop Table (Visible on >= sm screens) */}
              <div className="hidden sm:block overflow-x-auto">
                <Table>
                  <TableHeader className="bg-gray-50/80">
                    <TableRow>
                      <TableHead className="w-[45%] font-bold text-xs">Description</TableHead>
                      <TableHead className="font-bold text-xs text-center">Qty</TableHead>
                      <TableHead className="font-bold text-xs text-center">Rate</TableHead>
                      <TableHead className="font-bold text-xs text-right">Amount</TableHead>
                      <TableHead className="w-[40px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.items?.map((item: any, idx: number) => (
                      <TableRow key={idx}>
                        <TableCell className="p-2">
                          <Input 
                            value={item.description || ''} 
                            onChange={(e) => updateItem(idx, 'description', e.target.value)}
                            placeholder="Item name / description"
                            className="h-8 text-xs font-medium"
                          />
                        </TableCell>
                        <TableCell className="p-2">
                          <Input 
                            type="number"
                            value={item.quantity !== undefined && item.quantity !== null && !Number.isNaN(item.quantity) ? item.quantity : ''} 
                            onChange={(e) => updateItem(idx, 'quantity', parseFloat(e.target.value))}
                            className="h-8 text-xs w-16 text-center mx-auto"
                          />
                        </TableCell>
                        <TableCell className="p-2">
                          <Input 
                            type="number"
                            value={item.rate !== undefined && item.rate !== null && !Number.isNaN(item.rate) ? item.rate : ''} 
                            onChange={(e) => updateItem(idx, 'rate', parseFloat(e.target.value))}
                            className="h-8 text-xs w-20 text-center mx-auto"
                          />
                        </TableCell>
                        <TableCell className="p-2 text-right">
                          <span className="text-xs font-bold px-2 text-gray-900">₹{Number(item.amount || 0).toFixed(2)}</span>
                        </TableCell>
                        <TableCell className="p-2 text-right">
                          <Button variant="ghost" size="icon" onClick={() => removeItem(idx)} className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Totals & Actions Card */}
          <Card className="border-0 shadow-sm ring-1 ring-gray-100">
             <CardHeader className="bg-gray-50/50 border-b border-gray-100 py-3.5 px-4 sm:px-6">
              <CardTitle className="text-sm font-bold text-gray-900">Summary & Total</CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
               <div className="space-y-2.5 max-w-sm ml-auto">
                 <div className="flex justify-between items-center text-xs text-gray-600">
                   <span>Subtotal</span>
                   <span className="font-semibold text-gray-900">₹{Number(data.subtotal || 0).toFixed(2)}</span>
                 </div>
                 <div className="flex justify-between items-center text-xs text-gray-600">
                   <span>Discount (₹)</span>
                   <Input 
                      type="number"
                      className="w-24 h-8 text-right text-xs"
                      value={data.discount || ''}
                      onChange={(e) => updateField('discount', parseFloat(e.target.value))}
                   />
                 </div>
                 <div className="flex justify-between items-center text-xs text-gray-600">
                   <span>Tax Amount (₹)</span>
                   <Input 
                      type="number"
                      className="w-24 h-8 text-right text-xs"
                      value={data.taxAmount || ''}
                      onChange={(e) => updateField('taxAmount', parseFloat(e.target.value))}
                   />
                 </div>
                 <div className="pt-3 border-t border-gray-200 flex justify-between items-center">
                   <span className="font-black text-sm text-gray-900">Grand Total</span>
                   <span className="font-black text-lg text-black">₹{Number(data.grandTotal || 0).toFixed(2)}</span>
                 </div>
               </div>
               
               <div className="mt-6 pt-4 border-t border-gray-100 flex justify-end">
                 <Button 
                   onClick={handleGenerateInvoice} 
                   disabled={isSaving}
                   className="h-11 px-8 bg-black hover:bg-gray-800 text-white w-full sm:w-auto font-bold text-xs shadow-sm transition-transform active:scale-95"
                 >
                   {isSaving ? (
                     <>
                       <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                       {isEditing ? 'Updating Bill in History...' : 'Saving Bill to History...'}
                     </>
                   ) : (
                     <>
                       {isEditing ? 'Update & Save Changes' : 'Generate Bill & Save'}
                       <ArrowRight className="ml-2 h-4 w-4" />
                     </>
                   )}
                 </Button>
               </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Enlarged Page Zoom Modal */}
      <Dialog open={isZoomOpen} onOpenChange={setIsZoomOpen}>
        <DialogContent className="max-w-5xl p-2 bg-black/95 border-0">
          <div className="flex flex-col items-center justify-center p-2">
            <img 
              src={imagePreviews[activePageIndex] || imagePreview} 
              alt={`Page ${activePageIndex + 1}`} 
              className="max-h-[85vh] max-w-full object-contain rounded" 
            />
            {imagePreviews.length > 1 && (
              <div className="flex items-center gap-3 mt-3 text-white text-xs font-bold">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={activePageIndex === 0}
                  onClick={() => {
                    const nextIdx = Math.max(0, activePageIndex - 1);
                    setActivePageIndex(nextIdx);
                    setImagePreview(imagePreviews[nextIdx]);
                  }}
                  className="bg-white/10 text-white border-white/20 hover:bg-white/20 h-8"
                >
                  <ChevronLeft className="w-4 h-4 mr-1" /> Previous Page
                </Button>
                <span>Page {activePageIndex + 1} of {imagePreviews.length}</span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={activePageIndex === imagePreviews.length - 1}
                  onClick={() => {
                    const nextIdx = Math.min(imagePreviews.length - 1, activePageIndex + 1);
                    setActivePageIndex(nextIdx);
                    setImagePreview(imagePreviews[nextIdx]);
                  }}
                  className="bg-white/10 text-white border-white/20 hover:bg-white/20 h-8"
                >
                  Next Page <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
