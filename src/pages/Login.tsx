import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, AlertTriangle } from 'lucide-react';
import { Logo } from '../components/Logo';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { toast } from 'sonner';

export default function Login() {
  const { login, user } = useAuth();
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

  return (
    <div className="min-h-screen bg-gradient-to-r from-[#9b9b9b] to-[#f5f5f5] flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="flex flex-col items-center justify-center text-center">
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 mb-6">
            <Logo className="h-16" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">BillCraft Studio</h1>
          <p className="text-gray-500 mt-2">Studio Management & Billing Platform</p>
        </div>

        <Card className="border-0 shadow-xl shadow-gray-200/50">
          <CardHeader className="space-y-1 pb-6">
            <CardTitle className="text-xl text-center">Welcome back</CardTitle>
            <CardDescription className="text-center">
              Sign in to your organization account to continue
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {errorMessage && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2 text-red-700 text-xs">
                <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">Authentication Notice</p>
                  <p className="mt-1">{errorMessage}</p>
                </div>
              </div>
            )}

            <Button 
              className="w-full h-12 text-base font-medium bg-black hover:bg-gray-800 text-white rounded-xl shadow-md transition-all active:scale-95" 
              onClick={() => handleLogin()}
              disabled={loading}
            >
              {loading ? 'Signing in...' : 'Sign in with Google'}
              {!loading && <ArrowRight className="ml-2 h-4 w-4" />}
            </Button>

            <div className="text-center text-xs text-gray-500 mt-4">
              By signing in, you agree to our Terms of Service and Privacy Policy.
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
