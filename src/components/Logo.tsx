import React from 'react';

export const Logo = ({ className = "h-8" }: { className?: string }) => {
  return (
    <img src="/Logo.png" alt="JenG Film Studio" className={`object-contain ${className}`} />
  );
};
