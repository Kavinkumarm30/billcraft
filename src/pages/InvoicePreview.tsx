import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Button } from '../components/ui/button';
import { Printer, Download, Save, ArrowLeft, Building2, Share2, CheckCircle, Image as ImageIcon } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { CustomMonishaLayout } from '../pages/CustomMonishaLayout';
import { defaultLayoutConfig, LayoutConfig } from '../pages/Settings';

import { toast } from 'sonner';
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

  // Parse user's custom layout config
  let layoutConfig: LayoutConfig = defaultLayoutConfig;
  const rawLayout = settings?.invoiceLayout || 'standard';

  if (rawLayout.startsWith('{')) {
    try {
      layoutConfig = { ...defaultLayoutConfig, ...JSON.parse(rawLayout) };
    } catch (e) {
      console.error(e);
    }
  } else if (rawLayout === 'orange-classic') {
    layoutConfig = {
      ...defaultLayoutConfig,
      primaryColor: '#ea580c',
      fontFamily: 'serif',
      borderStyle: 'double',
      tableHeaderStyle: 'accent'
    };
  }

  const isCustomMonisha = rawLayout === 'orange-classic';

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-6 print:p-0 print:m-0 print:space-y-0">
      {/* Action Bar - Hidden during printing */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 print:hidden">
        <Button 
          variant="ghost" 
          onClick={() => {
            sessionStorage.setItem('extractedBillData', JSON.stringify(data));
            navigate('/bills/review', { state: { isEditing: !!location.state?.invoiceId, invoiceId: location.state?.invoiceId } });
          }} 
          className="text-gray-600 hover:text-black"
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Edit
        </Button>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Button variant="outline" onClick={executePrint} className="flex-1 sm:flex-none">
            <Printer className="mr-2 h-4 w-4" /> Print
          </Button>
          <Button variant="outline" onClick={(e) => { e.preventDefault(); handleDownload(); }} className="flex-1 sm:flex-none">
            <Download className="mr-2 h-4 w-4" /> Download PDF
          </Button>
          <Button variant="outline" onClick={(e) => { e.preventDefault(); handleDownloadPNG(); }} className="flex-1 sm:flex-none">
            <ImageIcon className="mr-2 h-4 w-4" /> Download PNG
          </Button>
          {isReadOnly && (
            <Button variant="outline" onClick={(e) => { e.preventDefault(); handleShare(); }} className="flex-1 sm:flex-none">
              <Share2 className="mr-2 h-4 w-4" /> Share
            </Button>
          )}
          {!isReadOnly && <Button onClick={openPaymentModal} disabled={isSaving} className="flex-1 sm:flex-none bg-black hover:bg-gray-800 text-white">
            <Save className="mr-2 h-4 w-4" /> {isSaving ? 'Saving...' : 'Update & Issue'}
          </Button>}
        </div>
      </div>

      {/* Invoice Document Wrapper */}
      <div 
        ref={containerRef}
        className="w-full overflow-hidden bg-gray-50/50 p-0 sm:p-6 print:p-0 print:bg-transparent rounded-xl print:overflow-visible print:block"
      >
        <div 
          style={{ 
            transform: `scale(${scale})`, 
            transformOrigin: 'top left',
            marginBottom: scale < 1 ? `-${1131 * (1 - scale)}px` : '0',
            width: '800px',
            marginLeft: scale < 1 ? `calc(50% - ${800 * scale / 2}px)` : 'auto',
            marginRight: scale < 1 ? '0' : 'auto'
          }}
          className="print:!transform-none print:!mb-0 print:!w-full print:!m-0 print-override"
        >
          <div 
            ref={invoiceRef}
            className={`bg-white p-8 sm:p-12 w-full min-h-[1131px] relative print:border-none print:shadow-none print:p-8 print:m-0 print:min-w-0 print:min-h-0 ${
              layoutConfig.fontFamily === 'serif' ? 'font-serif' : 
              layoutConfig.fontFamily === 'mono' ? 'font-mono' : 'font-sans'
            } ${
              layoutConfig.borderStyle === 'double' ? 'border-[3px] border-double shadow-sm' : 
              layoutConfig.borderStyle === 'rounded' ? 'border-2 rounded-2xl shadow-sm' : 
              layoutConfig.borderStyle === 'clean' ? 'border-0 shadow-none' : 'border shadow-sm'
            }`}
            style={{ borderColor: layoutConfig.primaryColor }}
          >
            {isCustomMonisha ? (
              <CustomMonishaLayout data={data} settings={settings} />
            ) : (
              <>
                {/* Dynamically Rendered Sections according to Customizer Order */}
                {layoutConfig.sectionOrder.map((sectionId) => {
                  
                  // SECTION 1: HEADER
                  if (sectionId === 'header') {
                    return (
                      <div 
                        key="header"
                        className={`pb-8 mb-8 border-b flex ${
                          layoutConfig.headerAlignment === 'center' ? 'flex-col items-center text-center gap-4' :
                          layoutConfig.headerAlignment === 'right' ? 'flex-row-reverse justify-between text-right' :
                          layoutConfig.headerAlignment === 'left' ? 'flex-col items-start gap-4' :
                          'justify-between items-start'
                        }`}
                        style={{ borderColor: layoutConfig.primaryColor + '30' }}
                      >
                        {/* Company Details */}
                        <div className={`flex items-center gap-4 ${layoutConfig.headerAlignment === 'center' ? 'flex-col' : ''}`}>
                          {layoutConfig.showLogo && (
                            settings?.logoUrl ? (
                              <img src={settings.logoUrl} alt="Logo" className="h-16 w-16 object-contain rounded-lg" />
                            ) : (
                              <div 
                                className="h-14 w-14 rounded-xl flex items-center justify-center text-white shadow-sm font-bold text-lg"
                                style={{ backgroundColor: layoutConfig.primaryColor }}
                              >
                                {settings?.companyName ? settings.companyName.slice(0, 2).toUpperCase() : <Building2 className="h-7 w-7" />}
                              </div>
                            )
                          )}
                          <div>
                            <h1 className="text-2xl font-bold tracking-tight" style={{ color: layoutConfig.primaryColor }}>
                              {settings?.companyName || 'Your Company Name'}
                            </h1>
                            {layoutConfig.showAddress && settings?.address && (
                              <p className="text-sm text-gray-500 mt-0.5">{settings.address}</p>
                            )}
                            {layoutConfig.showPhone && settings?.phone && (
                              <p className="text-xs text-gray-500">Phone: {settings.phone}</p>
                            )}
                            {layoutConfig.showGst && settings?.gstNo && (
                              <p className="text-xs font-semibold text-gray-600">GST: {settings.gstNo}</p>
                            )}
                          </div>
                        </div>

                        {/* Invoice Meta */}
                        <div className={`space-y-1 ${layoutConfig.headerAlignment === 'center' ? 'text-center' : 'text-right'}`}>
                          <h2 
                            className="text-3xl font-black uppercase tracking-wider opacity-85"
                            style={{ color: layoutConfig.primaryColor }}
                          >
                            INVOICE
                          </h2>
                          <p className="font-semibold text-gray-900 text-sm">
                            Invoice No: {data.invoiceNumber || Date.now().toString().slice(-6)}
                          </p>
                          <p className="text-sm text-gray-500">
                            Date: {(data.date && data.date.includes('T') ? data.date.split('T')[0] : data.date) || new Date().toISOString().split('T')[0]}
                          </p>
                          {data.status === 'PAID' ? (
                            <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 bg-green-50 text-green-700 font-bold rounded-full border border-green-200 text-xs">
                              <CheckCircle className="w-3.5 h-3.5" />
                              <span>PAID</span>
                            </div>
                          ) : (
                            <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 bg-orange-50 text-orange-700 font-bold rounded-full border border-orange-200 text-xs">
                              <span>PENDING</span>
                            </div>
                          )}
                          {data.paymentMethod && (
                            <p className="text-xs text-gray-500 mt-1">Paid via {data.paymentMethod} {data.paymentReference ? `(${data.paymentReference})` : ''}</p>
                          )}
                        </div>
                      </div>
                    );
                  }

                  // SECTION 2: BILLED TO
                  if (sectionId === 'billed_to') {
                    return (
                      <div key="billed_to" className="mb-8">
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Billed To</h3>
                        <div className="text-gray-900">
                          <p className="font-bold text-lg">{data.customerName || 'Walk-in Customer'}</p>
                          {data.address && <p className="text-sm mt-1 text-gray-600 whitespace-pre-wrap">{data.address}</p>}
                          {data.phone && <p className="text-sm mt-0.5 text-gray-600">Phone: {data.phone}</p>}
                        </div>
                      </div>
                    );
                  }

                  // SECTION 3: ITEMS TABLE
                  if (sectionId === 'table') {
                    return (
                      <div key="table" className="mb-8">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr 
                              className="border-b"
                              style={{
                                backgroundColor: layoutConfig.tableHeaderStyle === 'accent' ? layoutConfig.primaryColor :
                                                 layoutConfig.tableHeaderStyle === 'dark' ? '#18181b' :
                                                 layoutConfig.tableHeaderStyle === 'light' ? '#f3f4f6' : 'transparent',
                                color: (layoutConfig.tableHeaderStyle === 'accent' || layoutConfig.tableHeaderStyle === 'dark') ? '#ffffff' : '#1f2937'
                              }}
                            >
                              <th className="py-2.5 px-3 font-semibold text-sm w-[50%]">Item Description</th>
                              <th className="py-2.5 px-3 font-semibold text-sm text-center">Qty</th>
                              <th className="py-2.5 px-3 font-semibold text-sm text-right">Rate</th>
                              <th className="py-2.5 px-3 font-semibold text-sm text-right">Amount</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100 text-sm">
                            {data.items?.map((item: any, i: number) => (
                              <tr key={i} className="hover:bg-gray-50/50">
                                <td className="py-2 px-3 text-gray-800 font-medium">{item.description || '-'}</td>
                                <td className="py-2 px-3 text-gray-600 text-center">{item.quantity} {item.unit || ''}</td>
                                <td className="py-2 px-3 text-gray-600 text-right">₹{Number(item.rate || 0).toFixed(2)}</td>
                                <td className="py-2 px-3 text-gray-900 font-semibold text-right">₹{Number(item.amount || 0).toFixed(2)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    );
                  }

                  // SECTION 4: TOTALS & SUMMARY
                  if (sectionId === 'totals') {
                    return (
                      <div key="totals" className="flex justify-end pt-4 mb-8 border-t border-gray-200">
                        <div className="w-full max-w-xs space-y-2 text-sm">
                          <div className="flex justify-between text-gray-600">
                            <span>Subtotal</span>
                            <span className="font-medium">₹{Number(data.subtotal || 0).toFixed(2)}</span>
                          </div>
                          {Number(data.discount) > 0 && (
                            <div className="flex justify-between text-gray-600">
                              <span>Discount</span>
                              <span className="text-red-500 font-medium">-₹{Number(data.discount).toFixed(2)}</span>
                            </div>
                          )}
                          {Number(data.taxAmount) > 0 && (
                            <div className="flex justify-between text-gray-600">
                              <span>Tax</span>
                              <span className="font-medium">₹{Number(data.taxAmount).toFixed(2)}</span>
                            </div>
                          )}
                          <div 
                            className="flex justify-between font-bold text-lg pt-3 border-t mt-2"
                            style={{ borderColor: layoutConfig.primaryColor, color: layoutConfig.primaryColor }}
                          >
                            <span>Total Amount</span>
                            <span>₹{Number(data.grandTotal || 0).toFixed(2)}</span>
                          </div>
                        </div>
                      </div>
                    );
                  }

                  // SECTION 5: BANK & PAYMENT DETAILS
                  if (sectionId === 'bank_details') {
                    if (!layoutConfig.showBankDetails && !settings?.bankName && !settings?.upiId) return null;
                    return (
                      <div key="bank_details" className="p-4 rounded-xl bg-gray-50 border border-gray-200 mb-8 text-xs">
                        <h4 className="font-bold text-gray-800 uppercase tracking-wider mb-2">Bank & Payment Information</h4>
                        <div className="grid grid-cols-2 gap-2 text-gray-600">
                          {settings?.bankName && <div>Bank: <span className="font-medium text-gray-900">{settings.bankName}</span></div>}
                          {settings?.accountNo && <div>Account No: <span className="font-medium text-gray-900">{settings.accountNo}</span></div>}
                          {settings?.ifsc && <div>IFSC Code: <span className="font-medium text-gray-900">{settings.ifsc}</span></div>}
                          {settings?.upiId && <div>UPI ID: <span className="font-medium text-gray-900">{settings.upiId}</span></div>}
                        </div>
                      </div>
                    );
                  }

                  // SECTION 6: NOTES & SIGNATURE
                  if (sectionId === 'notes_signature') {
                    return (
                      <div key="notes_signature" className="mt-8 pt-6 border-t border-gray-200">
                        {layoutConfig.showNotes && data.notes && (
                          <div className="mb-6">
                            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Notes & Terms</h4>
                            <p className="text-sm text-gray-600 whitespace-pre-wrap">{data.notes}</p>
                          </div>
                        )}

                        <div className="flex justify-between items-end pt-4">
                          {layoutConfig.showFooterMessage && (
                            <p className="text-sm font-semibold" style={{ color: layoutConfig.primaryColor }}>
                              {layoutConfig.footerMessage || 'Thank you for your business!'}
                            </p>
                          )}

                          {layoutConfig.showSignature && (
                            <div className="text-center">
                              <div className="w-36 border-b border-gray-400 mb-2"></div>
                              <span className="text-xs text-gray-500 font-medium block">
                                {layoutConfig.signatureText || 'Authorized Signature'}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  }

                  return null;
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
