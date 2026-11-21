// frontend/src/app/report/page.tsx
'use client';

import React from 'react';
import ReportForm from '@/components/Report/ReportForm';

export default function ReportPage() {
  return (
    <div className="flex-1 bg-gradient-to-b from-emerald-50/50 to-gray-50 py-4 sm:py-6">
      <ReportForm />
    </div>
  );
}
