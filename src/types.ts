export type LinkStatus = 'active' | 'expired' | 'disabled' | 'deleted';

export interface LinkRecord {
  internal_id: string;
  code: string;
  destination: string;
  created_at: string; // ISO 8601 UTC
  expires_at: string | null; // ISO 8601 UTC
  owner_id: string;
  status: LinkStatus;
  click_count: number;
  is_suspicious?: boolean;
  suspicious_reason?: string;
  tombstone?: boolean;
  title?: string;
  updated_at?: string;
}

export interface LinkCreatePayload {
  url: string;
  custom_alias?: string;
  expires_in?: '1h' | '24h' | '7d' | '30d' | 'never' | 'custom';
  custom_expires_at?: string; // ISO string
  owner_id?: string;
}

export interface LinkCreateResponse {
  link: LinkRecord;
  management_token: string;
  short_url: string;
}

export interface LinkAnalytics {
  internal_id: string;
  code: string;
  destination: string;
  total_clicks: number;
  today_clicks: number;
  last_7_days_clicks: number;
  last_30_days_clicks: number;
  clicks_by_date: { date: string; clicks: number }[];
  referrers: { source: string; count: number }[];
  devices: { device: string; count: number }[];
  browsers: { browser: string; count: number }[];
  countries: { country: string; count: number }[];
  audit_logs: AuditLogEntry[];
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  event: 'created' | 'destination_edited' | 'disabled' | 'enabled' | 'deleted' | 'permanent_deleted' | 'claimed';
  details?: string;
}

export interface ApiErrorResponse {
  error: {
    code:
      | 'INVALID_URL'
      | 'MISSING_URL'
      | 'INVALID_ALIAS'
      | 'ALIAS_TAKEN'
      | 'RESERVED_ALIAS'
      | 'RATE_LIMITED'
      | 'UNAUTHORIZED'
      | 'FORBIDDEN'
      | 'LINK_NOT_FOUND'
      | 'LINK_EXPIRED'
      | 'LINK_DISABLED'
      | 'REDIS_UNAVAILABLE'
      | 'INTERNAL_ERROR'
      | 'DELETE_FAILED'
      | 'CLAIM_FAILED'
      | 'DESTINATION_BLOCKED';
    message: string;
  };
}

export interface HealthStatus {
  status: 'ok' | 'degraded' | 'error';
  timestamp: string;
  uptime_seconds: number;
  storage: {
    engine: 'upstash_redis' | 'local_persistent';
    connected: boolean;
    total_links: number;
    total_tombstones: number;
    latency_ms?: number;
    redis_configured?: boolean;
    detail_message?: string;
  };
  version: string;
}
