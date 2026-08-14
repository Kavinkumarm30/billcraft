import React, { useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  LayoutDashboard, 
  FileText, 
  PlusCircle, 
  FileSearch, 
  Users, 
  Settings, 
  ShieldAlert, 
  LogOut,
  Menu,
  X
} from 'lucide-react';
import { Logo } from './Logo';
import { Button } from './ui/button';

export default function Layout() {
  const { user, dbUser, logout } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Invoices', href: '/bills', icon: FileText },
    { name: 'Create Invoice', href: '/bills/create', icon: PlusCircle },
    { name: 'OCR Upload', href: '/bills/review', icon: FileSearch },
    { name: 'Customers', href: '/customers', icon: Users },
    { name: 'Settings', href: '/settings', icon: Settings },
  ];

  if (dbUser?.role === 'SUPER_ADMIN') {
    navigation.push({ name: 'Admin Control', href: '/admin', icon: ShieldAlert });
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      {/* Mobile header */}
      <div className="md:hidden bg-white border-b border-gray-200 p-4 flex items-center justify-between">
        <Logo className="h-8" />
        <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(!sidebarOpen)}>
          {sidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </Button>
      </div>

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform duration-200 ease-in-out md:translate-x-0 md:static md:z-auto flex flex-col justify-between
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-6 hidden md:block">
          <Logo className="h-10" />
        </div>

        <nav className="px-4 space-y-1 flex-1">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.name}
                to={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`group flex items-center px-3 py-2.5 text-sm font-medium rounded-md transition-colors ${
                  isActive 
                    ? 'bg-gray-100 text-black' 
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <item.icon className={`mr-3 h-5 w-5 ${isActive ? 'text-black' : 'text-gray-400 group-hover:text-gray-500'}`} />
                {item.name}
              </Link>
            )
          })}
        </nav>
        
        <div className="p-4 border-t border-gray-100">
          {dbUser?.role === 'SUPER_ADMIN' ? (
            <div className="mb-4 p-3 bg-purple-50 border border-purple-100 rounded-lg">
              <p className="text-xs font-semibold text-purple-900 mb-1 flex items-center gap-1">
                ⚡ Super Admin Access
              </p>
              <p className="text-[10px] text-purple-700">Unlimited Bills & Full Control</p>
            </div>
          ) : (
            <>
              {dbUser?.subscriptionStatus === 'TRIAL' && (
                <div className="mb-4 p-3 bg-blue-50 border border-blue-100 rounded-lg">
                  <p className="text-xs font-semibold text-blue-900 mb-1">Free Trial Active</p>
                  <div className="w-full bg-blue-200 rounded-full h-1.5 mb-2">
                    <div className="bg-blue-600 h-1.5 rounded-full" style={{ width: `${(dbUser.trialInvoicesRemaining / 3) * 100}%` }}></div>
                  </div>
                  <p className="text-[10px] text-blue-800">{dbUser.trialInvoicesRemaining} of 3 bills remaining</p>
                  <Link to="/payment" className="mt-2 block text-center text-xs bg-blue-600 text-white py-1 rounded hover:bg-blue-700">
                    Upgrade Now
                  </Link>
                </div>
              )}
              
              {dbUser?.subscriptionStatus === 'ACTIVE' && dbUser?.subscriptionEndsAt && (
                <div className="mb-4 p-3 bg-green-50 border border-green-100 rounded-lg">
                  <p className="text-xs font-semibold text-green-900 mb-1">Pro Plan Active</p>
                  <p className="text-[10px] text-green-800">
                    Valid until {new Date(dbUser.subscriptionEndsAt).toLocaleDateString()}
                  </p>
                </div>
              )}

              {dbUser?.subscriptionStatus === 'PENDING_VERIFICATION' && (
                <div className="mb-4 p-3 bg-yellow-50 border border-yellow-100 rounded-lg">
                  <p className="text-xs font-semibold text-yellow-900 mb-1">Payment Pending</p>
                  <p className="text-[10px] text-yellow-800">
                    Awaiting admin approval.
                  </p>
                </div>
              )}
            </>
          )}

          <div className="flex items-center gap-3 px-3 py-2 mb-2">
            <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center text-black font-medium">
              {user?.email?.charAt(0).toUpperCase()}
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-medium text-gray-900 truncate max-w-[140px]">{user?.email}</span>
              <span className="text-xs text-gray-500 capitalize">{dbUser?.role?.replace('_', ' ').toLowerCase() || 'Employee'}</span>
            </div>
          </div>
          <Button variant="ghost" className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50" onClick={logout}>
            <LogOut className="mr-3 h-5 w-5" />
            Sign Out
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
