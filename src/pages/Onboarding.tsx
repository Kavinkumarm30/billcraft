import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { toast } from 'sonner';

export default function Onboarding() {
  const { getToken } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    companyName: '',
    address: '',
    phone: '',
    gstNo: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e?: React.FormEvent, isSkip: boolean = false) => {
    if (e) e.preventDefault();
    setLoading(true);
    try {
      const token = await getToken();
      
      const payload = isSkip ? {} : Object.fromEntries(
        Object.entries(formData).filter(([_, v]) => String(v || '').trim() !== '')
      );

      const response = await fetch('/api/onboarding', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error('Failed to complete onboarding');
      }
      toast.success(isSkip ? 'Onboarding skipped' : 'Onboarding complete!');
      window.location.href = '/dashboard'; // Force refresh to update AuthContext
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-r from-[#9b9b9b] to-[#f5f5f5] flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Welcome to BillCraft</h1>
          <p className="text-gray-500 mt-2">Let's get your company set up.</p>
        </div>
        <form onSubmit={(e) => handleSubmit(e, false)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
            <Input
              name="companyName"
              value={formData.companyName}
              onChange={handleChange}
              placeholder="e.g. Acme Corp"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Company Address</label>
            <Input
              name="address"
              value={formData.address}
              onChange={handleChange}
              placeholder="123 Business St."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
            <Input
              name="phone"
              type="tel"
              value={formData.phone}
              onChange={handleChange}
              placeholder="+91 9876543210"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">GST Number (Optional)</label>
            <Input
              name="gstNo"
              value={formData.gstNo}
              onChange={handleChange}
              placeholder="22AAAAA0000A1Z5"
            />
          </div>
          
          <div className="flex flex-col gap-2 mt-6">
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Saving...' : 'Complete Setup'}
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              className="w-full" 
              disabled={loading}
              onClick={() => handleSubmit(undefined, true)}
            >
              Skip for now
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
