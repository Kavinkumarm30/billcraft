import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Search, Printer, Trash2, Pencil, CheckCircle2, Clock } from 'lucide-react';
import { Input } from '../components/ui/input';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
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
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">History</h1>
          <p className="text-gray-500 mt-1">View, edit, print, and share previously generated bills</p>
        </div>
      </div>

      <Card className="border-0 shadow-sm ring-1 ring-gray-100">
        <CardHeader className="py-4 border-b border-gray-100">
          <div className="relative max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
            <Input 
              type="search" 
              placeholder="Search bills by number or customer..." 
              className="pl-9 bg-gray-50/50" 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-gray-50/80">
              <TableRow>
                <TableHead>Invoice No</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                 <TableRow>
                   <TableCell colSpan={6} className="text-center py-12 text-gray-500">
                      <div className="flex flex-col items-center justify-center gap-4">
                        <Logo className="h-10 animate-pulse grayscale opacity-50" />
                        <span>Loading history...</span>
                      </div>
                    </TableCell>
                 </TableRow>
              ) : filteredInvoices.length === 0 ? (
                 <TableRow>
                   <TableCell colSpan={6} className="text-center py-12 text-gray-500">
                     <p className="text-base font-medium text-gray-700">No bills found in history</p>
                     <p className="text-sm text-gray-400 mt-1">Generate a bill from OCR or Create Invoice to see it here</p>
                   </TableCell>
                 </TableRow>
              ) : (
                filteredInvoices.map((invoice) => (
                  <TableRow key={invoice.id} className="hover:bg-gray-50/70 transition-colors">
                    <TableCell className="font-semibold text-black">
                      {invoice.invoiceNumber}
                    </TableCell>
                    <TableCell className="font-medium text-gray-800">{invoice.customer?.name || 'Unknown'}</TableCell>
                    <TableCell className="text-gray-600">{new Date(invoice.date).toLocaleDateString()}</TableCell>
                    <TableCell className="font-semibold text-gray-900">₹{Number(invoice.grandTotal || 0).toFixed(2)}</TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        invoice.status === 'PAID' ? 'bg-green-100 text-green-800 border border-green-200' : 'bg-orange-100 text-orange-800 border border-orange-200'
                      }`}>
                        {invoice.status === 'PAID' ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
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
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={!!invoiceToDelete} onOpenChange={(open) => !open && setInvoiceToDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Invoice?</DialogTitle>
            <DialogDescription>
              Are you sure you want to permanently delete invoice <strong>{invoiceToDelete?.invoiceNumber}</strong>? 
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
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
