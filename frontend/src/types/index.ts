// frontend/src/types/index.ts

export type ReportType = 'crop_disease' | 'salinity' | 'bird_deaths' | 'bund_seepage' | 'crop_loss';

export type VerificationStatus = 'unconfirmed' | 'community_confirmed' | 'officially_verified' | 'rejected';

export type AlertLevel = 'Watch' | 'Warning' | 'Danger';

export type Trend = 'new' | 'growing' | 'stable';

export type Language = 'en' | 'ml';

export interface ActionGuidance {
  alert_level: AlertLevel;
  title: string;
  title_ml: string;
  summary: string;
  bullet_points: string[];
  citation?: string;
  helpline?: string;
  is_uncertain?: boolean;
}

export interface ReportItem {
  id: string;
  report_type: ReportType;
  latitude: number;
  longitude: number;
  canal_segment_id?: string;
  canal_name?: string;
  flow_direction?: string;
  photo_url?: string;
  notes_text?: string;
  details: Record<string, any>;
  verification_status: VerificationStatus;
  confirmations_count: number;
  created_at: string;
  action_guidance?: ActionGuidance;
}

export interface CanalSegment {
  id: string;
  name: string;
  coordinates: number[][]; // [[lng, lat], ...]
  upstream_segment_id?: string | null;
  downstream_segment_id?: string | null;
  current_alert_level?: AlertLevel | null;
  salinity_ppt?: number | null;
  alert_reason?: string | null;
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

export interface RainfallSummary {
  source: string;
  status: string;
  total_rain_24h_mm: number;
  total_rain_48h_mm: number;
  dilution_factor: string;
}

export interface MapFeedData {
  reports: ReportItem[];
  active_clusters: ClusterItem[];
  affected_canals: CanalSegment[];
  rainfall_summary?: RainfallSummary;
  outbreak_breakdown: OutbreakBreakdown[];
}

export interface OutbreakBreakdown {
  disease_code?: string;
  threat_code?: string;
  label: string;
  current_7d_count: number;
  previous_7d_count: number;
  growth_pct: number;
  spread_status: 'spreading' | 'active_cluster' | 'watch' | 'isolated';
  cluster_count: number;
  center?: { lat: number; lng: number };
  affected_areas: string[];
}

export interface TrendAnalysis {
  selected_location: { lat: number; lng: number };
  dbscan_summary: { clusters_found: number; clustered_reports_count: number; noise_reports_count: number; eps_km: number; radius_km: number };
  spreading_diseases: Array<{ disease_code: string; label: string; distance_km: number; current_count: number; previous_count: number; trend_label: string; percentage_change: number; cluster_center?: { lat: number; lng: number }; action_summary?: string[] }>;
  canal_salinity_status: { status: string; salinity_ppt: number; canal_name?: string; distance_km: number };
  recommended_actions: string[];
}

export interface AlertItem {
  id: string;
  category: 'salinity' | 'cluster' | 'verification';
  title: string;
  description: string;
  alert_level: AlertLevel;
  timestamp: string;
  location?: { lat: number; lng: number };
  is_read: boolean;
  metadata?: Record<string, any>;
}

export interface LocalTrendData {
  query_latitude: number;
  query_longitude: number;
  nearest_landmark: string;
  nearby_reports_count_7d: number;
  prior_7d_reports_count: number;
  trend_direction: 'Growing' | 'Stable' | 'Watch';
  nearest_canal_name?: string;
  nearest_canal_distance_km: number;
  nearest_canal_salinity_ppt?: number;
  nearest_canal_alert_level?: AlertLevel;
  active_outbreak_nearby: boolean;
  nearest_cluster_name?: string;
  recommended_action: string;
  reports_nearby: ReportItem[];
}

export interface UserProfile {
  id: string;
  name: string;
  phone: string;
  role: 'farmer' | 'officer';
  village_or_padasekharam: string;
  farm_type?: string;
  latitude: number;
  longitude: number;
}
