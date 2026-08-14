import React from 'react';
import { numberToWords } from '../lib/numberToWords';
import { MapPin, Phone, CheckCircle } from 'lucide-react';

export const CustomMonishaLayout = ({ data, settings }: { data: any, settings: any }) => {
  return (
    <div className="bg-white p-0 m-0 w-full relative min-h-[1131px] font-serif border-[3px] border-[#e25704] text-black">
      {/* Header */}
      <div className="flex justify-between items-center px-6 py-4">
        <div className="flex items-center gap-6">
          <div className="flex">
            <svg width="60" height="60" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M50 10 L20 80 L35 80 L50 40 L65 80 L80 80 Z" fill="#000000" />
              <path d="M35 10 L5 80 L20 80 L35 40 L50 80 L65 80 Z" fill="#e25704" opacity="0.9" />
            </svg>
          </div>
          <h1 className="text-[2.5rem] font-bold tracking-wide">
            <span className="text-[#e25704]">Monisha</span> <span className="text-black">Interiors</span>
          </h1>
        </div>
        <h2 className="text-[2.5rem] italic font-black text-red-600 tracking-wider m-0 p-0 leading-none">INVOICE</h2>
      </div>

      {/* Billed To & Invoice Info */}
      <div className="flex border-y-[3px] border-[#e25704]">
        <div className="w-1/2 p-2 px-4 border-r-[3px] border-[#e25704] text-sm">
          <p className="font-bold">Bill To : <span className="font-normal">{data.customerName || ''}</span></p>
          <p className="font-bold">Name &nbsp;&nbsp;&nbsp;&nbsp;: <span className="font-normal">{data.customerName || ''}</span></p>
          <p className="font-bold">Address : <span className="font-normal">{data.address || ''}</span></p>
        </div>
        <div className="w-1/2 p-2 px-4 text-sm font-bold">
          <p>Invoice No: {data.invoiceNumber || Date.now().toString().slice(-6)}</p>
          <p>Date - {(data.date && data.date.includes('T') ? data.date.split('T')[0] : data.date) || new Date().toISOString().split('T')[0]}</p>
          <p>Phone : {data.phone || ''}</p>
        </div>
      </div>

      {/* Table Header Strip */}
      <div className="bg-black text-white text-center font-bold py-1.5 tracking-wider text-base">
        QUOTATION - UPVC
      </div>

      {/* Items Table */}
      <table className="w-full text-center border-collapse text-sm border-b-[3px] border-[#e25704]">
        <thead>
          <tr className="bg-[#e25704] text-black font-bold">
            <th className="border-r border-orange-300 py-1.5 px-2 w-[8%]">S.No</th>
            <th className="border-r border-orange-300 py-1.5 px-2 w-[45%] text-left">Description</th>
            <th className="border-r border-orange-300 py-1.5 px-2 w-[15%]">Sqft/-</th>
            <th className="border-r border-orange-300 py-1.5 px-2 w-[15%]">Rate</th>
            <th className="py-1.5 px-2 w-[17%]">Amount</th>
          </tr>
        </thead>
        <tbody>
          {data.items?.map((item: any, i: number) => (
            <tr key={i} className="border-b border-gray-200 last:border-0">
              <td className="border-r border-gray-200 py-1 px-2">{i + 1}</td>
              <td className="border-r border-gray-200 py-1 px-2 text-left">{item.description}</td>
              <td className="border-r border-gray-200 py-1 px-2">{item.quantity}</td>
              <td className="border-r border-gray-200 py-1 px-2">{item.rate}</td>
              <td className="py-1 px-2">{item.amount}</td>
            </tr>
          ))}
          {/* Total Row */}
          <tr className="bg-[#e25704] text-white font-bold text-base">
            <td colSpan={2} className="text-center py-1.5 px-4 border-r border-orange-300">Total</td>
            <td className="border-r border-orange-300 py-1.5 px-2">{data.items?.reduce((s: number, i: any) => s + (Number(i.quantity) || 0), 0) || ''}</td>
            <td className="border-r border-orange-300 py-1.5 px-2"></td>
            <td className="py-1.5 px-2">{data.subtotal || 0}</td>
          </tr>
        </tbody>
      </table>

      {/* Footer Totals Split */}
      <div className="flex border-b-[3px] border-[#e25704]">
        <div className="w-[60%] border-r-[3px] border-[#e25704] flex flex-col justify-between">
          <div>
            <p className="font-bold text-sm border-b border-gray-300 px-2 py-1">Total Amount in words</p>
            <p className="font-bold text-sm uppercase px-2 pt-1">{numberToWords(data.grandTotal || 0)} RUPEES ONLY.</p>
          </div>
        </div>
        <div className="w-[40%]">
          <table className="w-full text-sm font-bold">
            <tbody>
              <tr className="border-b border-gray-300">
                <td className="border-r border-gray-300 p-1 px-2 w-1/2">Subtotal</td>
                <td className="p-1 px-2 text-center w-1/2">{data.subtotal || 0}</td>
              </tr>
              <tr className="border-b border-gray-300">
                <td className="border-r border-gray-300 p-1 px-2">Discount</td>
                <td className="p-1 px-2 text-center">{data.discount || 0}</td>
              </tr>
              <tr className="border-b border-gray-300">
                <td className="border-r border-gray-300 p-1 px-2">Tax</td>
                <td className="p-1 px-2 text-center">{data.taxAmount || 0}</td>
              </tr>
              <tr className="border-b border-[#e25704]">
                <td className="border-r border-[#e25704] p-1 px-2">Total</td>
                <td className="p-1 px-2 text-center">{data.grandTotal || 0}</td>
              </tr>
              <tr className="border-b border-[#e25704]">
                <td className="border-r border-[#e25704] p-1 px-2">Amount Paid</td>
                <td className="p-1 px-2 text-center">0</td>
              </tr>
              <tr>
                <td className="border-r border-[#e25704] p-1 px-2 text-red-600">Balance Due</td>
                <td className="p-1 px-2 text-center text-red-600">{data.grandTotal || 0}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Signatures */}
      <div className="flex justify-between items-end px-6 pt-16 pb-4">
        <div className="text-blue-700 font-bold text-lg">
          Supervisor - Mr.Suresh- Ph - 7448537771
        </div>
        <div className="text-center text-lg font-bold">
          <p>For Monisha Interiors Works</p>
          <p className="mt-8">Authorized Signature</p>
        </div>
      </div>

      {/* Absolute positioned bottom section */}
      <div className="absolute bottom-0 left-0 w-full">
        {/* Contact Info */}
        <div className="border-t-[3px] border-[#e25704] flex justify-between p-2 pb-1 text-sm text-red-600 font-bold items-center bg-white">
          <div className="flex flex-col items-center w-1/3">
            <div className="text-blue-500 mb-1"><MapPin size={24} /></div>
            <p className="text-center leading-tight">No.34/23, Periyar Street, Paadikuppm, Ambathur<br/>Koyambedu, Chennai, Tamilnadu 600107, India</p>
          </div>
          <div className="flex flex-col items-center w-1/3">
            <div className="text-green-500 mb-1"><Phone size={24} /></div>
            <p className="text-center leading-tight">P.Madhaiyan . 9443348032 ,<br/>9788537772.</p>
          </div>
          <div className="flex flex-col items-center w-1/3">
            <div className="text-red-500 mb-1 text-2xl">GST</div>
            <p className="text-center">33C0TPM8193P2ZQ</p>
          </div>
        </div>

        {/* Payment Method */}
        <div className="bg-[#e25704] text-white text-center font-bold py-0.5 text-sm uppercase tracking-wider">
          Payment Method - 60% Advance
        </div>

        {/* Our Branches */}
        <div className="text-blue-700 font-bold text-center text-sm py-0.5 border-b-[3px] border-[#e25704] bg-white">
          Our Branches
        </div>

        {/* Branches List */}
        <div className="flex text-blue-700 font-bold text-[13px] text-center border-b-[3px] border-[#e25704] bg-white">
          <div className="w-[8%] flex items-center justify-center border-r-[3px] border-[#e25704]">
            <MapPin size={20} />
          </div>
          <div className="w-[18.4%] border-r-[3px] border-[#e25704] p-0.5">Chennai<br/>9443348032</div>
          <div className="w-[18.4%] border-r-[3px] border-[#e25704] p-0.5">Hosur<br/>9788537772</div>
          <div className="w-[18.4%] border-r-[3px] border-[#e25704] p-0.5">Bangalore<br/>9788537772</div>
          <div className="w-[18.4%] border-r-[3px] border-[#e25704] p-0.5">Tiruchirapalli<br/>7448537772</div>
          <div className="w-[18.4%] p-0.5">Vellore<br/>7448537775</div>
        </div>

        {/* Footer message */}
        <div className="text-blue-700 font-bold text-center text-sm py-1 bg-white">
          Get in Touch With Us, We'd Love to Hear From You!
        </div>
      </div>
    </div>
  );
};
