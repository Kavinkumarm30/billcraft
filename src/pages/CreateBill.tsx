import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { UploadCloud, FileImage, ArrowRight, Loader2, X } from 'lucide-react';
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
      
    } catch (error) {
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
    <div className="p-6 lg:p-8 max-w-4xl mx-auto space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Create New Bill</h1>
          <p className="text-gray-500 mt-1">Upload a handwritten bill or invoice to digitize it</p>
        </div>
        <Button onClick={handleManualCreate} variant="outline" className="shrink-0 bg-white hover:bg-gray-50">
          Create Manually
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>

      <Card className="border-0 shadow-sm ring-1 ring-gray-100 overflow-hidden">
        <CardHeader className="bg-gray-50/50 border-b border-gray-100 pb-4">
          <CardTitle className="text-lg">Upload Document</CardTitle>
          <CardDescription>Support for JPG, PNG, and JPEG</CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          {!file ? (
            <div
              className={`mt-2 flex justify-center rounded-xl border-2 border-dashed px-6 py-16 transition-colors ${
                isDragging ? 'border-black bg-gray-100' : 'border-gray-300 hover:border-gray-400'
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <div className="text-center space-y-4">
                <UploadCloud className="mx-auto h-12 w-12 text-gray-400" aria-hidden="true" />
                <div className="flex flex-col items-center gap-4 text-sm leading-6 text-gray-600">
                  <div className="flex items-center justify-center">
                    <label className="relative rounded-md bg-transparent font-semibold text-black focus-within:outline-none focus-within:ring-2 focus-within:ring-black focus-within:ring-offset-2 hover:text-gray-700 cursor-pointer">
                      <span>Upload a file</span>
                      <input 
                        ref={fileInputRef} 
                        id="file-upload" 
                        name="file-upload" 
                        type="file" 
                        className="sr-only" 
                        accept="image/*"
                        onChange={handleFileChange}
                      />
                    </label>
                    <p className="pl-1">or drag and drop</p>
                  </div>
                  
                  <div className="flex items-center gap-4 w-full px-8">
                    <div className="h-px bg-gray-200 flex-1"></div>
                    <span className="text-gray-400 text-xs font-medium uppercase tracking-wider">or</span>
                    <div className="h-px bg-gray-200 flex-1"></div>
                  </div>

                  <label className="relative inline-flex items-center justify-center gap-2 rounded-md bg-white px-4 py-2 font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus-within:outline-none focus-within:ring-2 focus-within:ring-black focus-within:ring-offset-2 cursor-pointer transition-all">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-500"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/></svg>
                    <span>Take a Photo</span>
                    <input 
                      type="file" 
                      className="sr-only" 
                      accept="image/*"
                      capture="environment"
                      onChange={handleFileChange}
                    />
                  </label>
                </div>
                <p className="text-xs leading-5 text-gray-500 mt-2">PNG, JPG up to 10MB</p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex items-start justify-between p-4 bg-gray-50 rounded-lg border border-gray-100">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 flex-shrink-0 bg-gray-200 rounded-lg flex items-center justify-center">
                    <FileImage className="h-6 w-6 text-black" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 truncate max-w-xs">{file.name}</p>
                    <p className="text-xs text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                </div>
                <Button variant="ghost" size="icon" className="text-gray-400 hover:text-red-500" onClick={() => { setFile(null); setPreview(null); }}>
                  <X className="h-5 w-5" />
                </Button>
              </div>

              {preview && (
                <div className="relative rounded-xl overflow-hidden border border-gray-200 bg-gray-100 flex justify-center max-h-[400px]">
                  <img src={preview} alt="Preview" className="object-contain max-h-[400px]" />
                </div>
              )}

              <div className="flex justify-end pt-4 border-t border-gray-100">
                <Button 
                  onClick={handleExtract} 
                  disabled={isExtracting}
                  className="h-11 px-8 text-base shadow-sm"
                >
                  {isExtracting ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Extracting via AI...
                    </>
                  ) : (
                    <>
                      Process Document
                      <ArrowRight className="ml-2 h-5 w-5" />
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
