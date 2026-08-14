import React from 'react';
import { Logo } from './Logo';

export default function LoadingScreen({ message = "Loading..." }: { message?: string }) {
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-gradient-to-r from-[#9b9b9b] to-[#f5f5f5]">
      <div className="relative animate-pulse">
        <Logo className="h-24 w-auto mb-8 grayscale" />
      </div>
      <div className="flex items-center gap-3 text-gray-500 font-medium">
        <div className="h-4 w-4 rounded-full border-2 border-black border-t-transparent animate-spin"></div>
        {message}
      </div>
    </div>
  );
}
