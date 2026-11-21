// frontend/src/app/verify/page.tsx
'use client';

import React from 'react';
import VerificationQueue from '@/components/Verify/VerificationQueue';

export default function VerifyPage() {
  return (
    <div className="flex-1 bg-gradient-to-b from-emerald-50/50 to-gray-50 py-4 sm:py-6">
      <VerificationQueue />
    </div>
  );
}
