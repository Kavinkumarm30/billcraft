import React from 'react';
import { numberToWords } from '../lib/numberToWords';
import { MapPin, Phone } from 'lucide-react';

interface CustomMonishaLayoutProps {
  data: any;
  settings?: any;
}

export const CustomMonishaLayout: React.FC<CustomMonishaLayoutProps> = ({ data, settings }) => {
  if (!data) return null;

  // Calculate totals
  const items = Array.isArray(data.items) ? data.items : [];
  const totalSqft = items.reduce((sum: number, it: any) => sum + (parseFloat(it.quantity || 0) || 0), 0);
  const subtotal = Number(data.subtotal || items.reduce((sum: number, it: any) => sum + (parseFloat(it.amount || 0) || 0), 0));
  const discount = Number(data.discount || 0);
  const taxAmount = Number(data.taxAmount || 0);
  const grandTotal = Number(data.grandTotal || (subtotal + taxAmount - discount));
  const amountPaid = data.status === 'PAID' ? grandTotal : Number(data.amountPaid || 0);
  const balanceDue = Math.max(0, grandTotal - amountPaid);

  // Format date as DD-MM-YYYY if possible
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return new Date().toLocaleDateString('en-GB').replace(/\//g, '-');
    const clean = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr;
    const parts = clean.split('-');
    if (parts.length === 3) {
      return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
    return clean;
  };

  const words = numberToWords(grandTotal);

  return (
    <div className="bg-white p-0 m-0 w-full relative min-h-[1130px] font-sans border-[3px] border-[#e25704] text-black shadow-sm flex flex-col justify-between select-text">
      <div>
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4">
          <div className="flex items-center gap-4">
            {/* Monisha Geometric M Logo */}
            <div className="flex shrink-0">
              <svg width="68" height="68" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                {/* Left Black Triangle */}
                <path d="M48 8 L18 82 L34 82 L48 44 L62 82 L78 82 Z" fill="#000000" />
                {/* Right Overlapping Orange Triangle */}
                <path d="M34 8 L4 82 L20 82 L34 44 L48 82 L64 82 Z" fill="#e25704" opacity="0.95" />
              </svg>
            </div>
            <div>
              <h1 className="text-[2.6rem] font-black tracking-tight leading-none">
                <span className="text-[#e25704]">Monisha</span> <span className="text-black">Interiors</span>
              </h1>
            </div>
          </div>
          <div className="text-right">
            <h2 className="text-[2.8rem] italic font-black text-red-600 tracking-wider m-0 p-0 leading-none">
              INVOICE
            </h2>
          </div>
        </div>

        {/* Billed To & Invoice Info */}
        <div className="flex border-y-[3px] border-[#e25704]">
          <div className="w-1/2 p-2.5 px-4 border-r-[3px] border-[#e25704] text-sm leading-snug">
            <p className="font-bold text-gray-900">
              Bill To : <span className="font-normal">{data.customerName ? 'Customer' : 'Customer'}</span>
            </p>
            <p className="font-bold text-gray-900 mt-0.5">
              Name &nbsp;&nbsp;&nbsp;&nbsp;: <span className="font-semibold text-gray-800">{data.customerName || ''}</span>
            </p>
            <p className="font-bold text-gray-900 mt-0.5">
              Address : <span className="font-normal text-gray-700">{data.address || 'Rayapuram, Chennai.'}</span>
            </p>
          </div>
          <div className="w-1/2 p-2.5 px-4 text-sm font-bold text-gray-900 leading-snug">
            <p>Invoice No: {data.invoiceNumber || 'CH - 103'}</p>
            <p className="mt-0.5">Date - {formatDate(data.date)}</p>
            <p className="mt-0.5">Phone : {data.phone || '9740223462'}</p>
          </div>
        </div>

        {/* Table Header Strip */}
        <div className="bg-black text-white text-center font-bold py-1.5 tracking-wider text-base uppercase">
          QUOTATION - UPVC
        </div>

        {/* Items Table */}
        <table className="w-full text-center border-collapse text-sm border-b-[3px] border-[#e25704]">
          <thead>
            <tr className="bg-[#e25704] text-black font-extrabold text-sm">
              <th className="border-r border-orange-400 py-1.5 px-2 w-[8%]">S.No</th>
              <th className="border-r border-orange-400 py-1.5 px-3 w-[46%] text-left">Description</th>
              <th className="border-r border-orange-400 py-1.5 px-2 w-[15%]">Sqft/-</th>
              <th className="border-r border-orange-400 py-1.5 px-2 w-[15%]">Rate</th>
              <th className="py-1.5 px-2 w-[16%]">Amount</th>
            </tr>
          </thead>
          <tbody>
            {items.length > 0 ? (
              items.map((item: any, i: number) => (
                <tr key={i} className="border-b border-gray-300 font-medium text-gray-900">
                  <td className="border-r border-gray-300 py-1.5 px-2 text-center">{i + 1}</td>
                  <td className="border-r border-gray-300 py-1.5 px-3 text-left">{item.description}</td>
                  <td className="border-r border-gray-300 py-1.5 px-2 text-center">{item.quantity || ''}</td>
                  <td className="border-r border-gray-300 py-1.5 px-2 text-center">{item.rate || ''}</td>
                  <td className="py-1.5 px-2 text-center font-semibold">{item.amount || ''}</td>
                </tr>
              ))
            ) : (
              <tr className="border-b border-gray-300">
                <td className="border-r border-gray-300 py-2 px-2 text-center">1</td>
                <td className="border-r border-gray-300 py-2 px-3 text-left">Interior UPVC Work</td>
                <td className="border-r border-gray-300 py-2 px-2 text-center">1</td>
                <td className="border-r border-gray-300 py-2 px-2 text-center">{grandTotal}</td>
                <td className="py-2 px-2 text-center font-semibold">{grandTotal}</td>
              </tr>
            )}

            {/* Total Row */}
            <tr className="bg-[#e25704] text-white font-black text-sm">
              <td colSpan={2} className="text-center py-1.5 px-4 border-r border-orange-400">Total</td>
              <td className="border-r border-orange-400 py-1.5 px-2 text-center">{totalSqft || ''}</td>
              <td className="border-r border-orange-400 py-1.5 px-2"></td>
              <td className="py-1.5 px-2 text-center">{subtotal || grandTotal}</td>
            </tr>
          </tbody>
        </table>

        {/* Footer Totals Split */}
        <div className="flex border-b-[3px] border-[#e25704]">
          {/* Left Box: Amount in words */}
          <div className="w-[60%] border-r-[3px] border-[#e25704] flex flex-col justify-between p-0">
            <div>
              <p className="font-bold text-sm border-b border-gray-300 px-3 py-1.5 text-gray-900">
                Total Amount in words
              </p>
              <p className="font-black text-xs uppercase px-3 pt-2.5 text-gray-900 leading-relaxed">
                {words} RUPEES ONLY.
              </p>
            </div>
          </div>

          {/* Right Box: Subtotal, Discount, Tax, Total, Paid, Balance Due */}
          <div className="w-[40%]">
            <table className="w-full text-sm font-bold border-collapse">
              <tbody>
                <tr className="border-b border-gray-300">
                  <td className="border-r border-gray-300 p-1 px-3 w-1/2 text-gray-800">Subtotal</td>
                  <td className="p-1 px-3 text-center w-1/2 text-gray-900">{subtotal}</td>
                </tr>
                <tr className="border-b border-gray-300">
                  <td className="border-r border-gray-300 p-1 px-3 text-gray-800">Discount</td>
                  <td className="p-1 px-3 text-center text-gray-900">{discount}</td>
                </tr>
                <tr className="border-b border-gray-300">
                  <td className="border-r border-gray-300 p-1 px-3 text-gray-800">Tax</td>
                  <td className="p-1 px-3 text-center text-gray-900">{taxAmount}</td>
                </tr>
                <tr className="border-b border-[#e25704]">
                  <td className="border-r border-[#e25704] p-1 px-3 text-gray-900">Total</td>
                  <td className="p-1 px-3 text-center text-gray-900">{grandTotal}</td>
                </tr>
                <tr className="border-b border-[#e25704]">
                  <td className="border-r border-[#e25704] p-1 px-3 text-gray-900">Amount Paid</td>
                  <td className="p-1 px-3 text-center text-gray-900">{amountPaid}</td>
                </tr>
                <tr>
                  <td className="border-r border-[#e25704] p-1 px-3 text-red-600 font-extrabold">Balance Due</td>
                  <td className="p-1 px-3 text-center text-red-600 font-extrabold">{balanceDue}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Signatures */}
        <div className="flex justify-between items-end px-6 pt-12 pb-4">
          <div className="text-blue-700 font-bold text-base">
            Supervisor - Mr.Suresh- Ph - 7448537771
          </div>
          <div className="text-center text-sm font-bold text-gray-900">
            <p>For Monisha Interiors Works</p>
            <p className="mt-8">Authorized Signature</p>
          </div>
        </div>
      </div>

      {/* Bottom Fixed Footer Section */}
      <div className="w-full mt-auto">
        {/* Contact Info (3 Columns) */}
        <div className="border-t-[3px] border-[#e25704] flex justify-between p-2 pb-2 text-xs text-red-600 font-bold items-center bg-white">
          {/* Address */}
          <div className="flex flex-col items-center w-1/3 text-center px-1">
            <div className="text-blue-500 mb-0.5">
              <MapPin size={22} />
            </div>
            <p className="leading-tight text-[11px]">
              No.34/23, Periyar Street, Paadikuppm, Ambathur<br />
              Koyambedu, Chennai, Tamilnadu 600107, India
            </p>
          </div>

          {/* Phone */}
          <div className="flex flex-col items-center w-1/3 text-center px-1">
            <div className="text-green-600 mb-0.5">
              <Phone size={22} />
            </div>
            <p className="leading-tight text-[11px]">
              P.Madhaiyan . 9443348032 ,<br />
              9788537772.
            </p>
          </div>

          {/* GST */}
          <div className="flex flex-col items-center w-1/3 text-center px-1">
            <div className="w-8 h-8 rounded-full border-2 border-red-500 flex items-center justify-center text-[10px] font-black text-red-600 mb-0.5">
              GST
            </div>
            <p className="text-[11px] font-black tracking-wider text-red-700">
              33C0TPM8193P2ZQ
            </p>
          </div>
        </div>

        {/* Payment Method */}
        <div className="bg-[#e25704] text-white text-center font-bold py-0.5 text-xs uppercase tracking-wider">
          Payment Method - 60% Advance
        </div>

        {/* Our Branches Header */}
        <div className="text-blue-700 font-black text-center text-xs py-0.5 border-b-[2.5px] border-[#e25704] bg-white">
          Our Branches
        </div>

        {/* Branches 5-Box Grid */}
        <div className="flex text-blue-700 font-bold text-[11px] text-center border-b-[2.5px] border-[#e25704] bg-white">
          <div className="w-[8%] flex items-center justify-center border-r-[2.5px] border-[#e25704] p-1">
            <MapPin size={18} className="text-blue-600" />
          </div>
          <div className="w-[18.4%] border-r-[2.5px] border-[#e25704] py-1 px-0.5 leading-tight">
            Chennai<br /><span className="text-[10px] font-semibold">9443348032</span>
          </div>
          <div className="w-[18.4%] border-r-[2.5px] border-[#e25704] py-1 px-0.5 leading-tight">
            Hosur<br /><span className="text-[10px] font-semibold">9788537772</span>
          </div>
          <div className="w-[18.4%] border-r-[2.5px] border-[#e25704] py-1 px-0.5 leading-tight">
            Bangalore<br /><span className="text-[10px] font-semibold">9788537772</span>
          </div>
          <div className="w-[18.4%] border-r-[2.5px] border-[#e25704] py-1 px-0.5 leading-tight">
            Tiruchirapalli<br /><span className="text-[10px] font-semibold">7448537772</span>
          </div>
          <div className="w-[18.4%] py-1 px-0.5 leading-tight">
            Vellore<br /><span className="text-[10px] font-semibold">7448537775</span>
          </div>
        </div>

        {/* Footer Catchphrase */}
        <div className="text-blue-700 font-bold text-center text-xs py-1 bg-white">
          Get in Touch With Us, We'd Love to Hear From You!
        </div>

        {/* Page Number */}
        <div className="text-center text-[10px] text-gray-500 py-1 bg-white">
          Page 1
        </div>
      </div>
    </div>
  );
};

export default CustomMonishaLayout;
