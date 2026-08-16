import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent, CardHeader } from '../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Search, Loader2, Users, Phone, MapPin, Calendar, Building, MessageCircle } from 'lucide-react';
import { Input } from '../components/ui/input';

export default function Customers() {
  const { getToken } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');

  const { data: customerList, isLoading } = useQuery({
    queryKey: ['customers', searchTerm],
    queryFn: async () => {
      const token = await getToken();
      const url = searchTerm 
        ? `/api/customers?search=${encodeURIComponent(searchTerm)}`
        : '/api/customers';
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to fetch customers');
      return res.json();
    }
  });

  return (
    <div className="p-3 sm:p-6 lg:p-8 space-y-4 sm:space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-black text-white flex items-center justify-center font-bold">
              <Users className="w-4 h-4" />
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
              Customer Directory
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Search and manage your studio clients and billing directory
          </p>
        </div>

        {customerList && (
          <span className="inline-flex items-center gap-1 text-xs font-bold px-3 py-1 bg-gray-100 text-gray-800 rounded-full">
            <Users className="w-3.5 h-3.5" />
            {customerList.length} {customerList.length === 1 ? 'Client' : 'Clients'}
          </span>
        )}
      </div>

      <Card className="border-0 shadow-sm ring-1 ring-gray-100 bg-white/95 backdrop-blur rounded-2xl overflow-hidden">
        {/* Search Bar */}
        <CardHeader className="p-3 sm:p-4 border-b border-gray-100">
          <div className="relative w-full sm:max-w-md">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <Input 
              type="search" 
              placeholder="Search by customer name or phone..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-10 text-xs sm:text-sm bg-gray-50/70 border-gray-200 rounded-xl" 
            />
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-12 flex flex-col justify-center items-center gap-3 text-gray-500">
              <Loader2 className="h-6 w-6 animate-spin text-black" />
              <span className="text-xs font-medium">Loading customer directory...</span>
            </div>
          ) : !customerList || customerList.length === 0 ? (
            <div className="p-8 sm:p-12 text-center">
              <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto text-gray-400 mb-3">
                <Users className="w-6 h-6" />
              </div>
              <p className="text-sm font-bold text-gray-800">
                {searchTerm ? 'No clients found' : 'No clients recorded yet'}
              </p>
              <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
                {searchTerm 
                  ? 'Try searching with a different name or phone number.' 
                  : 'Clients are automatically saved whenever you generate or scan an invoice.'}
              </p>
            </div>
          ) : (
            <>
              {/* ========================================================================= */}
              {/* 1. MOBILE RESPONSIVE CARDS VIEW (Visible on mobile screens < 768px)       */}
              {/* ========================================================================= */}
              <div className="block md:hidden divide-y divide-gray-100">
                {customerList.map((c: any) => {
                  const initial = (c.name || 'C').charAt(0).toUpperCase();
                  return (
                    <div key={c.id} className="p-4 space-y-3 hover:bg-gray-50/50 transition-colors">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded-full bg-black text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-xs">
                            {initial}
                          </div>
                          <div>
                            <h3 className="text-sm font-bold text-gray-900 leading-tight">
                              {c.name}
                            </h3>
                            {c.createdAt && (
                              <span className="flex items-center gap-1 text-[11px] text-gray-400 mt-0.5">
                                <Calendar className="w-3 h-3" /> Joined {new Date(c.createdAt).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        </div>

                        {c.gstNo && (
                          <span className="text-[10px] font-mono font-bold px-2 py-0.5 bg-amber-50 text-amber-800 border border-amber-200 rounded-md shrink-0">
                            GST: {c.gstNo}
                          </span>
                        )}
                      </div>

                      {/* Contact Info & Links */}
                      <div className="space-y-1.5 pt-1 text-xs">
                        {c.phone && (
                          <div className="flex items-center justify-between text-gray-700 bg-gray-50 p-2 rounded-lg">
                            <span className="flex items-center gap-1.5 font-medium">
                              <Phone className="w-3.5 h-3.5 text-gray-500" /> {c.phone}
                            </span>
                            <div className="flex items-center gap-1.5">
                              <a 
                                href={`tel:${c.phone}`}
                                className="px-2 py-1 bg-white border border-gray-200 text-gray-900 rounded font-bold text-[11px] shadow-2xs active:scale-95"
                              >
                                Call
                              </a>
                              <a 
                                href={`https://wa.me/${c.phone.replace(/[^0-9]/g, '')}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-2 py-1 bg-emerald-600 text-white rounded font-bold text-[11px] shadow-2xs flex items-center gap-1 active:scale-95"
                              >
                                <MessageCircle className="w-3 h-3" /> WhatsApp
                              </a>
                            </div>
                          </div>
                        )}

                        {c.address && (
                          <div className="flex items-start gap-1.5 text-gray-600 px-1">
                            <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0 mt-0.5" />
                            <span className="text-xs leading-relaxed">{c.address}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* ========================================================================= */}
              {/* 2. DESKTOP STRUCTURED TABLE (Visible on tablets & desktops >= 768px)       */}
              {/* ========================================================================= */}
              <div className="hidden md:block overflow-x-auto">
                <Table>
                  <TableHeader className="bg-gray-50/80">
                    <TableRow>
                      <TableHead className="font-bold text-gray-700">Customer Name</TableHead>
                      <TableHead className="font-bold text-gray-700">Phone / Contact</TableHead>
                      <TableHead className="font-bold text-gray-700">Address</TableHead>
                      <TableHead className="font-bold text-gray-700">GST / Tax No</TableHead>
                      <TableHead className="font-bold text-gray-700">Joined Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {customerList.map((c: any) => {
                      const initial = (c.name || 'C').charAt(0).toUpperCase();
                      return (
                        <TableRow key={c.id} className="hover:bg-gray-50/50">
                          <TableCell className="font-semibold text-gray-900">
                            <div className="flex items-center gap-2.5">
                              <div className="w-7 h-7 rounded-full bg-black text-white font-bold text-xs flex items-center justify-center shrink-0">
                                {initial}
                              </div>
                              <span>{c.name}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            {c.phone ? (
                              <div className="flex items-center gap-2">
                                <span className="flex items-center gap-1 text-xs text-gray-700">
                                  <Phone className="w-3 h-3 text-gray-400" /> {c.phone}
                                </span>
                                <a 
                                  href={`https://wa.me/${c.phone.replace(/[^0-9]/g, '')}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded hover:bg-emerald-100"
                                >
                                  WhatsApp
                                </a>
                              </div>
                            ) : (
                              <span className="text-gray-400 text-xs">—</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {c.address ? (
                              <span className="flex items-center gap-1 text-xs text-gray-600 max-w-xs truncate" title={c.address}>
                                <MapPin className="w-3 h-3 text-gray-400 shrink-0" /> {c.address}
                              </span>
                            ) : (
                              <span className="text-gray-400 text-xs">—</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {c.gstNo ? (
                              <span className="text-xs font-mono font-medium px-2 py-0.5 bg-gray-100 rounded">
                                {c.gstNo}
                              </span>
                            ) : (
                              <span className="text-gray-400 text-xs">—</span>
                            )}
                          </TableCell>
                          <TableCell className="text-xs text-gray-500">
                            {c.createdAt ? new Date(c.createdAt).toLocaleDateString() : '—'}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
