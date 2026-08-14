import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Button } from '../components/ui/button';
import { Printer, Download, Save, ArrowLeft, Building2, Share2, CheckCircle, Image as ImageIcon, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { CustomMonishaLayout } from '../pages/CustomMonishaLayout';
import { toast } from 'sonner';

export interface InvoiceLayoutDesign {
  canvasBg: string;
  primaryColor: string;
  fontFamily: 'sans' | 'serif' | 'mono';
  canvasHeight: number;
  elements: any[];
}

export const defaultInvoiceDesign: InvoiceLayoutDesign = {
  canvasBg: '#ffffff',
  primaryColor: '#18181b',
  fontFamily: 'sans',
  canvasHeight: 1050,
  elements: [
    { id: 'company_header', type: 'company_header', x: 40, y: 40, width: 400, visible: true },
    { id: 'invoice_meta', type: 'invoice_meta', x: 480, y: 40, width: 280, visible: true },
    { id: 'billed_to', type: 'billed_to', x: 40, y: 160, width: 720, visible: true },
    { id: 'items_table', type: 'items_table', x: 40, y: 290, width: 720, visible: true },
    { id: 'totals_card', type: 'totals_card', x: 480, y: 540, width: 280, visible: true },
    { id: 'bank_details', type: 'bank_details', x: 40, y: 540, width: 410, visible: true },
    { id: 'notes_terms', type: 'notes_terms', x: 40, y: 690, width: 440, visible: true },
    { id: 'signature_block', type: 'signature_block', x: 520, y: 690, width: 240, visible: true }
  ]
};
import { toPng } from 'html-to-image';
import { jsPDF } from 'jspdf';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';

export default function InvoicePreview() {
  const navigate = useNavigate();
  const location = useLocation();
  const isReadOnly = location.state?.isReadOnly;
  const { getToken } = useAuth();
  const [data, setData] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState('PENDING');
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [paymentReference, setPaymentReference] = useState('');

  const openPaymentModal = () => {
    setPaymentStatus(data?.status || 'PENDING');
    setPaymentMethod(data?.paymentMethod || 'Cash');
    setPaymentReference(data?.paymentReference || '');
    setIsPaymentModalOpen(true);
  };

  const [scale, setScale] = useState(1);
  const containerRef = useRef<HTMLDivElement>(null);
  const invoiceRef = useRef<HTMLDivElement>(null);

  const { data: settings } = useQuery({
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
    if (location.state?.invoiceData) {
      setData(location.state.invoiceData);
      return;
    }
    const savedData = sessionStorage.getItem('finalInvoiceData');
    if (!savedData) {
      navigate('/bills/create');
      return;
    }
    setData(JSON.parse(savedData));
  }, [navigate, location]);

  useEffect(() => {
    const updateScale = () => {
      if (containerRef.current) {
        const containerWidth = containerRef.current.clientWidth;
        const invoiceWidth = 800; // Fixed width of the invoice
        if (containerWidth < invoiceWidth) {
          setScale(containerWidth / invoiceWidth);
        } else {
          setScale(1);
        }
      }
    };

    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, [data]);

  const handleShare = async () => {
    if (!invoiceRef.current) return;
    const loadingToast = toast.loading('Preparing to share...');
    try {
      const parent = invoiceRef.current.parentElement;
      const originalTransform = parent ? parent.style.transform : '';
      if (parent) parent.style.transform = 'none';
      await new Promise(r => setTimeout(r, 100));
      const dataUrl = await toPng(invoiceRef.current, {
        quality: 1,
        pixelRatio: 2,
        skipFonts: false,
      });
      if (parent) parent.style.transform = originalTransform;
      
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      const file = new File([blob], `Invoice-${data.invoiceNumber || 'share'}.png`, { type: 'image/png' });
      
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        toast.dismiss(loadingToast);
        await navigator.share({
          title: `Invoice ${data.invoiceNumber}`,
          text: `Here is the invoice ${data.invoiceNumber}`,
          files: [file]
        });
      } else {
         toast.dismiss(loadingToast);
         toast.error("Sharing files is not supported on this device/browser.");
      }
    } catch (error: any) {
      toast.dismiss(loadingToast);
      if (error.name !== 'AbortError') {
         toast.error('Failed to share invoice.');
         console.error('Share Error:', error);
      }
    }
  };

  const handleDownloadPNG = async () => {
    if (!invoiceRef.current) return;
    const loadingToast = toast.loading('Generating PNG...');
    
    try {
      const parent = invoiceRef.current.parentElement;
      const originalTransform = parent ? parent.style.transform : '';
      if (parent) parent.style.transform = 'none';

      await new Promise(r => setTimeout(r, 100));

      const dataUrl = await toPng(invoiceRef.current, {
        quality: 1,
        pixelRatio: 2,
        skipFonts: false,
      });
      
      if (parent) parent.style.transform = originalTransform;

      const link = document.createElement('a');
      link.download = `Invoice-${data.invoiceNumber || 'download'}.png`;
      link.href = dataUrl;
      link.click();
      
      toast.dismiss(loadingToast);
      toast.success('PNG downloaded successfully');
    } catch (error) {
      toast.dismiss(loadingToast);
      toast.error('Failed to generate PNG. Please try again.');
      console.error('PNG Generation Error:', error);
    }
  };

  const handleDownload = async () => {
    if (!invoiceRef.current) return;
    
    const loadingToast = toast.loading('Generating PDF...');
    
    try {
      const parent = invoiceRef.current.parentElement;
      const originalTransform = parent ? parent.style.transform : '';
      if (parent) parent.style.transform = 'none';

      await new Promise(r => setTimeout(r, 100));

      const dataUrl = await toPng(invoiceRef.current, {
        quality: 1,
        pixelRatio: 2,
        skipFonts: false,
      });
      
      if (parent) parent.style.transform = originalTransform;

      // A4 dimensions in mm
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth(); // 210mm
      const pageHeight = pdf.internal.pageSize.getHeight(); // 297mm
      
      // Calculate total image height to maintain aspect ratio
      const imgHeight = (invoiceRef.current.offsetHeight * pdfWidth) / invoiceRef.current.offsetWidth;
      
      let heightLeft = imgHeight;
      let position = 0;

      // Render First Page
      pdf.addImage(dataUrl, 'PNG', 0, position, pdfWidth, imgHeight);
      heightLeft -= pageHeight;

      // Render subsequent pages if bill height exceeds 1 A4 page
      while (heightLeft > 0) {
        position -= pageHeight;
        pdf.addPage();
        pdf.addImage(dataUrl, 'PNG', 0, position, pdfWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`Invoice-${data.invoiceNumber || 'download'}.pdf`);
      
      toast.dismiss(loadingToast);
      toast.success('PDF downloaded successfully');
    } catch (error) {
      toast.dismiss(loadingToast);
      toast.error('Failed to generate PDF. Please try again.');
      console.error('PDF Generation Error:', error);
    }
  };

  const handleSaveActual = async (invoiceDataToSave: any) => {
    setIsSaving(true);
    try {
      const token = await getToken();
      const res = await fetch('/api/invoices', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(invoiceDataToSave)
      });
      if (!res.ok) {
        throw new Error('Failed to save invoice');
      }
      toast.success('Invoice saved successfully to database');
      sessionStorage.removeItem('finalInvoiceData');
      navigate('/bills');
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const isIframe = window !== window.parent;

  const executePrint = () => {
    if (isIframe) {
      toast.info('Printing is restricted in this preview. Please open the app in a new tab (button in top right) to print.', {
        duration: 5000,
      });
    } else {
      document.title = data?.invoiceNumber ? `Invoice-${data.invoiceNumber}` : 'Invoice';
      window.print();
      document.title = 'BillCraft';
    }
  };

  if (!data) return null;

  // Parse user's layout config
  let canvaDesign: InvoiceLayoutDesign = defaultInvoiceDesign;
  const rawLayout = settings?.invoiceLayout || 'standard';

  if (rawLayout.startsWith('{')) {
    try {
      const parsed = JSON.parse(rawLayout);
      if (parsed.elements && Array.isArray(parsed.elements)) {
        canvaDesign = parsed;
      }
    } catch (e) {
      console.error(e);
    }
  }

  const isCustomMonisha = rawLayout === 'orange-classic';

  return (
    <div className="p-3 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-4 sm:space-y-6 print:p-0 print:m-0 print:space-y-0 pb-20 md:pb-8">
      {/* Action Bar - Hidden during printing */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 print:hidden">
        <Button 
          variant="ghost" 
          onClick={() => {
            sessionStorage.setItem('extractedBillData', JSON.stringify(data));
            navigate('/bills/review', { state: { isEditing: !!location.state?.invoiceId, invoiceId: location.state?.invoiceId } });
          }} 
          className="text-gray-600 hover:text-black text-xs font-semibold px-2"
        >
          <ArrowLeft className="mr-1.5 h-4 w-4" /> Back to Edit
        </Button>
        <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
          <Button variant="outline" size="sm" onClick={executePrint} className="flex-1 sm:flex-none text-xs font-bold h-9">
            <Printer className="mr-1.5 h-3.5 w-3.5" /> Print
          </Button>
          <Button variant="outline" size="sm" onClick={(e) => { e.preventDefault(); handleDownload(); }} className="flex-1 sm:flex-none text-xs font-bold h-9">
            <Download className="mr-1.5 h-3.5 w-3.5" /> PDF
          </Button>
          <Button variant="outline" size="sm" onClick={(e) => { e.preventDefault(); handleDownloadPNG(); }} className="flex-1 sm:flex-none text-xs font-bold h-9">
            <ImageIcon className="mr-1.5 h-3.5 w-3.5" /> PNG
          </Button>
          {isReadOnly && (
            <Button variant="outline" size="sm" onClick={(e) => { e.preventDefault(); handleShare(); }} className="flex-1 sm:flex-none text-xs font-bold h-9">
              <Share2 className="mr-1.5 h-3.5 w-3.5" /> Share
            </Button>
          )}
          {!isReadOnly && <Button size="sm" onClick={openPaymentModal} disabled={isSaving} className="w-full sm:w-auto bg-black hover:bg-gray-800 text-white text-xs font-bold h-9 shadow-sm">
            <Save className="mr-1.5 h-3.5 w-3.5" /> {isSaving ? 'Saving...' : 'Update & Issue'}
          </Button>}
        </div>
      </div>

      {/* Invoice Document Wrapper */}
      <div 
        ref={containerRef}
        className="w-full overflow-hidden bg-white/40 backdrop-blur-sm p-0 sm:p-6 print:p-0 print:bg-transparent rounded-2xl print:overflow-visible print:block border border-white/60 shadow-sm"
      >
        <div 
          style={{ 
            transform: `scale(${scale})`, 
            transformOrigin: 'top left',
            marginBottom: scale < 1 ? `-${(canvaDesign.canvasHeight || 1050) * (1 - scale)}px` : '0',
            width: '800px',
            marginLeft: scale < 1 ? `calc(50% - ${800 * scale / 2}px)` : 'auto',
            marginRight: scale < 1 ? '0' : 'auto'
          }}
          className="print:!transform-none print:!mb-0 print:!w-full print:!m-0 print-override"
        >
          <div 
            ref={invoiceRef}
            style={{
              width: '800px',
              minHeight: `${canvaDesign.canvasHeight || 1050}px`,
              backgroundColor: canvaDesign.canvasBg || '#ffffff'
            }}
            className={`relative bg-white shadow-sm border border-gray-200 print:border-none print:shadow-none print:p-0 print:m-0 ${
              canvaDesign.fontFamily === 'serif' ? 'font-serif' : 
              canvaDesign.fontFamily === 'mono' ? 'font-mono' : 'font-sans'
            }`}
          >
            {isCustomMonisha ? (
              <CustomMonishaLayout data={data} settings={settings} />
            ) : (
              <>
                {/* Render All Canva Placed Elements */}
                {canvaDesign.elements.filter(el => el.visible).map((el) => {
                  return (
                    <div
                      key={el.id}
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
                      }}
                    >
                      {/* COMPANY HEADER */}
                      {el.type === 'company_header' && (
                        <div className="flex items-center gap-3">
                          {settings?.logoUrl ? (
                            <img src={settings.logoUrl} alt="Logo" className="h-14 w-14 object-contain rounded-lg shrink-0" />
                          ) : (
                            <div 
                              className="h-14 w-14 rounded-xl flex items-center justify-center text-white shadow-sm font-bold text-lg shrink-0"
                              style={{ backgroundColor: canvaDesign.primaryColor }}
                            >
                              {settings?.companyName ? settings.companyName.slice(0, 2).toUpperCase() : <Building2 className="h-7 w-7" />}
                            </div>
                          )}
                          <div>
                            <h1 className="text-xl font-bold tracking-tight leading-tight" style={{ color: canvaDesign.primaryColor }}>
                              {settings?.companyName || 'Your Company Name'}
                            </h1>
                            {settings?.address && <p className="text-xs text-gray-500 mt-0.5">{settings.address}</p>}
                            {settings?.phone && <p className="text-xs text-gray-500">Phone: {settings.phone}</p>}
                            {settings?.gstNo && <p className="text-xs font-semibold text-gray-600 mt-0.5">GST: {settings.gstNo}</p>}
                          </div>
                        </div>
                      )}

                      {/* INVOICE META */}
                      {el.type === 'invoice_meta' && (
                        <div className="space-y-0.5">
                          <h2 className="text-3xl font-black uppercase tracking-wider leading-none" style={{ color: canvaDesign.primaryColor }}>
                            INVOICE
                          </h2>
                          <p className="font-semibold text-gray-900 text-sm">
                            Invoice No: {data.invoiceNumber || Date.now().toString().slice(-6)}
                          </p>
                          <p className="text-xs text-gray-500">
                            Date: {(data.date && data.date.includes('T') ? data.date.split('T')[0] : data.date) || new Date().toISOString().split('T')[0]}
                          </p>
                          {data.status === 'PAID' ? (
                            <div className="mt-1.5 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-green-100 text-green-800 border border-green-200">
                              <CheckCircle2 className="w-3 h-3 text-green-600" />
                              <span>PAID</span>
                            </div>
                          ) : (
                            <div className="mt-1.5 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-orange-100 text-orange-800 border border-orange-200">
                              <span>PENDING</span>
                            </div>
                          )}
                          {data.paymentMethod && (
                            <p className="text-[11px] text-gray-500 mt-0.5">Paid via {data.paymentMethod} {data.paymentReference ? `(${data.paymentReference})` : ''}</p>
                          )}
                        </div>
                      )}

                      {/* BILLED TO */}
                      {el.type === 'billed_to' && (
                        <div>
                          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">Billed To</p>
                          <p className="font-bold text-base text-gray-900">{data.customerName || 'Walk-in Customer'}</p>
                          {data.address && <p className="text-xs text-gray-600 mt-0.5 whitespace-pre-wrap">{data.address}</p>}
                          {data.phone && <p className="text-xs text-gray-600 mt-0.5">Phone: {data.phone}</p>}
                        </div>
                      )}

                      {/* ITEMS TABLE */}
                      {el.type === 'items_table' && (
                        <table className="w-full text-left border-collapse text-xs">
                          <thead>
                            <tr className="border-b bg-gray-50/80">
                              <th className="py-2.5 px-3 font-bold text-gray-700 w-[50%]">Item Description</th>
                              <th className="py-2.5 px-3 font-bold text-gray-700 text-center">Qty</th>
                              <th className="py-2.5 px-3 font-bold text-gray-700 text-right">Rate</th>
                              <th className="py-2.5 px-3 font-bold text-gray-700 text-right">Amount</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100 text-xs">
                            {data.items?.map((item: any, i: number) => (
                              <tr key={i} className="hover:bg-gray-50/50">
                                <td className="py-2 px-3 text-gray-800 font-medium">{item.description || '-'}</td>
                                <td className="py-2 px-3 text-gray-600 text-center">{item.quantity} {item.unit || ''}</td>
                                <td className="py-2 px-3 text-gray-600 text-right">₹{Number(item.rate || 0).toFixed(2)}</td>
                                <td className="py-2 px-3 text-gray-900 font-bold text-right">₹{Number(item.amount || 0).toFixed(2)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}

                      {/* TOTALS CARD */}
                      {el.type === 'totals_card' && (
                        <div className="space-y-1.5 text-xs">
                          <div className="flex justify-between text-gray-600">
                            <span>Subtotal:</span>
                            <span className="font-medium">₹{Number(data.subtotal || 0).toFixed(2)}</span>
                          </div>
                          {Number(data.discount) > 0 && (
                            <div className="flex justify-between text-gray-600">
                              <span>Discount:</span>
                              <span className="text-red-500 font-medium">-₹{Number(data.discount).toFixed(2)}</span>
                            </div>
                          )}
                          {Number(data.taxAmount) > 0 && (
                            <div className="flex justify-between text-gray-600">
                              <span>Tax:</span>
                              <span className="font-medium">₹{Number(data.taxAmount).toFixed(2)}</span>
                            </div>
                          )}
                          <div 
                            className="flex justify-between font-bold text-base pt-2 border-t mt-1"
                            style={{ borderColor: canvaDesign.primaryColor, color: el.textColor || canvaDesign.primaryColor }}
                          >
                            <span>Total Amount:</span>
                            <span>₹{Number(data.grandTotal || 0).toFixed(2)}</span>
                          </div>
                        </div>
                      )}

                      {/* BANK DETAILS */}
                      {el.type === 'bank_details' && (
                        <div>
                          <p className="font-bold text-xs uppercase tracking-wider text-gray-700 mb-1.5">Bank & Payment Information</p>
                          <div className="grid grid-cols-2 gap-1 text-xs text-gray-600">
                            <div>Bank: <span className="font-semibold text-gray-800">{settings?.bankName || 'State Bank of India'}</span></div>
                            <div>A/C: <span className="font-semibold text-gray-800">{settings?.accountNo || 'XXXX123456'}</span></div>
                            <div>IFSC: <span className="font-semibold text-gray-800">{settings?.ifsc || 'SBIN0001234'}</span></div>
                            <div>UPI ID: <span className="font-semibold text-gray-800">{settings?.upiId || 'company@upi'}</span></div>
                          </div>
                        </div>
                      )}

                      {/* NOTES & TERMS */}
                      {el.type === 'notes_terms' && (
                        <div>
                          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Notes & Terms</p>
                          <p className="text-xs text-gray-600 leading-relaxed whitespace-pre-wrap">
                            {data.notes || 'Payment due within 15 days of invoice date. Thank you for your business!'}
                          </p>
                        </div>
                      )}

                      {/* SIGNATURE BLOCK */}
                      {el.type === 'signature_block' && (
                        <div className="text-center">
                          <div className="w-36 border-b border-gray-400 mx-auto mb-1.5"></div>
                          <p className="text-xs font-semibold text-gray-700">Authorized Signature</p>
                          <p className="text-[10px] text-gray-400">{settings?.companyName || 'For Organization'}</p>
                        </div>
                      )}

                    </div>
                  );
                })}
              </>
            )}
          </div>
        </div>
      </div>
      
      {/* Global Print Styles */}
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body * {
            visibility: hidden;
          }
          #root, #root * {
            visibility: visible;
          }
          #root {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          @page {
            size: auto;
            margin: 0mm;
          }
          body {
            margin: 0px;
          }
        }
      `}} />

      <Dialog open={isPaymentModalOpen} onOpenChange={setIsPaymentModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Finalize Invoice</DialogTitle>
            <DialogDescription>
              Mark this invoice as paid and record payment details before saving.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <Label htmlFor="isPaid" className="font-semibold text-gray-900 cursor-pointer">
                Mark as Paid
              </Label>
              <input
                type="checkbox"
                id="isPaid"
                checked={paymentStatus === 'PAID'}
                onChange={(e) => setPaymentStatus(e.target.checked ? 'PAID' : 'PENDING')}
                className="w-5 h-5 rounded border-gray-300 text-black focus:ring-black cursor-pointer"
              />
            </div>
            {paymentStatus === 'PAID' && (
              <div className="space-y-4 pt-2">
                <div className="space-y-2">
                  <Label htmlFor="paymentMethod" className="text-gray-700">Payment Method</Label>
                  <select
                    id="paymentMethod"
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                  >
                    <option value="Cash">Cash</option>
                    <option value="Card">Credit/Debit Card</option>
                    <option value="UPI">UPI</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="paymentReference" className="text-gray-700">Transaction ID / Reference (Optional)</Label>
                  <Input 
                    id="paymentReference"
                    placeholder="e.g. TXN123456789"
                    value={paymentReference}
                    onChange={(e) => setPaymentReference(e.target.value)}
                    className="h-10 border-gray-300"
                  />
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPaymentModalOpen(false)}>Cancel</Button>
            <Button 
              className="bg-black hover:bg-gray-800 text-white"
              onClick={() => {
                const updatedData = {
                  ...data,
                  status: paymentStatus,
                  paymentMethod: paymentStatus === 'PAID' ? paymentMethod : null,
                  paymentReference: paymentStatus === 'PAID' ? paymentReference : null,
                };
                setData(updatedData);
                setIsPaymentModalOpen(false);
                handleSaveActual(updatedData);
              }}
            >
              Confirm & Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
