import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Button } from '../components/ui/button';
import { Printer, Download, Save, ArrowLeft, Building2, Share2, CheckCircle, Image as ImageIcon } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { CustomMonishaLayout } from '../pages/CustomMonishaLayout';

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
  const { user, getToken } = useAuth();
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
      // Temporarily remove scaling from parent so the resolution is full
      const parent = invoiceRef.current.parentElement;
      const originalTransform = parent ? parent.style.transform : '';
      if (parent) parent.style.transform = 'none';

      // Small delay to allow browser to apply transform=none before capturing
      await new Promise(r => setTimeout(r, 100));

      const dataUrl = await toPng(invoiceRef.current, {
        quality: 1,
        pixelRatio: 2, // Higher resolution for crisp text
        skipFonts: false,
      });
      
      // Restore scaling
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
  const layout = settings?.invoiceLayout || 'standard';

  
  const getStyles = (l: string) => {
    const base = {
      fontFamily: '',
      wrapper: 'bg-white p-8 sm:p-12 border shadow-sm w-full min-h-[1131px] relative print:border-none print:shadow-none print:p-8 print:m-0 print:min-w-0 print:min-h-0 border-gray-200',
      headerContainer: 'flex items-start pb-8 mb-8 justify-between border-b border-gray-200',
      headerLeft: 'flex items-center gap-3',
      logoBox: 'h-12 w-12 rounded-xl flex items-center justify-center shadow-sm bg-black text-white',
      logoIcon: 'h-6 w-6 text-white',
      companyName: 'text-2xl font-bold tracking-tight text-gray-900',
      companyText: 'text-sm text-gray-500',
      headerRight: 'space-y-1 flex flex-col items-end text-right',
      invoiceTitle: 'text-3xl font-bold tracking-tight uppercase tracking-wider text-black/10',
      invoiceText: 'font-semibold text-gray-900',
      invoiceDate: 'text-sm text-gray-500',
      paidBadge: 'mt-2 inline-flex items-center gap-1.5 px-3 py-1 bg-green-50 text-green-700 font-bold rounded-full border border-green-200',
      billedTo: 'mb-12',
      tableHeader: 'border-b border-gray-200',
      tableTh: 'py-3 font-semibold text-gray-900',
      tableRow: 'border-b border-gray-100 last:border-0',
      totalsBorder: 'flex justify-end pt-6 border-t border-gray-200',
      notesBorder: 'mt-12 pt-8 border-t border-gray-100',
      footerBorder: 'mt-8 pt-8 border-t border-gray-200 flex justify-between items-center text-sm text-gray-500'
    };

    if (l === 'minimal') {
      base.headerContainer = 'flex items-start pb-8 mb-8 flex-col items-center text-center gap-6 border-b border-gray-200';
      base.headerLeft = 'flex flex-col items-center gap-3';
      base.headerRight = 'space-y-1 flex flex-col items-center text-center w-full';
      base.paidBadge = 'mt-2 inline-flex items-center gap-1.5 px-3 py-1 bg-green-50 text-green-700 font-bold rounded-full border border-green-200';
      base.billedTo = 'mb-12 text-center';
    } else if (l === 'modern') {
      base.headerContainer = 'flex items-start pb-8 mb-8 flex-row-reverse justify-between text-right border-b border-gray-200';
      base.headerLeft = 'flex flex-row-reverse items-center gap-3';
      base.headerRight = 'space-y-1 flex flex-col items-start text-left';
      base.paidBadge = 'mt-2 inline-flex items-center gap-1.5 px-3 py-1 bg-green-50 text-green-700 font-bold rounded-full border border-green-200';
    } else if (l === 'professional') {
      base.headerContainer = 'flex items-start justify-between bg-gray-50 p-6 rounded-lg border border-gray-200 mb-8';
      base.wrapper = 'bg-white p-8 sm:p-12 border shadow-sm w-full min-h-[1131px] relative print:border-none print:shadow-none print:p-8 print:m-0 print:min-w-0 print:min-h-0 border-gray-300';
      base.paidBadge = 'mt-2 inline-flex items-center gap-1.5 px-3 py-1 bg-green-100 text-green-800 font-bold rounded border border-green-300 shadow-sm';
    } else if (l === 'bold') {
      base.headerContainer = 'flex items-start justify-between bg-black text-white p-8 rounded-xl mb-8';
      base.wrapper = 'bg-white p-8 sm:p-12 border shadow-sm w-full min-h-[1131px] relative print:border-none print:shadow-none print:p-8 print:m-0 print:min-w-0 print:min-h-0 border-black';
      base.logoBox = 'h-12 w-12 rounded-xl flex items-center justify-center shadow-sm bg-white text-black';
      base.logoIcon = 'h-6 w-6 text-black';
      base.companyName = 'text-2xl font-bold tracking-tight text-white';
      base.companyText = 'text-sm text-gray-300';
      base.invoiceTitle = 'text-3xl font-bold tracking-tight uppercase tracking-wider text-white/20';
      base.invoiceText = 'font-semibold text-white';
      base.invoiceDate = 'text-sm text-gray-400';
      base.paidBadge = 'mt-2 inline-flex items-center gap-1.5 px-3 py-1 bg-green-500 text-black font-black rounded-sm tracking-wider uppercase';
    } else if (l === 'elegant') {
      base.fontFamily = 'font-serif';
      base.wrapper = 'bg-[#faf9f6] p-8 sm:p-12 border-2 border-double border-gray-300 shadow-sm w-full min-h-[1131px] relative print:border-none print:shadow-none print:p-8 print:m-0 print:min-w-0 print:min-h-0';
      base.headerContainer = 'flex items-start pb-8 mb-8 justify-between border-b-2 border-double border-gray-300';
      base.logoBox = 'h-12 w-12 rounded-full flex items-center justify-center shadow-sm bg-stone-800 text-stone-100';
      base.totalsBorder = 'flex justify-end pt-6 border-t-2 border-double border-gray-300';
      base.paidBadge = 'mt-2 inline-flex items-center gap-1.5 px-4 py-1 bg-transparent text-green-800 font-bold border border-green-800 rounded-full tracking-widest uppercase';
    } else if (l === 'tech') {
      base.fontFamily = 'font-mono';
      base.wrapper = 'bg-white p-8 sm:p-12 border shadow-sm w-full min-h-[1131px] relative print:border-none print:shadow-none print:p-8 print:m-0 print:min-w-0 print:min-h-0 border-blue-200';
      base.headerContainer = 'flex items-start pb-8 mb-8 justify-between border-b border-blue-200';
      base.logoBox = 'h-12 w-12 rounded flex items-center justify-center bg-blue-600 text-white';
      base.invoiceTitle = 'text-3xl font-bold tracking-tight uppercase tracking-wider text-blue-100';
      base.companyName = 'text-2xl font-bold tracking-tight text-blue-900';
      base.totalsBorder = 'flex justify-end pt-6 border-t border-blue-200';
      base.paidBadge = 'mt-2 inline-flex items-center gap-1.5 px-3 py-1 bg-green-500/10 text-green-600 font-bold border border-green-500/30 rounded-none uppercase tracking-widest';
    } else if (l === 'corporate') {
      base.headerContainer = 'flex items-start justify-between bg-slate-800 text-white p-8 mb-8';
      base.wrapper = 'bg-white sm:p-12 p-8 shadow-sm w-full min-h-[1131px] relative print:border-none print:shadow-none print:p-8 print:m-0 print:min-w-0 print:min-h-0 border border-slate-300';
      base.logoBox = 'h-12 w-12 rounded flex items-center justify-center bg-white text-slate-800';
      base.logoIcon = 'h-6 w-6 text-slate-800';
      base.companyName = 'text-2xl font-bold tracking-tight text-white';
      base.companyText = 'text-sm text-slate-300';
      base.invoiceTitle = 'text-3xl font-bold tracking-tight uppercase tracking-wider text-white/20';
      base.invoiceText = 'font-semibold text-white';
      base.invoiceDate = 'text-sm text-slate-300';
      base.paidBadge = 'mt-2 inline-flex items-center gap-1.5 px-3 py-1 bg-green-600 text-white font-bold rounded shadow-sm';
    } else if (l === 'playful') {
      base.wrapper = 'bg-amber-50/30 p-8 sm:p-12 border-4 border-amber-200 rounded-3xl shadow-sm w-full min-h-[1131px] relative print:border-none print:shadow-none print:p-8 print:m-0 print:min-w-0 print:min-h-0';
      base.headerContainer = 'flex items-start pb-8 mb-8 justify-between border-b-4 border-dashed border-amber-200';
      base.logoBox = 'h-12 w-12 rounded-2xl flex items-center justify-center bg-amber-400 text-amber-900 shadow-sm';
      base.invoiceTitle = 'text-3xl font-black tracking-tight uppercase tracking-wider text-amber-200';
      base.companyName = 'text-2xl font-black tracking-tight text-amber-900';
      base.totalsBorder = 'flex justify-end pt-6 border-t-4 border-dashed border-amber-200';
      base.footerBorder = 'mt-8 pt-8 border-t-4 border-dashed border-amber-200 flex justify-between items-center text-sm text-amber-700/50';
      base.paidBadge = 'mt-2 inline-flex items-center gap-1.5 px-4 py-1.5 bg-green-400 text-green-950 font-black rounded-full shadow-sm border-2 border-green-500 transform -rotate-2';
    } else if (l === 'classic') {
      base.wrapper = 'bg-white p-8 sm:p-12 border shadow-sm w-full min-h-[1131px] relative print:border-none print:shadow-none print:p-8 print:m-0 print:min-w-0 print:min-h-0 border-gray-400';
      base.headerContainer = 'flex items-end pb-8 mb-8 justify-between border-b border-gray-400';
      base.invoiceTitle = 'text-4xl font-normal tracking-tight uppercase tracking-widest text-gray-300';
      base.totalsBorder = 'flex justify-end pt-6 border-t border-gray-400';
      base.paidBadge = 'mt-2 inline-flex items-center gap-1.5 px-3 py-1 bg-white text-green-800 font-bold border-2 border-green-800 uppercase tracking-widest';
    }
    
    return base;
  };

  const s = getStyles(layout);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-6 print:p-0 print:m-0 print:space-y-0">
      {/* Action Bar - Hidden during printing */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 print:hidden">
        <Button variant="ghost" onClick={() => navigate('/bills/review')} className="text-gray-500">
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
          {!isReadOnly && <Button onClick={openPaymentModal} disabled={isSaving} className="flex-1 sm:flex-none bg-black hover:bg-gray-800">
            <Save className="mr-2 h-4 w-4" /> {isSaving ? 'Saving...' : 'Save & Issue'}
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
            className={layout === 'orange-classic' ? "print-override bg-white overflow-hidden" : `${s.wrapper} ${s.fontFamily}`}
          >
            {layout === 'orange-classic' ? (
               <CustomMonishaLayout data={data} settings={settings} />
            ) : (
              <>
          <div className={s.headerContainer}>
          <div className={s.headerLeft}>
             {settings?.logoUrl ? (
               <img src={settings.logoUrl} alt="Logo" className="h-16 object-contain" />
             ) : (
               <div className={s.logoBox}>
                 <Building2 className={s.logoIcon} />
               </div>
             )}
             <div>
               <h1 className={s.companyName}>{settings?.companyName || 'Your Company Name'}</h1>
               {settings?.address && <p className={s.companyText}>{settings.address}</p>}
               {settings?.gstNo && <p className={s.companyText}>GST: {settings.gstNo}</p>}
             </div>
          </div>
          <div className={s.headerRight}>
            <h2 className={s.invoiceTitle}>INVOICE</h2>
            <p className={s.invoiceText}>Invoice No: {data.invoiceNumber || Date.now().toString().slice(-6)}</p>
            <p className={s.invoiceDate}>Date: {(data.date && data.date.includes('T') ? data.date.split('T')[0] : data.date) || new Date().toISOString().split('T')[0]}</p>
            {data.status === 'PAID' && (
              <div className="flex flex-col gap-1 mt-2 w-full">
                <div className={s.paidBadge}>
                  <CheckCircle className="w-4 h-4" />
                  <span>PAID</span>
                </div>
                {data.paymentMethod && (
                  <p className="text-xs text-gray-500 mt-1">Paid via {data.paymentMethod} {data.paymentReference ? `(${data.paymentReference})` : ''}</p>
                )}
              </div>
            )}
          </div>
        </div>

        <div className={s.billedTo}>
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Billed To</h3>
          <div className="text-gray-900">
            <p className="font-bold text-lg">{data.customerName || ''}</p>
            {data.address && <p className="text-sm mt-1 whitespace-pre-wrap">{data.address}</p>}
            {data.phone && <p className="text-sm mt-1">Phone: {data.phone}</p>}
          </div>
        </div>

        <table className="w-full text-left mb-8">
          <thead>
            <tr className={s.tableHeader}>
              <th className={`${s.tableTh} w-[50%]`}>Item Description</th>
              <th className={`${s.tableTh} text-center`}>Qty</th>
              <th className={`${s.tableTh} text-right`}>Rate</th>
              <th className={`${s.tableTh} text-right`}>Amount</th>
            </tr>
          </thead>
          <tbody>
            {data.items?.map((item, i) => (
              <tr key={i} className={s.tableRow}>
                <td className="py-1.5 text-gray-700">{item.description || '-'}</td>
                <td className="py-1.5 text-gray-700 text-center">{item.quantity} {item.unit}</td>
                <td className="py-1.5 text-gray-700 text-right">₹{Number(item.rate).toFixed(2)}</td>
                <td className="py-1.5 text-gray-900 font-medium text-right">₹{Number(item.amount).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className={s.totalsBorder}>
          <div className="w-full max-w-sm space-y-3">
            <div className="flex justify-between text-gray-600 text-sm">
              <span>Subtotal</span>
              <span>₹{Number(data.subtotal || 0).toFixed(2)}</span>
            </div>
            {data.discount > 0 && (
              <div className="flex justify-between text-gray-600 text-sm">
                <span>Discount</span>
                <span className="text-red-500">-₹{Number(data.discount).toFixed(2)}</span>
              </div>
            )}
            {data.taxAmount > 0 && (
              <div className="flex justify-between text-gray-600 text-sm">
                <span>Tax</span>
                <span>₹{Number(data.taxAmount).toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-gray-900 font-bold text-lg pt-3 border-t border-gray-200 mt-3">
              <span>Total Amount</span>
              <span className="text-black">₹{Number(data.grandTotal || 0).toFixed(2)}</span>
            </div>
          </div>
        </div>
        
        {data.notes && (
           <div className={s.notesBorder}>
              <h3 className="text-sm font-semibold text-gray-900 mb-2">Notes</h3>
              <p className="text-sm text-gray-600 whitespace-pre-wrap">{data.notes}</p>
           </div>
        )}

        <div className={s.footerBorder}>
          <p>Thank you for your business!</p>
          <div className="text-xs text-gray-400 opacity-50 select-none">
            Generated by JenG Film Studio
          </div>
        </div>
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
