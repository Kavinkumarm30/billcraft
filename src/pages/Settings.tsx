import { auth } from "../lib/firebase";
import LoadingScreen from '../components/LoadingScreen';
import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { useAuth } from '../contexts/AuthContext';
import { Loader2 } from 'lucide-react';

const settingsSchema = z.object({
  companyName: z.string().min(1, 'Company Name is required'),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional().or(z.literal('')),
  gstNo: z.string().optional().or(z.literal('')),
  address: z.string().optional().or(z.literal('')),
  logoUrl: z.string().optional().or(z.literal('')),
  invoiceLayout: z.string().optional().or(z.literal('')),
});

type SettingsFormValues = z.infer<typeof settingsSchema>;

export default function Settings() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  const { data: settings, isLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const token = await getToken();
      const res = await fetch('/api/settings', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to fetch settings');
      const text = await res.text(); try { return JSON.parse(text); } catch(e) { return {}; }
    }
  });

  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      companyName: '',
      email: '',
      phone: '',
      gstNo: '',
      address: '',
      logoUrl: '',
      invoiceLayout: 'standard',
    }
  });

  useEffect(() => {
    if (settings) {
      form.reset({
        companyName: settings.companyName || '',
        email: settings.email || '',
        phone: settings.phone || '',
        gstNo: settings.gstNo || '',
        address: settings.address || '',
        logoUrl: settings.logoUrl || '',
        invoiceLayout: settings.invoiceLayout || 'standard',
      });
    }
  }, [settings, form]);

  const mutation = useMutation({
    mutationFn: async (values: SettingsFormValues) => {
      const token = await getToken();
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(values),
      });
      if (!res.ok) throw new Error('Failed to update settings');
      const text = await res.text(); try { return JSON.parse(text); } catch(e) { return {}; }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      toast.success('Settings updated successfully');
    },
    onError: () => {
      toast.error('Failed to update settings');
    }
  });

  const onSubmit = (values: SettingsFormValues) => {
    mutation.mutate(values);
  };

  if (isLoading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Company Settings</h1>
        <p className="text-gray-500 mt-1">Manage your organization profile and invoice templates</p>
      </div>

      <Card className="border-0 shadow-sm ring-1 ring-gray-100">
        <CardHeader className="bg-gray-50/50 border-b border-gray-100">
          <CardTitle className="text-lg">Organization Profile</CardTitle>
          <CardDescription>This information will appear on your generated invoices</CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Company Name</Label>
                <Input {...form.register('companyName')} />
                {form.formState.errors.companyName && (
                  <p className="text-xs text-red-500">{form.formState.errors.companyName.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Email Address</Label>
                <Input {...form.register('email')} />
                {form.formState.errors.email && (
                  <p className="text-xs text-red-500">{form.formState.errors.email.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Phone Number</Label>
                <Input {...form.register('phone')} />
              </div>
              <div className="space-y-2">
                <Label>GST / Tax Number</Label>
                <Input {...form.register('gstNo')} />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Address</Label>
                <Input {...form.register('address')} />
              </div>
              <div className="space-y-2">
                <Label>Invoice Layout</Label>
                
<div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mt-2">
                  {[
                    { id: 'standard', name: 'Standard', desc: 'Logo Left' },
                    { id: 'modern', name: 'Modern', desc: 'Logo Right' },
                    { id: 'minimal', name: 'Minimal', desc: 'Centered' },
                    { id: 'professional', name: 'Professional', desc: 'Boxed' },
                    { id: 'bold', name: 'Bold', desc: 'Dark Accent' },
                    { id: 'elegant', name: 'Elegant', desc: 'Serif & Soft' },
                    { id: 'tech', name: 'Tech', desc: 'Monospace' },
                    { id: 'corporate', name: 'Corporate', desc: 'Solid Header' },
                    { id: 'playful', name: 'Playful', desc: 'Rounded' },
                    { id: 'orange-classic', name: 'Orange Classic', desc: 'Custom template' },
                    { id: 'classic', name: 'Classic', desc: 'Traditional' },
                  ].map((layout) => (
                    <label
                      key={layout.id}
                      className={`relative flex flex-col items-center gap-2 p-3 border rounded-xl cursor-pointer transition-all hover:bg-gray-50 ${form.watch('invoiceLayout') === layout.id ? 'border-black bg-gray-50 ring-1 ring-black' : 'border-gray-200'}`}
                    >
                      <input
                        type="radio"
                        value={layout.id}
                        {...form.register('invoiceLayout')}
                        className="sr-only"
                      />
                      {/* Wireframe Preview */}
                      <div className="w-full aspect-[1/1.4] bg-white border border-gray-200 shadow-sm rounded flex flex-col overflow-hidden">
                        {/* Header Area */}
                        <div className={`w-full p-1.5 flex ${
                          layout.id === 'minimal' ? 'flex-col items-center border-b border-gray-100 gap-1' :
                          layout.id === 'modern' ? 'flex-row-reverse justify-between border-b border-gray-100' :
                          layout.id === 'professional' ? 'justify-between bg-gray-100 m-1 rounded-sm border border-gray-200' :
                          layout.id === 'bold' ? 'justify-between bg-black m-1 rounded-sm' :
                          layout.id === 'elegant' ? 'justify-between border-b-2 border-double border-gray-300' :
                          layout.id === 'tech' ? 'justify-between border-b border-blue-200 bg-white' :
                          layout.id === 'corporate' ? 'justify-between bg-slate-700' :
                          layout.id === 'playful' ? 'justify-between border-b-2 border-dashed border-amber-200 bg-amber-50/50' :
                          layout.id === 'classic' ? 'items-end justify-between border-b border-gray-300' :
                          'justify-between border-b border-gray-100'
                        }`}>
                          <div className={`flex gap-1 items-center ${
                            layout.id === 'minimal' ? 'flex-col' : 
                            layout.id === 'modern' ? 'flex-row-reverse' : ''
                          }`}>
                            <div className={`w-3 h-3 ${
                              layout.id === 'bold' ? 'bg-white' : 
                              layout.id === 'tech' ? 'bg-blue-500' : 
                              layout.id === 'playful' ? 'bg-amber-400 rounded-full' : 
                              layout.id === 'elegant' ? 'bg-stone-700 rounded-full' : 
                              layout.id === 'corporate' ? 'bg-white' : 
                              'bg-gray-800 rounded-sm'
                            }`}></div>
                            <div className="flex flex-col gap-0.5">
                              <div className={`h-1 w-6 ${
                                layout.id === 'bold' ? 'bg-white' : 
                                layout.id === 'corporate' ? 'bg-white' : 
                                'bg-gray-800'
                              }`}></div>
                              <div className={`h-0.5 w-4 ${
                                layout.id === 'bold' ? 'bg-gray-400' : 
                                layout.id === 'corporate' ? 'bg-slate-400' : 
                                'bg-gray-300'
                              }`}></div>
                            </div>
                          </div>
                          
                          <div className={`flex flex-col gap-0.5 ${layout.id === 'minimal' ? 'items-center' : layout.id === 'modern' ? 'items-start' : 'items-end'}`}>
                            <div className={`h-1 w-5 ${
                               layout.id === 'bold' ? 'bg-gray-500' : 
                               layout.id === 'corporate' ? 'bg-slate-500' : 
                               'bg-gray-200'
                            }`}></div>
                            <div className={`h-0.5 w-8 ${
                               layout.id === 'bold' ? 'bg-white' : 
                               layout.id === 'corporate' ? 'bg-white' : 
                               'bg-gray-800'
                            }`}></div>
                          </div>
                        </div>

                        {/* Body Area */}
                        <div className="flex-1 p-1.5 flex flex-col gap-1.5">
                           <div className="h-0.5 w-8 bg-gray-200"></div>
                           <div className="flex flex-col gap-0.5 border-b border-gray-100 pb-1">
                             <div className="flex justify-between">
                                <div className="h-0.5 w-12 bg-gray-300"></div>
                                <div className="h-0.5 w-3 bg-gray-300"></div>
                             </div>
                             <div className="flex justify-between">
                                <div className="h-0.5 w-10 bg-gray-200"></div>
                                <div className="h-0.5 w-4 bg-gray-200"></div>
                             </div>
                             <div className="flex justify-between">
                                <div className="h-0.5 w-14 bg-gray-200"></div>
                                <div className="h-0.5 w-4 bg-gray-200"></div>
                             </div>
                           </div>
                           <div className="mt-auto flex justify-end">
                              <div className="h-1 w-10 bg-gray-800"></div>
                           </div>
                        </div>
                      </div>

                      <div className="text-center mt-1">
                        <div className="text-xs font-semibold text-gray-900">{layout.name}</div>
                        <div className="text-[10px] text-gray-500 leading-tight">{layout.desc}</div>
                      </div>
                    </label>
                  ))}
                </div>
                
                <div className="mt-6 p-4 rounded-xl border border-gray-200 bg-gray-50 flex flex-col sm:flex-row items-start gap-4">
                  <div className="mt-0.5 text-blue-600 shrink-0">
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="flex-1 w-full">
                    <h4 className="text-sm font-medium text-gray-900">Have a custom bill layout?</h4>
                    <p className="text-sm text-gray-500 mt-1 mb-3">
                      Upload your design, and our team will review it and grant you access.
                    </p>
                    {settings?.hasCustomLayoutAccess ? (
                      <div className="text-sm text-green-700 font-medium bg-green-50 p-2 rounded border border-green-200">
                        You have been granted access to the custom layout! Please contact support to provide the final HTML template.
                      </div>
                    ) : (
                      <div className="flex flex-col sm:flex-row gap-2 w-full">
                        <Input type="file" accept="image/*,.pdf" className="bg-white text-sm w-full sm:max-w-sm" id="custom-layout-file" />
                        <button type="button" className="px-4 py-2 shrink-0 bg-black text-white text-sm font-medium rounded-md hover:bg-gray-800 transition-colors" onClick={async (e) => {
                          e.preventDefault();
                          const fileInput = document.getElementById('custom-layout-file') as HTMLInputElement;
                          const file = fileInput.files?.[0];
                          if (!file) {
                            alert("Please select a file first");
                            return;
                          }
                          const reader = new FileReader();
                          reader.onloadend = async () => {
                            try {
                              const res = await fetch('/api/custom-layouts', {
                                method: 'POST',
                                headers: {
                                  'Content-Type': 'application/json',
                                  'Authorization': `Bearer ${await auth.currentUser?.getIdToken()}`
                                },
                                body: JSON.stringify({ fileUrl: reader.result })
                              });
                              if (!res.ok) throw new Error(await res.text());
                              alert("Custom layout request submitted successfully!");
                              fileInput.value = '';
                            } catch (err: any) {
                              alert("Error submitting request: " + err.message);
                            }
                          };
                          reader.readAsDataURL(file);
                        }}>
                          Upload
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Company Logo</Label>
                <Input 
                  type="file" 
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        form.setValue('logoUrl', reader.result as string);
                      };
                      reader.readAsDataURL(file);
                    }
                  }} 
                />
                {form.watch('logoUrl') && (
                  <div className="mt-2 h-16 w-16 relative border rounded overflow-hidden">
                    <img src={form.watch('logoUrl')} alt="Logo preview" className="object-contain w-full h-full" />
                  </div>
                )}
              </div>
            </div>
            
            <div className="pt-4 flex justify-end border-t border-gray-100">
              <Button type="submit" disabled={mutation.isPending} className="bg-black hover:bg-gray-800">
                {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
