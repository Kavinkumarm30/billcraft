import React, { useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  LayoutDashboard, 
  History, 
  PlusCircle, 
  Users, 
  Settings, 
  ShieldAlert, 
  LogOut,
  Menu,
  X,
  Plus,
  Receipt
} from 'lucide-react';
import { Logo } from './Logo';
import { Button } from './ui/button';

export default function Layout() {
  const { user, dbUser, logout } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'History', href: '/bills', icon: History },
    { name: 'Create Invoice', href: '/bills/create', icon: PlusCircle },
    { name: 'Customers', href: '/customers', icon: Users },
    { name: 'Settings', href: '/settings', icon: Settings },
  ];

  if (dbUser?.role === 'SUPER_ADMIN') {
    navigation.push({ name: 'Admin Control', href: '/admin', icon: ShieldAlert });
  }

  const mobileNav = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'History', href: '/bills', icon: History },
    { name: 'Create', href: '/bills/create', icon: Plus, isPrimary: true },
    { name: 'Customers', href: '/customers', icon: Users },
    { name: 'Settings', href: '/settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      
      {/* Mobile Top Header */}
      <div className="md:hidden sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-200 px-4 py-3 flex items-center justify-between shadow-2xs">
        <Link to="/dashboard" className="flex items-center gap-2">
          <Logo className="h-7" />
        </Link>

        <div className="flex items-center gap-2">
          {dbUser?.subscriptionStatus === 'ACTIVE' && (
            <span className="text-[10px] font-black uppercase tracking-wider bg-green-100 text-green-800 px-2 py-0.5 rounded-full border border-green-200">
              PRO
            </span>
          )}
          {dbUser?.role === 'SUPER_ADMIN' && (
            <span className="text-[10px] font-black uppercase tracking-wider bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full border border-purple-200">
              ADMIN
            </span>
          )}

          <Button 
            variant="ghost" 
            size="icon" 
            className="h-9 w-9 rounded-xl hover:bg-gray-100"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-label="Toggle Menu"
          >
            {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Backdrop Overlay for Mobile Sidebar */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 md:hidden transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar Navigation */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-72 md:w-64 bg-white border-r border-gray-200 transform transition-transform duration-200 ease-in-out md:translate-x-0 md:static md:z-auto flex flex-col justify-between shadow-2xl md:shadow-none
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div>
          <div className="p-6 flex items-center justify-between border-b border-gray-100 md:border-b-0">
            <Logo className="h-8 md:h-10" />
            <button 
              type="button" 
              onClick={() => setSidebarOpen(false)} 
              className="md:hidden p-1.5 rounded-lg text-gray-500 hover:bg-gray-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <nav className="px-4 py-2 space-y-1.5">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`group flex items-center px-3.5 py-2.5 text-sm font-semibold rounded-xl transition-all ${
                    isActive 
                      ? 'bg-black text-white shadow-xs' 
                      : 'text-gray-700 hover:bg-gray-100 hover:text-black'
                  }`}
                >
                  <item.icon className={`mr-3 h-4 w-4 ${isActive ? 'text-white' : 'text-gray-400 group-hover:text-gray-700'}`} />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>
        
        <div className="p-4 border-t border-gray-100 bg-gray-50/50">
          {dbUser?.role === 'SUPER_ADMIN' ? (
            <div className="mb-4 p-3 bg-purple-50 border border-purple-100 rounded-xl">
              <p className="text-xs font-bold text-purple-950 mb-0.5 flex items-center gap-1">
                ⚡ Super Admin Access
              </p>
              <p className="text-[10px] text-purple-700">Unlimited Bills & Full System Access</p>
            </div>
          ) : (
            <>
              {dbUser?.subscriptionStatus === 'TRIAL' && (
                <div className="mb-4 p-3 bg-blue-50 border border-blue-100 rounded-xl">
                  <p className="text-xs font-bold text-blue-900 mb-1">Free Trial Active</p>
                  <div className="w-full bg-blue-200 rounded-full h-1.5 mb-2 overflow-hidden">
                    <div className="bg-blue-600 h-1.5 rounded-full" style={{ width: `${(dbUser.trialInvoicesRemaining / 3) * 100}%` }}></div>
                  </div>
                  <p className="text-[10px] text-blue-800 font-semibold">{dbUser.trialInvoicesRemaining} of 3 free bills left</p>
                  <Link to="/payment" className="mt-2 block text-center text-xs font-bold bg-blue-600 text-white py-1.5 rounded-lg hover:bg-blue-700 shadow-xs">
                    Upgrade to Pro
                  </Link>
                </div>
              )}
              
              {dbUser?.subscriptionStatus === 'ACTIVE' && dbUser?.subscriptionEndsAt && (
                <div className="mb-4 p-3 bg-green-50 border border-green-100 rounded-xl">
                  <p className="text-xs font-bold text-green-900 mb-0.5 flex items-center gap-1">
                    ✨ Pro Plan Active
                  </p>
                  <p className="text-[10px] text-green-800">
                    Valid until {new Date(dbUser.subscriptionEndsAt).toLocaleDateString()}
                  </p>
                </div>
              )}

              {dbUser?.subscriptionStatus === 'PENDING_VERIFICATION' && (
                <div className="mb-4 p-3 bg-amber-50 border border-amber-100 rounded-xl">
                  <p className="text-xs font-bold text-amber-900 mb-0.5">Payment Pending</p>
                  <p className="text-[10px] text-amber-800">
                    Awaiting admin approval.
                  </p>
                </div>
              )}
            </>
          )}

          <div className="flex items-center gap-3 px-2 py-2 mb-2 bg-white rounded-xl border border-gray-100 shadow-2xs">
            <div className="h-8 w-8 rounded-full bg-black text-white flex items-center justify-center font-bold text-xs shrink-0">
              {user?.email?.charAt(0).toUpperCase()}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-bold text-gray-900 truncate max-w-[140px]">{user?.email}</span>
              <span className="text-[10px] text-gray-500 capitalize">{dbUser?.role?.replace('_', ' ').toLowerCase() || 'Employee'}</span>
            </div>
          </div>

          <Button 
            variant="ghost" 
            className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 text-xs font-bold h-9 rounded-xl" 
            onClick={logout}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 pb-24 md:pb-8">
          <Outlet />
        </main>
      </div>

      {/* Mobile App Bottom Navigation Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-gray-200 px-2 py-1.5 shadow-lg flex items-center justify-around">
        {mobileNav.map((item) => {
          const isActive = location.pathname === item.href;

          if (item.isPrimary) {
            return (
              <Link
                key={item.name}
                to={item.href}
                className="flex flex-col items-center justify-center -mt-5"
              >
                <div className="w-12 h-12 rounded-full bg-black text-white shadow-lg flex items-center justify-center hover:scale-105 active:scale-95 transition-transform border-4 border-white">
                  <Plus className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-bold text-gray-800 mt-0.5">{item.name}</span>
              </Link>
            );
          }

          return (
            <Link
              key={item.name}
              to={item.href}
              className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all ${
                isActive ? 'text-black font-black scale-105' : 'text-gray-500 hover:text-gray-900 font-medium'
              }`}
            >
              <item.icon className={`h-5 w-5 ${isActive ? 'text-black stroke-[2.5]' : 'text-gray-400'}`} />
              <span className="text-[10px] mt-0.5">{item.name}</span>
            </Link>
          );
        })}
      </div>

    </div>
  );
}
