import LoadingScreen from '../components/LoadingScreen';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Plus, Trash2, ArrowRight, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../contexts/AuthContext';

export default function ReviewOCR() {
  const navigate = useNavigate();
  const { getToken } = useAuth();
  const [data, setData] = useState<any>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const savedData = sessionStorage.getItem('extractedBillData');
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
        
        return { ...item, quantity: qNum || 1, rate: rNum || 0, amount };
      });
      if (!parsed.date) parsed.date = new Date().toISOString().split('T')[0];
      if (!parsed.invoiceNumber) parsed.invoiceNumber = 'INV-' + Date.now().toString().slice(-6);
      
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
    
    if (savedImage) setImagePreview(savedImage);
  }, [navigate]);

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

    // Ensure all items are valid
    const hasInvalidItems = data.items.some((item: any) => !item.description?.trim());
    if (hasInvalidItems) {
      toast.error('All items must have a description');
      return;
    }

    setIsSaving(true);
    try {
      // Recalculate totals
      const subtotal = data.items.reduce((sum: number, item: any) => sum + (parseFloat(item.amount) || 0), 0);
      const tax = parseFloat(data.taxAmount) || 0;
      const discount = parseFloat(data.discount) || 0;
      const grandTotal = subtotal + tax - discount;
      
      const payload = {
        customerName: data.customerName.trim(),
        phone: data.phone || null,
        address: data.address || null,
        invoiceNumber: data.invoiceNumber || `INV-${Date.now().toString().slice(-6)}`,
        date: data.date || new Date().toISOString().split('T')[0],
        subtotal,
        discount,
        taxAmount: tax,
        grandTotal,
        notes: data.notes || null,
        status: data.status || 'PAID',
        paymentMethod: data.paymentMethod || 'Cash',
        paymentReference: data.paymentReference || null,
        items: data.items.map((i: any) => ({
          description: i.description,
          quantity: Number(i.quantity) || 1,
          rate: Number(i.rate) || 0,
          amount: Number(i.amount) || 0,
        }))
      };

      const token = await getToken();
      const response = await fetch('/api/invoices', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to save bill to database');
      }

      const savedInvoice = await response.json();
      toast.success('Bill generated and saved to History!');

      sessionStorage.setItem('finalInvoiceData', JSON.stringify(payload));
      sessionStorage.removeItem('extractedBillData');
      sessionStorage.removeItem('billImagePreview');

      navigate('/bills/preview', { state: { invoiceData: payload, isSaved: true, invoiceId: savedInvoice.id } });
    } catch (error: any) {
      console.error("Save invoice error:", error);
      toast.error(error.message || 'Failed to save invoice');
    } finally {
      setIsSaving(false);
    }
  };

  if (!data) return <LoadingScreen message="Loading extracted data..." />;

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Review Extraction</h1>
          <p className="text-gray-500 mt-1">Please verify and edit the AI extracted data before generating the invoice</p>
        </div>
      </div>

      <div className={`grid ${imagePreview ? 'lg:grid-cols-2' : 'lg:grid-cols-1 max-w-4xl mx-auto'} gap-8`}>
        {/* Left Col - Image Reference */}
        {imagePreview && (
        <div className="space-y-6">
          <Card className="border-0 shadow-sm ring-1 ring-gray-100 sticky top-6">
            <CardHeader className="bg-gray-50/50 border-b border-gray-100 py-4">
              <CardTitle className="text-sm font-medium">Original Document</CardTitle>
            </CardHeader>
            <CardContent className="p-0 overflow-hidden bg-gray-900 flex justify-center">
              <img src={imagePreview} alt="Original Bill" className="w-full max-h-[800px] object-contain" />
            </CardContent>
          </Card>
        </div>
        )}

        {/* Right Col - Editable Form */}
        <div className="space-y-6">
          <Card className="border-0 shadow-sm ring-1 ring-gray-100">
            <CardHeader className="bg-gray-50/50 border-b border-gray-100 py-4">
              <CardTitle className="text-sm font-medium">Customer & Invoice Details</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2 col-span-2">
                  <Label htmlFor="customerName">Customer Name</Label>
                  <Input 
                    id="customerName" 
                    value={data.customerName || ''} 
                    onChange={(e) => updateField('customerName', e.target.value)} 
                    className="h-10"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input 
                    id="phone" 
                    value={data.phone || ''} 
                    onChange={(e) => updateField('phone', e.target.value)} 
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
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="date">Date</Label>
                  <Input 
                    id="date" 
                    type="date"
                    value={data.date || ''} 
                    onChange={(e) => updateField('date', e.target.value)} 
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm ring-1 ring-gray-100">
            <CardHeader className="bg-gray-50/50 border-b border-gray-100 py-4 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-medium">Items</CardTitle>
              <Button size="sm" variant="outline" onClick={addItem} className="h-8">
                <Plus className="mr-1 h-3 w-3" /> Add Item
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-gray-50/80">
                  <TableRow>
                    <TableHead className="w-[40%]">Description</TableHead>
                    <TableHead>Qty</TableHead>
                    <TableHead>Rate</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.items?.map((item: any, idx: number) => (
                    <TableRow key={idx}>
                      <TableCell className="p-2">
                        <Input 
                          value={item.description || ''} 
                          onChange={(e) => updateItem(idx, 'description', e.target.value)}
                          className="h-8 text-sm"
                        />
                      </TableCell>
                      <TableCell className="p-2">
                        <Input 
                          type="number"
                          value={item.quantity !== undefined && item.quantity !== null && !Number.isNaN(item.quantity) ? item.quantity : ''} 
                          onChange={(e) => updateItem(idx, 'quantity', parseFloat(e.target.value))}
                          className="h-8 text-sm w-16"
                        />
                      </TableCell>
                      <TableCell className="p-2">
                        <Input 
                          type="number"
                          value={item.rate !== undefined && item.rate !== null && !Number.isNaN(item.rate) ? item.rate : ''} 
                          onChange={(e) => updateItem(idx, 'rate', parseFloat(e.target.value))}
                          className="h-8 text-sm w-20"
                        />
                      </TableCell>
                      <TableCell className="p-2">
                        <span className="text-sm font-medium px-2">₹{Number(item.amount).toFixed(2)}</span>
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
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm ring-1 ring-gray-100">
             <CardHeader className="bg-gray-50/50 border-b border-gray-100 py-4">
              <CardTitle className="text-sm font-medium">Totals</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
               <div className="space-y-3 max-w-sm ml-auto">
                 <div className="flex justify-between items-center text-sm">
                   <span className="text-gray-500">Subtotal</span>
                   <span className="font-medium">₹{Number(data.subtotal || 0).toFixed(2)}</span>
                 </div>
                 <div className="flex justify-between items-center text-sm">
                   <span className="text-gray-500">Discount</span>
                   <Input 
                      type="number"
                      className="w-24 h-8 text-right"
                      value={data.discount || ''}
                      onChange={(e) => updateField('discount', parseFloat(e.target.value))}
                   />
                 </div>
                 <div className="flex justify-between items-center text-sm">
                   <span className="text-gray-500">Tax Amount</span>
                   <Input 
                      type="number"
                      className="w-24 h-8 text-right"
                      value={data.taxAmount || ''}
                      onChange={(e) => updateField('taxAmount', parseFloat(e.target.value))}
                   />
                 </div>
                 <div className="pt-3 border-t border-gray-200 flex justify-between items-center">
                   <span className="font-bold text-gray-900">Grand Total</span>
                   <span className="font-bold text-lg text-black">₹{Number(data.grandTotal || 0).toFixed(2)}</span>
                 </div>
               </div>
               
               <div className="mt-8 pt-4 border-t border-gray-100 flex justify-end">
                 <Button 
                   onClick={handleGenerateInvoice} 
                   disabled={isSaving}
                   className="h-12 px-8 bg-black hover:bg-gray-800 text-white w-full sm:w-auto font-medium"
                 >
                   {isSaving ? (
                     <>
                       <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                       Saving Bill to History...
                     </>
                   ) : (
                     <>
                       Generate Invoice
                       <ArrowRight className="ml-2 h-4 w-4" />
                     </>
                   )}
                 </Button>
               </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
