// frontend/src/app/alerts/page.tsx
'use client';

import React from 'react';
import AlertsInbox from '@/components/Alerts/AlertsInbox';

export default function AlertsPage() {
  return (
    <div className="flex-1 bg-gradient-to-b from-emerald-50/50 to-gray-50 py-4 sm:py-6">
      <AlertsInbox />
    </div>
  );
}
