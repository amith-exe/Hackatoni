// frontend/src/lib/api.ts
import { MapFeedData, ReportItem, Profile } from '@/types';

const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL 
  ? `${process.env.NEXT_PUBLIC_BACKEND_URL}/api`
  : '/api';

export async function fetchMapFeed(): Promise<MapFeedData> {
  const res = await fetch(`${API_BASE}/map-feed`, { cache: 'no-store' });
  if (!res.ok) {
    throw new Error(`Failed to load map feed: ${res.statusText}`);
  }
  return res.json();
}

export async function submitReport(payload: {
  reporter_id: string;
  report_type: string;
  latitude: number;
  longitude: number;
  photo_url?: string;
  notes_text?: string;
  details?: Record<string, any>;
}): Promise<ReportItem> {
  const res = await fetch(`${API_BASE}/reports`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(errorData.detail || 'Failed to submit report');
  }
  return res.json();
}

export async function confirmReport(reportId: string, confirmerId: string): Promise<ReportItem> {
  const res = await fetch(`${API_BASE}/reports/${reportId}/confirm`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ confirmer_id: confirmerId }),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(errorData.detail || 'Failed to confirm report');
  }
  return res.json();
}

export async function verifyReport(
  reportId: string,
  officerId: string,
  status: 'officially_verified' | 'rejected',
  notes?: string
): Promise<ReportItem> {
  const res = await fetch(`${API_BASE}/reports/${reportId}/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ officer_id: officerId, status, notes }),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(errorData.detail || 'Failed to verify report');
  }
  return res.json();
}

export async function fetchProfiles(): Promise<Profile[]> {
  const res = await fetch(`${API_BASE}/profiles`, { cache: 'no-store' });
  if (!res.ok) {
    return [
      {
        id: '22222222-2222-2222-2222-222222222201',
        name: 'Thomas Kutty (തോമസ് കുട്ടി)',
        phone: '+919447101001',
        role: 'farmer',
        village_or_padasekharam: 'Pulincunnoo Padasekharam',
        farm_type: 'paddy',
        latitude: 9.446,
        longitude: 76.458,
      },
      {
        id: '22222222-2222-2222-2222-222222222202',
        name: 'Radhakrishnan M. (രാധാകൃഷ്ണൻ)',
        phone: '+919447101002',
        role: 'farmer',
        village_or_padasekharam: 'Moncompu Thekkekkara',
        farm_type: 'both',
        latitude: 9.429,
        longitude: 76.439,
      },
      {
        id: '22222222-2222-2222-2222-222222222204',
        name: 'Sreedhar P. (ശ്രീധർ - കൃഷി ഓഫീസർ)',
        phone: '+919447101004',
        role: 'officer',
        village_or_padasekharam: 'Krishi Bhavan Champakulam',
        farm_type: 'paddy',
        latitude: 9.43,
        longitude: 76.432,
      },
    ];
  }
  return res.json();
}

export async function fetchOfficerDashboard() {
  const res = await fetch(`${API_BASE}/officer/dashboard`, { cache: 'no-store' });
  if (!res.ok) {
    throw new Error(`Failed to load officer dashboard: ${res.statusText}`);
  }
  return res.json();
}
