import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, Phone, Mail, MessageCircle, ArrowLeft, Building2 } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Logo } from '../components/Logo';

export default function AccessRevoked() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 via-gray-50 to-gray-200 flex items-center justify-center p-4">
      <div className="w-full max-w-lg space-y-6">
        
        {/* Brand Header */}
        <div className="flex flex-col items-center justify-center text-center">
          <div className="bg-white p-3.5 rounded-2xl shadow-sm border border-gray-100 mb-3">
            <Logo className="h-12" />
          </div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-gray-900">BillCraft Studio</h1>
          <p className="text-gray-500 text-xs mt-0.5">AI-Powered Multi-Page Invoicing & Studio ERP</p>
        </div>

        {/* Main Alert Card */}
        <Card className="border-0 shadow-2xl shadow-gray-300/60 rounded-3xl overflow-hidden bg-white">
          <CardHeader className="bg-gradient-to-r from-red-50 to-orange-50/60 border-b border-red-100/80 p-6 text-center space-y-2">
            <div className="w-16 h-16 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto shadow-sm ring-8 ring-red-50">
              <ShieldAlert className="w-8 h-8" />
            </div>
            <CardTitle className="text-xl font-black text-gray-900 pt-1">
              Account Access Suspended
            </CardTitle>
            <CardDescription className="text-xs text-gray-600 max-w-md mx-auto leading-relaxed">
              Your account access has been paused or is currently inactive. Please contact the platform owner directly to restore full access for your organization.
            </CardDescription>
          </CardHeader>

          <CardContent className="p-6 space-y-5">
            
            {/* Owner Contact Box */}
            <div className="rounded-2xl border border-gray-200 bg-gray-50/70 p-4 space-y-3">
              <div className="flex items-center gap-2 border-b border-gray-200/80 pb-2.5">
                <Building2 className="w-4 h-4 text-purple-600" />
                <span className="text-xs font-bold text-gray-800 uppercase tracking-wider">
                  Platform Owner & Administrator
                </span>
              </div>

              <div className="space-y-3 pt-1">
                {/* Phone Contact */}
                <div className="flex items-center justify-between gap-3 bg-white p-3 rounded-xl border border-gray-100 shadow-2xs">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-green-100 text-green-700 flex items-center justify-center shrink-0">
                      <Phone className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold text-gray-500">Phone Support</p>
                      <a href="tel:9361654668" className="text-xs sm:text-sm font-bold text-gray-900 hover:text-green-700 font-mono">
                        +91 9361654668
                      </a>
                    </div>
                  </div>
                  <a 
                    href="tel:9361654668" 
                    className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-bold shadow-xs transition-transform active:scale-95 shrink-0"
                  >
                    Call Now
                  </a>
                </div>

                {/* Email Contact */}
                <div className="flex items-center justify-between gap-3 bg-white p-3 rounded-xl border border-gray-100 shadow-2xs">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                      <Mail className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold text-gray-500">Direct Email</p>
                      <a href="mailto:kavinkumarm30@gmail.com" className="text-xs sm:text-sm font-bold text-gray-900 hover:text-blue-700 break-all font-mono">
                        kavinkumarm30@gmail.com
                      </a>
                    </div>
                  </div>
                  <a 
                    href="mailto:kavinkumarm30@gmail.com?subject=BillCraft%20Access%20Request&body=Hi%20Kavin%2C%20please%20activate%20my%20account%20access." 
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-xs transition-transform active:scale-95 shrink-0"
                  >
                    Email
                  </a>
                </div>

                {/* WhatsApp Quick Chat */}
                <div className="flex items-center justify-between gap-3 bg-white p-3 rounded-xl border border-gray-100 shadow-2xs">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                      <MessageCircle className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold text-gray-500">WhatsApp Instant</p>
                      <p className="text-xs font-bold text-gray-900">Chat with Kavin Kumar</p>
                    </div>
                  </div>
                  <a 
                    href="https://wa.me/919361654668?text=Hi%20Kavin%2C%20I%20need%20access%20to%20my%20BillCraft%20Studio%20account." 
                    target="_blank" 
                    rel="noreferrer"
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-xs transition-transform active:scale-95 shrink-0"
                  >
                    WhatsApp
                  </a>
                </div>
              </div>
            </div>

            {/* Back to Login Button */}
            <div className="pt-2">
              <Button
                variant="outline"
                className="w-full h-11 text-xs font-bold rounded-xl border-gray-300 hover:bg-gray-100 text-gray-800 flex items-center justify-center gap-2"
                onClick={() => navigate('/login')}
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Sign In
              </Button>
            </div>

          </CardContent>
        </Card>

        {/* Footer info */}
        <p className="text-center text-[11px] text-gray-400">
          BillCraft Studio &bull; Enterprise Bill & Invoice Management
        </p>

      </div>
    </div>
  );
}
