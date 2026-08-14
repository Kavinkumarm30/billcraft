import LoadingScreen from '../components/LoadingScreen';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { FileText, IndianRupee, Users, Clock, Plus, Sparkles, ArrowRight, TrendingUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';

export default function Dashboard() {
  const { getToken } = useAuth();
  const { data: dashboardStats, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: async () => {
      const token = await getToken();
      const res = await fetch('/api/dashboard', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to fetch dashboard stats');
      const data = await res.text(); 
      try { return JSON.parse(data); } catch (e) { throw new Error('API returned invalid JSON'); }
    }
  });

  const { data: userProfile, isLoading: isUserLoading } = useQuery({
    queryKey: ['me'],
    queryFn: async () => {
      const token = await getToken();
      const res = await fetch('/api/me', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to fetch user');
      return res.json().catch(() => ({}));
    }
  });

  const data = dashboardStats?.chartData || [];

  if (isLoading || isUserLoading) return <LoadingScreen message="Loading dashboard..." />;

  return (
    <div className="space-y-4 sm:space-y-6 max-w-6xl mx-auto">
      
      {/* Top Welcome Header & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gradient-to-r from-gray-900 via-black to-gray-800 text-white p-5 sm:p-6 rounded-2xl shadow-sm">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-white/20 text-white backdrop-blur-xs mb-2">
            <Sparkles className="w-3 h-3 text-amber-300" />
            AI-Powered Invoicing
          </div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
            Welcome back, {userProfile?.email?.split('@')[0] || 'User'} 👋
          </h1>
          <p className="text-xs sm:text-sm text-gray-300 mt-0.5">
            Extract bills instantly with AI OCR or generate invoices in seconds
          </p>
        </div>

        <div className="flex items-center gap-2 pt-2 sm:pt-0">
          <Link to="/bills/create" className="w-full sm:w-auto">
            <Button className="w-full sm:w-auto bg-white hover:bg-gray-100 text-black font-black text-xs h-10 px-5 shadow-sm rounded-xl">
              <Plus className="mr-1.5 h-4 w-4" /> Create Invoice
            </Button>
          </Link>
        </div>
      </div>

      {/* 4 Core Metric Cards (2x2 on Mobile, 4 in row on Desktop) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card className="border-0 shadow-sm ring-1 ring-gray-100 rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between pb-1.5 p-4">
            <CardTitle className="text-[11px] sm:text-xs font-bold text-gray-500 uppercase tracking-wider">Today's Sales</CardTitle>
            <div className="p-2 bg-green-50 text-green-600 rounded-xl">
              <IndianRupee className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-lg sm:text-2xl font-black text-gray-900">₹{(dashboardStats?.todaysRevenue || 0).toFixed(2)}</div>
            <p className="text-[10px] text-gray-400 mt-1 flex items-center gap-1 font-medium">
              <TrendingUp className="w-3 h-3 text-green-500" /> Recorded Today
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm ring-1 ring-gray-100 rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between pb-1.5 p-4">
            <CardTitle className="text-[11px] sm:text-xs font-bold text-gray-500 uppercase tracking-wider">Bills Created</CardTitle>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <FileText className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-lg sm:text-2xl font-black text-gray-900">{dashboardStats?.billsGenerated || 0}</div>
            <p className="text-[10px] text-gray-400 mt-1 font-medium">
              Total Invoices
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm ring-1 ring-gray-100 rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between pb-1.5 p-4">
            <CardTitle className="text-[11px] sm:text-xs font-bold text-gray-500 uppercase tracking-wider">Pending Bills</CardTitle>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
              <Clock className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-lg sm:text-2xl font-black text-amber-600">{dashboardStats?.pendingBills || 0}</div>
            <p className="text-[10px] text-gray-400 mt-1 font-medium">
              Awaiting Payment
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm ring-1 ring-gray-100 rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between pb-1.5 p-4">
            <CardTitle className="text-[11px] sm:text-xs font-bold text-gray-500 uppercase tracking-wider">Customers</CardTitle>
            <div className="p-2 bg-purple-50 text-purple-600 rounded-xl">
              <Users className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-lg sm:text-2xl font-black text-gray-900">{dashboardStats?.totalCustomers || 0}</div>
            <p className="text-[10px] text-gray-400 mt-1 font-medium">
              Saved Clients
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Chart and Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <Card className="border-0 shadow-sm ring-1 ring-gray-100 rounded-2xl">
          <CardHeader className="p-4 sm:p-6 pb-2">
            <CardTitle className="text-sm sm:text-base font-bold text-gray-900">Revenue Overview</CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-2">
            <div className="h-[240px] sm:h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#6b7280', fontSize: 11 }}
                    dy={6}
                  />
                  <YAxis 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#6b7280', fontSize: 11 }}
                    tickFormatter={(value) => `₹${value}`}
                  />
                  <Tooltip 
                    cursor={{ fill: '#f9fafb' }}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px -2px rgb(0 0 0 / 0.1)' }}
                  />
                  <Bar dataKey="total" fill="#000000" radius={[6, 6, 0, 0]} maxBarSize={36} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm ring-1 ring-gray-100 rounded-2xl">
          <CardHeader className="p-4 sm:p-6 pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm sm:text-base font-bold text-gray-900">Recent Invoices</CardTitle>
            <Link to="/bills" className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-2">
            <div className="space-y-3 sm:space-y-4">
              {(dashboardStats?.recentActivity || []).length > 0 ? (
                (dashboardStats?.recentActivity || []).map((activity: any, i: number) => (
                  <div key={i} className="flex items-center justify-between p-2.5 rounded-xl bg-gray-50/80 border border-gray-100">
                    <div className="flex items-center gap-3">
                      <div className={`h-2.5 w-2.5 rounded-full ${
                        activity.type === 'success' ? 'bg-green-500' : 
                        activity.type === 'info' ? 'bg-blue-500' : 'bg-gray-400'
                      }`} />
                      <div>
                        <p className="text-xs font-bold text-gray-900">{activity.title}</p>
                        <p className="text-[10px] text-gray-400 mt-0.5">{activity.time}</p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center text-xs text-gray-400">
                  No recent invoices yet. Create one to see activity!
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

    </div>
  );
}
