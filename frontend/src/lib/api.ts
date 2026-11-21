// frontend/src/lib/api.ts
import { MapFeedData, ReportItem, UserProfile, AlertItem, LocalTrendData } from '@/types';

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

export async function fetchProfiles(): Promise<UserProfile[]> {
  const res = await fetch(`${API_BASE}/profiles`, { cache: 'no-store' });
  if (!res.ok) {
    return [
      {
        id: '22222222-2222-2222-2222-222222222201',
        name: 'Thomas Kutty',
        phone: '+919447101001',
        role: 'farmer',
        village_or_padasekharam: 'Pulincunnoo Padasekharam',
        farm_type: 'paddy',
        latitude: 9.446,
        longitude: 76.458,
      },
      {
        id: '22222222-2222-2222-2222-222222222202',
        name: 'Radhakrishnan M.',
        phone: '+919447101002',
        role: 'farmer',
        village_or_padasekharam: 'Moncompu Thekkekkara',
        farm_type: 'both',
        latitude: 9.429,
        longitude: 76.439,
      },
      {
        id: '22222222-2222-2222-2222-222222222204',
        name: 'Sreedhar P.',
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

export async function fetchAlerts(category?: string): Promise<AlertItem[]> {
  const url = category && category !== 'all' 
    ? `${API_BASE}/alerts?category=${category}` 
    : `${API_BASE}/alerts`;
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) {
    throw new Error(`Failed to load alerts: ${res.statusText}`);
  }
  return res.json();
}

export async function markAlertsRead(alertId?: string): Promise<{ status: string }> {
  const res = await fetch(`${API_BASE}/alerts/mark-read`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ alert_id: alertId }),
  });
  if (!res.ok) {
    throw new Error(`Failed to mark alert as read: ${res.statusText}`);
  }
  return res.json();
}

export async function fetchLocalTrend(lat: number, lng: number, radiusKm: number = 3.0): Promise<LocalTrendData> {
  const res = await fetch(`${API_BASE}/trends/local?lat=${lat}&lng=${lng}&radius_km=${radiusKm}`, {
    cache: 'no-store',
  });
  if (!res.ok) {
    throw new Error(`Failed to load local trend: ${res.statusText}`);
  }
  return res.json();
}

export async function demoLogin(name: string, phone: string, padasekharam: string, role: string = 'farmer') {
  const res = await fetch(`${API_BASE}/auth/demo-login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, phone, padasekharam, role }),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(errorData.detail || 'Demo login failed');
  }
  return res.json();
}
