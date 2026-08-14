import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { FileText, Search, Printer, Eye, Trash2 } from 'lucide-react';
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

  useEffect(() => {
    const fetchInvoices = async () => {
      try {
        const token = await getToken();
        const res = await fetch('/api/invoices', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!res.ok) throw new Error('Failed to fetch invoices');
        const text = await res.text(); let data; try { data = JSON.parse(text); } catch(e) { data = []; }
        setInvoices(data);
      } catch (error: any) {
        toast.error(error.message);
      } finally {
        setLoading(false);
      }
    };
    fetchInvoices();
  }, [getToken]);

  const filteredInvoices = invoices.filter(inv => 
    inv.invoiceNumber?.toLowerCase().includes(search.toLowerCase()) || 
    inv.customer?.name?.toLowerCase().includes(search.toLowerCase())
  );

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
          <p className="text-gray-500 mt-1">View and share previously generated bills</p>
        </div>
      </div>

      <Card className="border-0 shadow-sm ring-1 ring-gray-100">
        <CardHeader className="py-4 border-b border-gray-100">
          <div className="relative max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
            <Input 
              type="search" 
              placeholder="Search bills..." 
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
                   <TableCell colSpan={5} className="text-center py-12 text-gray-500">
                      <div className="flex flex-col items-center justify-center gap-4">
                        <Logo className="h-10 animate-pulse grayscale opacity-50" />
                        <span>Loading invoices...</span>
                      </div>
                    </TableCell>
                 </TableRow>
              ) : filteredInvoices.length === 0 ? (
                 <TableRow>
                   <TableCell colSpan={5} className="text-center py-8 text-gray-500">No bills found</TableCell>
                 </TableRow>
              ) : (
                filteredInvoices.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell className="font-medium text-black">
                      {invoice.invoiceNumber}
                    </TableCell>
                    <TableCell>{invoice.customer?.name || 'Unknown'}</TableCell>
                    <TableCell>{new Date(invoice.date).toLocaleDateString()}</TableCell>
                    <TableCell>₹{Number(invoice.grandTotal).toFixed(2)}</TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        invoice.status === 'PAID' ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'
                      }`}>
                        {invoice.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
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
                                notes: invoice.notes
                              },
                              isReadOnly: true 
                            }});
                          }}
                          className="p-1.5 text-gray-500 hover:text-black hover:bg-gray-100 rounded-md transition-colors"
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
              Are you sure you want to permanently delete invoice {invoiceToDelete?.invoiceNumber}? 
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
