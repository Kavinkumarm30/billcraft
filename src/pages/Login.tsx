import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, AlertTriangle, Sparkles, ShieldCheck } from 'lucide-react';
import { Logo } from '../components/Logo';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { toast } from 'sonner';

export default function Login() {
  const { login, loginDemo, user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // If already logged in, redirect to dashboard
  useEffect(() => {
    if (user) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, navigate]);

  if (user) {
    return null;
  }

  const handleLogin = async () => {
    try {
      setLoading(true);
      setErrorMessage(null);
      await login();
      navigate('/dashboard', { replace: true });
      toast.success('Logged in successfully');
    } catch (error: any) {
      console.error("Login Error:", error);
      const msg = error.message || 'Failed to log in. Please try again.';
      setErrorMessage(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickAccess = async () => {
    try {
      setLoading(true);
      setErrorMessage(null);
      await loginDemo();
      navigate('/dashboard', { replace: true });
      toast.success('Welcome back, Studio Owner!');
    } catch (error: any) {
      console.error("Quick Login Error:", error);
      toast.error('Failed to log in via Quick Access.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-r from-[#9b9b9b] to-[#f5f5f5] flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="flex flex-col items-center justify-center text-center">
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 mb-4">
            <Logo className="h-14" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-gray-900">BillCraft Studio</h1>
          <p className="text-gray-500 text-xs sm:text-sm mt-1">AI-Powered Multi-Page Invoicing &amp; Studio ERP</p>
        </div>

        <Card className="border-0 shadow-xl shadow-gray-200/50 rounded-2xl overflow-hidden">
          <CardHeader className="space-y-1 pb-4 text-center">
            <CardTitle className="text-lg sm:text-xl font-bold">Welcome back</CardTitle>
            <CardDescription className="text-xs">
              Sign in to your organization account to continue
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3.5 pt-0">
            {errorMessage && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2 text-red-700 text-xs">
                <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">Authentication Notice</p>
                  <p className="mt-0.5">{errorMessage}</p>
                </div>
              </div>
            )}

            <Button 
              className="w-full h-11 text-sm font-bold bg-black hover:bg-gray-800 text-white rounded-xl shadow-md transition-all active:scale-95 flex items-center justify-center gap-2" 
              onClick={() => handleLogin()}
              disabled={loading}
            >
              {loading ? 'Connecting...' : 'Sign in with Google'}
              {!loading && <ArrowRight className="h-4 w-4" />}
            </Button>

            <div className="relative my-2">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-gray-400 font-medium">Or</span>
              </div>
            </div>

            <Button 
              type="button"
              variant="outline"
              className="w-full h-11 text-xs font-bold border-gray-200 bg-gray-50/70 hover:bg-gray-100 text-gray-900 rounded-xl transition-all active:scale-95 flex items-center justify-center gap-2" 
              onClick={() => handleQuickAccess()}
              disabled={loading}
            >
              <Sparkles className="h-4 w-4 text-amber-600" />
              <span>⚡ Quick Studio Owner Access</span>
            </Button>

            <div className="flex items-center justify-center gap-1.5 pt-1 text-[11px] text-gray-400">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
              <span>Secure SSL Encrypted Session</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
