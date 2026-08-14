import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Search, Printer, Trash2, Pencil, CheckCircle2, Clock, Plus, Receipt } from 'lucide-react';
import { Input } from '../components/ui/input';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';
import { useNavigate, Link } from 'react-router-dom';
import { Logo } from '../components/Logo';
import { Button } from '../components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";

export default function BillsList() {
  const { getToken } = useAuth();
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [invoiceToDelete, setInvoiceToDelete] = useState<any>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const token = await getToken();
      const res = await fetch('/api/invoices', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to fetch invoices');
      const data = await res.json();
      setInvoices(Array.isArray(data) ? data : []);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, [getToken]);

  const filteredInvoices = invoices.filter(inv => 
    inv.invoiceNumber?.toLowerCase().includes(search.toLowerCase()) || 
    inv.customer?.name?.toLowerCase().includes(search.toLowerCase())
  );

  const handleEdit = (invoice: any) => {
    const editData = {
      customerName: invoice.customer?.name || '',
      phone: invoice.customer?.phone || '',
      address: invoice.customer?.address || '',
      invoiceNumber: invoice.invoiceNumber,
      date: invoice.date ? (invoice.date.includes('T') ? invoice.date.split('T')[0] : invoice.date) : '',
      items: invoice.items?.map((it: any) => ({
        description: it.description,
        quantity: Number(it.quantity) || 1,
        rate: Number(it.rate) || 0,
        amount: Number(it.amount) || 0,
      })) || [],
      subtotal: Number(invoice.subtotal) || 0,
      discount: Number(invoice.discount) || 0,
      taxAmount: Number(invoice.taxAmount) || 0,
      grandTotal: Number(invoice.grandTotal) || 0,
      status: invoice.status || 'PAID',
      paymentMethod: invoice.paymentMethod || 'Cash',
      paymentReference: invoice.paymentReference || '',
      notes: invoice.notes || ''
    };

    sessionStorage.setItem('extractedBillData', JSON.stringify(editData));
    sessionStorage.removeItem('billImagePreview');
    navigate('/bills/review', { state: { isEditing: true, invoiceId: invoice.id } });
  };

  const handlePreview = (invoice: any) => {
    navigate('/bills/preview', { state: { 
      invoiceData: {
        customerName: invoice.customer?.name,
        phone: invoice.customer?.phone,
        address: invoice.customer?.address,
        invoiceNumber: invoice.invoiceNumber,
        date: invoice.date,
        items: invoice.items,
        subtotal: invoice.subtotal,
        discount: invoice.discount,
        taxAmount: invoice.taxAmount,
        grandTotal: invoice.grandTotal,
        status: invoice.status,
        paymentMethod: invoice.paymentMethod,
        paymentReference: invoice.paymentReference,
        notes: invoice.notes
      },
      invoiceId: invoice.id,
      isReadOnly: true 
    }});
  };

  const handleDelete = async () => {
    if (!invoiceToDelete) return;
    setIsDeleting(true);
    try {
      const token = await getToken();
      const res = await fetch(`/api/invoices/${invoiceToDelete.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to delete invoice');
      }
      setInvoices(invoices.filter(inv => inv.id !== invoiceToDelete.id));
      toast.success('Invoice deleted successfully');
      setInvoiceToDelete(null);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-4 max-w-6xl mx-auto">
      {/* Header & New Bill CTA */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">Invoice History</h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">View, edit, print, and share previously generated bills</p>
        </div>
        <Link to="/bills/create" className="w-full sm:w-auto">
          <Button className="w-full sm:w-auto bg-black hover:bg-gray-800 text-white font-bold text-xs h-9 shadow-sm">
            <Plus className="mr-1.5 h-4 w-4" /> New Invoice
          </Button>
        </Link>
      </div>

      <Card className="border-0 shadow-sm ring-1 ring-gray-100 overflow-hidden">
        {/* Search Bar */}
        <CardHeader className="p-4 border-b border-gray-100 bg-gray-50/50">
          <div className="relative w-full sm:max-w-sm">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <Input 
              type="search" 
              placeholder="Search by invoice # or customer..." 
              className="pl-9 bg-white text-xs h-9" 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {loading ? (
            <div className="text-center py-12 text-gray-500">
              <div className="flex flex-col items-center justify-center gap-3">
                <Logo className="h-8 animate-pulse grayscale opacity-50" />
                <span className="text-xs font-semibold">Loading invoices...</span>
              </div>
            </div>
          ) : filteredInvoices.length === 0 ? (
            <div className="text-center py-12 text-gray-500 p-4">
              <Receipt className="w-10 h-10 mx-auto text-gray-300 mb-2" />
              <p className="text-sm font-bold text-gray-700">No bills found in history</p>
              <p className="text-xs text-gray-400 mt-1">Generate a bill from OCR or Create Invoice to see it here</p>
            </div>
          ) : (
            <>
              {/* 1. Mobile Cards View (Visible on < md screens) */}
              <div className="md:hidden divide-y divide-gray-100">
                {filteredInvoices.map((invoice) => (
                  <div key={invoice.id} className="p-4 hover:bg-gray-50/70 transition-colors space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-xs text-gray-900 bg-gray-100 px-2 py-0.5 rounded">
                        {invoice.invoiceNumber}
                      </span>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        invoice.status === 'PAID' ? 'bg-green-100 text-green-800 border border-green-200' : 'bg-orange-100 text-orange-800 border border-orange-200'
                      }`}>
                        {invoice.status === 'PAID' ? <CheckCircle2 className="w-3 h-3 text-green-600" /> : <Clock className="w-3 h-3 text-orange-600" />}
                        {invoice.status || 'PENDING'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-bold text-sm text-gray-900">{invoice.customer?.name || 'Walk-in Customer'}</p>
                        <p className="text-[11px] text-gray-500 mt-0.5">{new Date(invoice.date).toLocaleDateString()}</p>
                      </div>
                      <div className="text-right">
                        <span className="text-xs text-gray-400 font-medium block">Total</span>
                        <span className="font-black text-base text-gray-900">₹{Number(invoice.grandTotal || 0).toFixed(2)}</span>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handlePreview(invoice)}
                        className="h-8 text-xs font-bold px-3 text-gray-700 hover:bg-gray-100"
                      >
                        <Printer className="h-3.5 w-3.5 mr-1" /> View / Print
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(invoice)}
                        className="h-8 text-xs font-bold px-3 text-blue-600 border-blue-200 bg-blue-50/50 hover:bg-blue-100"
                      >
                        <Pencil className="h-3.5 w-3.5 mr-1" /> Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setInvoiceToDelete(invoice)}
                        className="h-8 text-xs font-bold px-2 text-red-500 hover:bg-red-50"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {/* 2. Desktop Table View (Visible on >= md screens) */}
              <div className="hidden md:block overflow-x-auto">
                <Table>
                  <TableHeader className="bg-gray-50/80">
                    <TableRow>
                      <TableHead className="font-bold text-xs">Invoice No</TableHead>
                      <TableHead className="font-bold text-xs">Customer</TableHead>
                      <TableHead className="font-bold text-xs">Date</TableHead>
                      <TableHead className="font-bold text-xs">Amount</TableHead>
                      <TableHead className="font-bold text-xs">Status</TableHead>
                      <TableHead className="text-right font-bold text-xs">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredInvoices.map((invoice) => (
                      <TableRow key={invoice.id} className="hover:bg-gray-50/70 transition-colors">
                        <TableCell className="font-mono font-bold text-xs text-black">
                          {invoice.invoiceNumber}
                        </TableCell>
                        <TableCell className="font-semibold text-xs text-gray-800">{invoice.customer?.name || 'Walk-in Customer'}</TableCell>
                        <TableCell className="text-xs text-gray-600">{new Date(invoice.date).toLocaleDateString()}</TableCell>
                        <TableCell className="font-bold text-xs text-gray-900">₹{Number(invoice.grandTotal || 0).toFixed(2)}</TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                            invoice.status === 'PAID' ? 'bg-green-100 text-green-800 border border-green-200' : 'bg-orange-100 text-orange-800 border border-orange-200'
                          }`}>
                            {invoice.status === 'PAID' ? <CheckCircle2 className="w-3 h-3 text-green-600" /> : <Clock className="w-3 h-3 text-orange-600" />}
                            {invoice.status || 'PENDING'}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1.5">
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEdit(invoice);
                              }}
                              className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors"
                              title="Edit Bill"
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                handlePreview(invoice);
                              }}
                              className="p-1.5 text-gray-600 hover:text-black hover:bg-gray-100 rounded-md transition-colors"
                              title="View & Print"
                            >
                              <Printer className="h-4 w-4" />
                            </button>
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                setInvoiceToDelete(invoice);
                              }}
                              className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors"
                              title="Delete Invoice"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!invoiceToDelete} onOpenChange={(open) => !open && setInvoiceToDelete(null)}>
        <DialogContent className="max-w-md mx-4">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">Delete Invoice?</DialogTitle>
            <DialogDescription className="text-xs">
              Are you sure you want to permanently delete invoice <strong>{invoiceToDelete?.invoiceNumber}</strong>? 
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setInvoiceToDelete(null)} disabled={isDeleting}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? 'Deleting...' : 'Delete Invoice'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
