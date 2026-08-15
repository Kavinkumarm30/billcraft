import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent, CardHeader } from '../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Search, Loader2, Users, Phone, MapPin, Mail } from 'lucide-react';
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
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <Users className="w-6 h-6 text-gray-700" /> Customers
          </h1>
          <p className="text-gray-500 mt-1">Manage and search your studio customer directory</p>
        </div>
      </div>

      <Card className="border-0 shadow-sm ring-1 ring-gray-100 bg-white/90 backdrop-blur">
        <CardHeader className="py-4 border-b border-gray-100">
          <div className="relative max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
            <Input 
              type="search" 
              placeholder="Search by customer name..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 bg-gray-50/50" 
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-12 flex justify-center items-center gap-2 text-gray-500">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span>Loading customer records...</span>
            </div>
          ) : (
            <Table>
              <TableHeader className="bg-gray-50/80">
                <TableRow>
                  <TableHead>Customer Name</TableHead>
                  <TableHead>Phone / Contact</TableHead>
                  <TableHead>Address</TableHead>
                  <TableHead>GST / Tax No</TableHead>
                  <TableHead>Joined Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customerList && customerList.length > 0 ? (
                  customerList.map((c: any) => (
                    <TableRow key={c.id} className="hover:bg-gray-50/50">
                      <TableCell className="font-semibold text-gray-900">{c.name}</TableCell>
                      <TableCell>
                        {c.phone ? (
                          <span className="flex items-center gap-1 text-xs text-gray-700">
                            <Phone className="w-3 h-3 text-gray-400" /> {c.phone}
                          </span>
                        ) : (
                          <span className="text-gray-400 text-xs">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {c.address ? (
                          <span className="flex items-center gap-1 text-xs text-gray-600 max-w-xs truncate">
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
                  ))
                ) : (
                  <TableRow>
                    <td colSpan={5} className="py-12 text-center text-gray-500">
                      {searchTerm ? 'No customers match your search.' : 'No customers recorded yet. Invoices you create will automatically build your customer directory.'}
                    </td>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

