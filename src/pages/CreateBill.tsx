import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { UploadCloud, FileImage, ArrowRight, Loader2, X, Camera, PenTool, Sparkles } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';

export default function CreateBill() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { getToken } = useAuth();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      processFile(selectedFile);
    }
  };

  const processFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file (JPG, PNG)');
      return;
    }
    setFile(file);
    setPreview(URL.createObjectURL(file));
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
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      processFile(droppedFile);
    }
  };

  const handleExtract = async () => {
    if (!file) return;

    try {
      setIsExtracting(true);
      const token = await getToken();
      
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/extract', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: formData,
      });

      if (!response.ok) {
        const err = await response.json().catch(() => null); 
        const errMsg = err?.error?.message || err?.error || 'Failed to extract data';
        throw new Error(typeof errMsg === 'object' ? JSON.stringify(errMsg) : errMsg);
      }

      const data = await response.json();
      
      // Store extracted data in sessionStorage to pass to review screen
      sessionStorage.setItem('extractedBillData', JSON.stringify(data));
      sessionStorage.setItem('billImagePreview', preview || '');
      
      toast.success('Data extracted successfully');
      navigate('/bills/review');
      
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || 'Failed to extract data from image. Please try again.');
    } finally {
      setIsExtracting(false);
    }
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
    sessionStorage.setItem('billImagePreview', '');
    navigate('/bills/review');
  };

  return (
    <div className="space-y-4 sm:space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">Create Invoice</h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">Upload a photo of a bill to extract details, or create from scratch</p>
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
        <CardHeader className="bg-gradient-to-r from-gray-50 to-white border-b border-gray-100 p-4 sm:p-6">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-black" />
            <CardTitle className="text-sm sm:text-base font-bold text-gray-900">AI Bill Digitizer</CardTitle>
          </div>
          <CardDescription className="text-xs text-gray-500">
            Snap a receipt or upload an invoice image to auto-fill line items with Gemini AI
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          {!file ? (
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
                    Upload receipt, bill, or invoice photo
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Supports JPG, PNG, and JPEG formats (up to 15MB)
                  </p>
                </div>

                {/* Mobile & Desktop Action Buttons */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
                  {/* Camera Snap on Mobile */}
                  <label className="flex items-center justify-center gap-2 rounded-xl bg-black text-white px-4 py-2.5 font-bold text-xs shadow-sm hover:bg-gray-800 cursor-pointer transition-all active:scale-95">
                    <Camera className="w-4 h-4" />
                    <span>Take Photo</span>
                    <input 
                      type="file" 
                      className="sr-only" 
                      accept="image/*"
                      capture="environment"
                      onChange={handleFileChange}
                    />
                  </label>

                  {/* Browse Gallery / Files */}
                  <label className="flex items-center justify-center gap-2 rounded-xl bg-white text-gray-900 border border-gray-300 px-4 py-2.5 font-bold text-xs shadow-2xs hover:bg-gray-50 cursor-pointer transition-all active:scale-95">
                    <UploadCloud className="w-4 h-4 text-gray-500" />
                    <span>Browse Gallery</span>
                    <input 
                      ref={fileInputRef} 
                      type="file" 
                      className="sr-only" 
                      accept="image/*"
                      onChange={handleFileChange}
                    />
                  </label>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 sm:p-4 bg-gray-50 rounded-xl border border-gray-200">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-10 w-10 flex-shrink-0 bg-white border rounded-lg flex items-center justify-center shadow-2xs">
                    <FileImage className="h-5 w-5 text-black" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-gray-900 truncate max-w-[180px] sm:max-w-xs">{file.name}</p>
                    <p className="text-[10px] text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB • Image Attached</p>
                  </div>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 text-gray-400 hover:text-red-500 rounded-lg shrink-0" 
                  onClick={() => { setFile(null); setPreview(null); }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {preview && (
                <div className="relative rounded-xl overflow-hidden border border-gray-200 bg-gray-900 flex justify-center max-h-[350px]">
                  <img src={preview} alt="Preview" className="object-contain max-h-[350px]" />
                </div>
              )}

              <div className="flex justify-end pt-2">
                <Button 
                  onClick={handleExtract} 
                  disabled={isExtracting}
                  className="w-full sm:w-auto h-11 px-8 bg-black hover:bg-gray-800 text-white font-bold text-xs shadow-md transition-transform active:scale-95"
                >
                  {isExtracting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Extracting via AI...
                    </>
                  ) : (
                    <>
                      Extract & Review Line Items
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
