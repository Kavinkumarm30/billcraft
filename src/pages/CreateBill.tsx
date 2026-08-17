import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { UploadCloud, FileImage, ArrowRight, Loader2, X, Camera, PenTool, Sparkles, Plus, Layers, Image as ImageIcon, Eye } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';
import { Dialog, DialogContent } from '../components/ui/dialog';

export default function CreateBill() {
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractionError, setExtractionError] = useState<string | null>(null);
  const [previewModalUrl, setPreviewModalUrl] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { getToken } = useAuth();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (selectedFiles && selectedFiles.length > 0) {
      processFiles(Array.from(selectedFiles));
    }
    // Reset inputs so selecting the same file triggers change
    if (e.target) e.target.value = '';
  };

  const processFiles = (newFiles: File[]) => {
    setExtractionError(null);
    const validImageFiles: File[] = [];
    const validPreviews: string[] = [];

    for (const file of newFiles) {
      if (!file.type.startsWith('image/')) {
        toast.error(`"${file.name}" is not an image. Only JPG and PNG are supported.`);
        continue;
      }
      if (file.size > 15 * 1024 * 1024) {
        toast.error(`"${file.name}" exceeds 15MB limit.`);
        continue;
      }
      validImageFiles.push(file);
      validPreviews.push(URL.createObjectURL(file));
    }

    if (validImageFiles.length > 0) {
      setFiles((prev) => [...prev, ...validImageFiles]);
      setPreviews((prev) => [...prev, ...validPreviews]);
      toast.success(`Added ${validImageFiles.length} page(s). Total: ${files.length + validImageFiles.length} page(s)`);
    }
  };

  const removePage = (indexToRemove: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== indexToRemove));
    setPreviews((prev) => {
      // Revoke object URL
      if (prev[indexToRemove]) URL.revokeObjectURL(prev[indexToRemove]);
      return prev.filter((_, i) => i !== indexToRemove);
    });
  };

  const clearAllPages = () => {
    previews.forEach((p) => URL.revokeObjectURL(p));
    setFiles([]);
    setPreviews([]);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFiles = e.dataTransfer.files;
    if (droppedFiles && droppedFiles.length > 0) {
      processFiles(Array.from(droppedFiles));
    }
  };

  const handleExtract = async () => {
    if (files.length === 0) {
      toast.error('Please upload or snap at least one bill page.');
      return;
    }

    try {
      setIsExtracting(true);
      setExtractionError(null);
      const token = await getToken();
      
      const formData = new FormData();
      files.forEach((file) => {
        formData.append('files', file);
      });

      const response = await fetch('/api/extract', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: formData,
      });

      if (!response.ok) {
        const err = await response.json().catch(() => null); 
        const errMsg = err?.error?.message || err?.error || 'Failed to extract bill data';
        throw new Error(typeof errMsg === 'object' ? JSON.stringify(errMsg) : errMsg);
      }

      const data = await response.json();
      
      // Store extracted data and all page previews in sessionStorage
      sessionStorage.setItem('extractedBillData', JSON.stringify(data));
      sessionStorage.setItem('billImagePreviews', JSON.stringify(previews));
      sessionStorage.setItem('billImagePreview', previews[0] || '');
      
      toast.success(files.length > 1 
        ? `Successfully extracted all ${files.length} pages into 1 bill!` 
        : 'Data extracted successfully'
      );
      navigate('/bills/review');
      
    } catch (error: any) {
      console.error(error);
      const msg = error.message || 'Failed to extract data from bill images.';
      setExtractionError(msg);
      toast.error(msg);
    } finally {
      setIsExtracting(false);
    }
  };

  const handleContinueWithManual = () => {
    const prefilledData = {
      customerName: 'Customer',
      phone: '',
      address: '',
      invoiceNumber: 'INV-' + Date.now().toString().slice(-6),
      date: new Date().toISOString().split('T')[0],
      items: [
        { description: 'Item 1', quantity: 1, rate: 0, amount: 0 }
      ],
      subtotal: 0,
      discount: 0,
      taxAmount: 0,
      grandTotal: 0,
      notes: '',
      status: 'PENDING'
    };
    sessionStorage.setItem('extractedBillData', JSON.stringify(prefilledData));
    sessionStorage.setItem('billImagePreviews', JSON.stringify(previews));
    sessionStorage.setItem('billImagePreview', previews[0] || '');
    navigate('/bills/review');
  };

  const handleManualCreate = () => {
    const emptyData = {
      customerName: '',
      phone: '',
      address: '',
      items: [],
      subtotal: 0,
      discount: 0,
      taxAmount: 0,
      grandTotal: 0,
      notes: '',
      status: 'PENDING'
    };
    sessionStorage.setItem('extractedBillData', JSON.stringify(emptyData));
    sessionStorage.setItem('billImagePreviews', JSON.stringify([]));
    sessionStorage.setItem('billImagePreview', '');
    navigate('/bills/review');
  };

  return (
    <div className="space-y-4 sm:space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">Create Invoice</h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
            Upload single or multi-page handwritten/printed bills, or build an invoice from scratch
          </p>
        </div>
        <Button 
          onClick={handleManualCreate} 
          variant="outline" 
          className="shrink-0 bg-white hover:bg-gray-50 text-xs font-bold h-9 shadow-2xs w-full sm:w-auto"
        >
          <PenTool className="mr-1.5 h-3.5 w-3.5" />
          Create Manually
        </Button>
      </div>

      <Card className="border-0 shadow-sm ring-1 ring-gray-100 overflow-hidden rounded-2xl">
        <CardHeader className="bg-gradient-to-r from-gray-50 to-white border-b border-gray-100 p-4 sm:p-6 flex flex-row items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-black" />
              <CardTitle className="text-sm sm:text-base font-bold text-gray-900">
                AI Multi-Page Bill Digitizer
              </CardTitle>
            </div>
            <CardDescription className="text-xs text-gray-500 mt-0.5">
              Snap 1 or more consecutive bill pages — AI will automatically merge all items into one invoice!
            </CardDescription>
          </div>

          {files.length > 0 && (
            <span className="inline-flex items-center gap-1.5 bg-black text-white text-xs font-bold px-3 py-1 rounded-full shadow-xs">
              <Layers className="w-3.5 h-3.5" />
              {files.length} {files.length === 1 ? 'Page' : 'Pages'} Added
            </span>
          )}
        </CardHeader>

        <CardContent className="p-4 sm:p-6 space-y-6">
          {/* Multi-Page Upload Dropzone (When Empty) */}
          {files.length === 0 ? (
            <div
              className={`rounded-2xl border-2 border-dashed p-6 sm:p-12 transition-all text-center ${
                isDragging ? 'border-black bg-gray-50' : 'border-gray-300 hover:border-gray-400 bg-gray-50/40'
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <div className="max-w-md mx-auto space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-white border border-gray-200 shadow-xs flex items-center justify-center mx-auto text-black">
                  <UploadCloud className="h-7 w-7 text-gray-700" />
                </div>
                
                <div>
                  <p className="text-sm font-bold text-gray-900">
                    Upload bill or snap invoice photo(s)
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Supports single-page or multi-page written bills (JPG, PNG)
                  </p>
                </div>

                {/* Mobile & Desktop Action Buttons */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
                  {/* Camera Snap on Mobile */}
                  <label className="flex items-center justify-center gap-2 rounded-xl bg-black text-white px-4 py-2.5 font-bold text-xs shadow-sm hover:bg-gray-800 cursor-pointer transition-all active:scale-95">
                    <Camera className="w-4 h-4" />
                    <span>Take Photo (Page 1)</span>
                    <input 
                      ref={cameraInputRef}
                      type="file" 
                      className="sr-only" 
                      accept="image/*"
                      capture="environment"
                      onChange={handleFileChange}
                    />
                  </label>

                  {/* Browse Gallery / Multiple Files */}
                  <label className="flex items-center justify-center gap-2 rounded-xl bg-white text-gray-900 border border-gray-300 px-4 py-2.5 font-bold text-xs shadow-2xs hover:bg-gray-50 cursor-pointer transition-all active:scale-95">
                    <UploadCloud className="w-4 h-4 text-gray-500" />
                    <span>Browse / Select Pages</span>
                    <input 
                      ref={fileInputRef} 
                      type="file" 
                      multiple
                      className="sr-only" 
                      accept="image/*"
                      onChange={handleFileChange}
                    />
                  </label>
                </div>

                <div className="pt-2 text-[11px] text-gray-400">
                  Tip: If your bill has multiple sheets or receipts, you can upload all pages together.
                </div>
              </div>
            </div>
          ) : (
            /* Multi-Page Gallery & Page Manager */
            <div className="space-y-5">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-gray-100">
                <div>
                  <h3 className="font-bold text-sm text-gray-900 flex items-center gap-2">
                    <Layers className="w-4 h-4 text-black" />
                    Bill Pages ({files.length} {files.length === 1 ? 'page' : 'pages'})
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    All pages will be combined in this order into a single unified bill.
                  </p>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  {/* Add Camera Page Button */}
                  <label className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 rounded-xl bg-black text-white px-3 py-1.5 font-bold text-xs shadow-xs hover:bg-gray-800 cursor-pointer transition-transform active:scale-95">
                    <Camera className="w-3.5 h-3.5" />
                    <span>+ Snap Next Page</span>
                    <input 
                      type="file" 
                      className="sr-only" 
                      accept="image/*"
                      capture="environment"
                      onChange={handleFileChange}
                    />
                  </label>

                  {/* Add Gallery Page Button */}
                  <label className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 rounded-xl bg-white text-gray-800 border border-gray-300 px-3 py-1.5 font-bold text-xs shadow-2xs hover:bg-gray-50 cursor-pointer transition-transform active:scale-95">
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Add File</span>
                    <input 
                      type="file" 
                      multiple
                      className="sr-only" 
                      accept="image/*"
                      onChange={handleFileChange}
                    />
                  </label>

                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={clearAllPages}
                    className="text-xs text-red-600 hover:text-red-700 hover:bg-red-50 px-2 h-8 font-semibold"
                  >
                    Clear
                  </Button>
                </div>
              </div>

              {/* Grid of Uploaded Bill Pages */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {previews.map((previewUrl, idx) => (
                  <div 
                    key={idx} 
                    className="relative group rounded-xl overflow-hidden border-2 border-gray-200 hover:border-black bg-gray-900 transition-all shadow-sm flex flex-col"
                  >
                    {/* Page Number Badge */}
                    <div className="absolute top-2 left-2 z-10 bg-black/80 backdrop-blur-xs text-white text-[10px] font-black px-2 py-0.5 rounded-md shadow-xs">
                      Page {idx + 1}
                    </div>

                    {/* Remove Page Button */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        removePage(idx);
                      }}
                      className="absolute top-2 right-2 z-10 bg-red-600/90 hover:bg-red-700 text-white rounded-full p-1 shadow-md transition-transform hover:scale-110"
                      title="Remove this page"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>

                    {/* Image Thumbnail */}
                    <div 
                      className="h-44 w-full flex items-center justify-center overflow-hidden cursor-pointer bg-black/40"
                      onClick={() => setPreviewModalUrl(previewUrl)}
                    >
                      <img 
                        src={previewUrl} 
                        alt={`Bill Page ${idx + 1}`} 
                        className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform" 
                      />
                    </div>

                    {/* Bottom File Info Bar */}
                    <div className="p-2 bg-white border-t flex items-center justify-between text-[11px]">
                      <span className="truncate font-medium text-gray-700 max-w-[100px]">
                        {files[idx]?.name || `Page ${idx + 1}`}
                      </span>
                      <button 
                        type="button" 
                        onClick={() => setPreviewModalUrl(previewUrl)}
                        className="text-gray-500 hover:text-black flex items-center gap-0.5 text-[10px] font-bold"
                      >
                        <Eye className="w-3 h-3" /> View
                      </button>
                    </div>
                  </div>
                ))}

                {/* Add Next Page Card Slot */}
                <label className="h-44 border-2 border-dashed border-gray-300 hover:border-black rounded-xl bg-gray-50/50 hover:bg-gray-50 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all p-4 text-center group">
                  <div className="w-10 h-10 rounded-full bg-white shadow-xs border border-gray-200 flex items-center justify-center text-gray-600 group-hover:scale-110 transition-transform">
                    <Plus className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-bold text-gray-800">Add Page {files.length + 1}</span>
                  <span className="text-[10px] text-gray-400">Photo or Image</span>
                  <input 
                    type="file" 
                    multiple
                    className="sr-only" 
                    accept="image/*"
                    onChange={handleFileChange}
                  />
                </label>
              </div>

                {/* Error Banner with 1-click fallback & settings link */}
                {extractionError && (
                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl space-y-2 text-xs text-amber-900">
                    <div className="flex items-center justify-between">
                      <p className="font-bold text-sm text-amber-800">AI Extraction Notice</p>
                      <span className="text-[10px] bg-amber-200/60 text-amber-900 px-2 py-0.5 rounded font-semibold">Action Required</span>
                    </div>
                    <p className="text-amber-700 leading-relaxed">{extractionError}</p>
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <Button 
                        type="button" 
                        size="sm" 
                        variant="outline" 
                        onClick={() => navigate('/settings')} 
                        className="h-8 text-xs font-bold border-amber-300 text-amber-900 hover:bg-amber-100 bg-white"
                      >
                        ⚙️ Configure API Key in Settings
                      </Button>
                      <Button 
                        type="button" 
                        size="sm" 
                        onClick={handleContinueWithManual} 
                        className="h-8 text-xs font-bold bg-black text-white hover:bg-gray-800"
                      >
                        ✍️ Proceed with Manual Entry & Review
                      </Button>
                    </div>
                  </div>
                )}

                {/* Bottom Multi-Page Extraction Action */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-gray-100">
                  <p className="text-xs text-gray-500 font-medium text-center sm:text-left">
                    ✨ Gemini AI will combine line items across all <strong className="text-gray-900">{files.length} page(s)</strong> into one unified invoice.
                  </p>

                  <Button 
                    onClick={handleExtract} 
                    disabled={isExtracting}
                    className="w-full sm:w-auto h-11 px-8 bg-black hover:bg-gray-800 text-white font-bold text-xs shadow-md transition-transform active:scale-95 rounded-xl"
                  >
                    {isExtracting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Extracting {files.length} {files.length === 1 ? 'Page' : 'Pages'} with AI...
                      </>
                    ) : (
                      <>
                        Extract {files.length} {files.length === 1 ? 'Page' : 'Pages'} with AI
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
        </CardContent>
      </Card>

      {/* Enlarged Page Preview Modal */}
      <Dialog open={!!previewModalUrl} onOpenChange={() => setPreviewModalUrl(null)}>
        <DialogContent className="max-w-4xl p-2 bg-black/90 border-0">
          <div className="flex justify-center p-2">
            {previewModalUrl && (
              <img 
                src={previewModalUrl} 
                alt="Page Preview" 
                className="max-h-[80vh] max-w-full object-contain rounded" 
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

