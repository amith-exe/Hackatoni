export type ReportType = 'crop_disease' | 'salinity' | 'bird_deaths' | 'bund_seepage' | 'crop_loss';

export type VerificationStatus = 'unconfirmed' | 'community_confirmed' | 'officially_verified' | 'rejected';

export type AlertLevel = 'Watch' | 'Warning' | 'Danger';

export type Trend = 'new' | 'growing' | 'stable';

export type FlowDirection = 'toward_sea' | 'inland' | 'unknown';

export interface ActionGuidance {
  title: string;
  title_ml: string;
  alert_level: AlertLevel;
  summary: string;
  bullet_points: string[];
  citation?: string;
  helpline?: string;
  is_uncertain: boolean;
}

export interface ReportItem {
  id: string;
  report_type: ReportType;
  latitude: float;
  longitude: float;
  canal_segment_id?: string;
  canal_name?: string;
  flow_direction: FlowDirection;
  photo_url?: string;
  notes_text?: string;
  details: Record<string, any>;
  verification_status: VerificationStatus;
  confirmations_count: number;
  created_at: string;
  action_guidance?: ActionGuidance;
}

type float = number;

export interface CanalSegment {
  id: string;
  name: string;
  coordinates: [number, number][]; // [lng, lat]
  upstream_segment_id?: string;
  downstream_segment_id?: string;
  current_alert_level?: AlertLevel;
  salinity_ppt?: number;
  alert_reason?: string;
}

export interface ClusterItem {
  id: string;
  report_type: string;
  sub_category?: string;
  center_latitude: number;
  center_longitude: number;
  radius_km: number;
  report_count: number;
  window_start: string;
  window_end: string;
  trend: Trend;
  alert_level: AlertLevel;
}

export interface MapFeedData {
  reports: ReportItem[];
  active_clusters: ClusterItem[];
  affected_canals: CanalSegment[];
  rainfall_summary?: {
    source: string;
    status: string;
    total_rain_24h_mm: number;
    total_rain_48h_mm: number;
    dilution_factor: string;
  };
}

export interface Profile {
  id: string;
  name: string;
  phone: string;
  role: 'farmer' | 'officer';
  village_or_padasekharam: string;
  farm_type: 'paddy' | 'duck' | 'both';
  latitude: number;
  longitude: number;
}
