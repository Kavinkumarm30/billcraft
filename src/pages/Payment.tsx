import React, { useState, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { toast } from 'sonner';
import { Copy, Check } from 'lucide-react';

export default function Payment() {
  const { dbUser, getToken, logout } = useAuth();
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [base64Image, setBase64Image] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const upiId = "kavinkumar.m30-1@oksbi";

  const handleCopyUpi = () => {
    navigator.clipboard.writeText(upiId);
    setCopied(true);
    toast.success("UPI ID copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file.');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setBase64Image(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    if (!base64Image) {
      toast.error('Please upload a screenshot first.');
      return;
    }

    setLoading(true);
    try {
      const token = await getToken();
      const response = await fetch('/api/payments/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ screenshotUrl: base64Image }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit payment details');
      }

      toast.success('Payment submitted for verification!');
      setTimeout(() => {
        window.location.href = '/dashboard'; // Force refresh
      }, 1500);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const status = dbUser?.subscriptionStatus;

  if (status === 'PENDING_VERIFICATION') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full text-center border">
          <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Verification Pending</h1>
          <p className="text-gray-600 text-sm mb-6">Your payment screenshot is under review by Super Admin. Access will be granted shortly.</p>
          <Button variant="outline" className="w-full" onClick={logout}>
            Back to Login
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full border">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Upgrade to Pro</h1>
          <p className="text-gray-500 text-sm mt-1">
            {status === 'TRIAL' ? 'Your free trial invoice limit has been reached.' : 'Your subscription has expired.'}
          </p>
          <p className="text-xl font-bold text-blue-600 mt-2">₹499 <span className="text-xs text-gray-500 font-normal">/ 31 Days Access</span></p>
        </div>

        {/* QR Code & UPI details */}
        <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 flex flex-col items-center mb-6">
          <p className="text-xs font-semibold text-gray-700 mb-3 uppercase tracking-wider">Scan with Google Pay / PhonePe / Paytm</p>
          <div className="w-56 h-56 bg-white border border-gray-200 rounded-xl p-2 flex items-center justify-center shadow-sm">
            <img 
              src="/payment-qr.png" 
              alt="Google Pay UPI QR Code" 
              className="max-w-full max-h-full object-contain rounded" 
            />
          </div>

          <div className="mt-4 w-full bg-white p-2.5 rounded-lg border border-gray-200 flex items-center justify-between">
            <div className="truncate mr-2">
              <p className="text-[10px] text-gray-500 font-medium">UPI ID</p>
              <p className="text-xs font-mono font-bold text-gray-900 truncate">{upiId}</p>
            </div>
            <Button size="sm" variant="secondary" className="h-8 text-xs shrink-0" onClick={handleCopyUpi}>
              {copied ? <Check className="h-3.5 w-3.5 text-green-600 mr-1" /> : <Copy className="h-3.5 w-3.5 mr-1" />}
              {copied ? 'Copied' : 'Copy'}
            </Button>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Upload Payment Screenshot</label>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              ref={fileInputRef}
              onChange={handleFileChange}
            />
            <Button
              type="button"
              variant="outline"
              className="w-full h-10 text-sm"
              onClick={() => fileInputRef.current?.click()}
            >
              {base64Image ? 'Change Screenshot' : 'Select Image Screenshot'}
            </Button>
          </div>

          {base64Image && (
            <div className="relative mt-2 h-32 bg-gray-100 rounded-lg overflow-hidden border border-gray-200 flex items-center justify-center">
              <img src={base64Image} alt="Payment Preview" className="max-h-full max-w-full object-contain" />
            </div>
          )}

          <Button
            type="button"
            className="w-full mt-4 h-11 text-sm font-semibold"
            disabled={!base64Image || loading}
            onClick={handleSubmit}
          >
            {loading ? 'Submitting...' : 'Submit Payment for Approval'}
          </Button>

          <Button
            type="button"
            variant="ghost"
            className="w-full text-xs text-gray-500 hover:text-gray-700"
            onClick={logout}
          >
            Sign Out
          </Button>
        </div>
      </div>
    </div>
  );
}
