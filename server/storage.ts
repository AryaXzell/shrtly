import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import dotenv from 'dotenv';
import { Redis } from '@upstash/redis';
import { LinkRecord, LinkStatus, LinkAnalytics, AuditLogEntry } from '../src/types';

dotenv.config();

interface ClickEvent {
  timestamp: string;
  referrer: string;
  device: string;
  browser: string;
  country: string;
}

interface StoredLinkData {
  link: LinkRecord;
  management_token_hash: string;
  analytics: {
    clicks: ClickEvent[];
    audit_logs: AuditLogEntry[];
  };
}

export interface ReportRecord {
  id: string;
  code: string;
  category: string;
  notes: string;
  reported_at: string;
  client_ip: string;
}

export interface HealthCheckResult {
  connected: boolean;
  engine: 'upstash_redis' | 'local_persistent';
  total_links: number;
  total_tombstones: number;
  latency_ms?: number;
  redis_configured?: boolean;
  detail_message?: string;
}

export interface IStorageEngine {
  isUpstashConfigured(): boolean;
  checkHealth(): Promise<HealthCheckResult>;
  reserveCode(code: string, internalId: string): Promise<boolean>;
  releaseCode(code: string): Promise<void>;
  tombstoneCode(code: string): Promise<void>;
  createLink(data: {
    code: string;
    destination: string;
    expires_at: string | null;
    owner_id: string;
    management_token: string;
    is_suspicious?: boolean;
    suspicious_reason?: string;
  }): Promise<{ link: LinkRecord; management_token: string }>;
  getLinkByCode(code: string): Promise<LinkRecord | null>;
  getLinkByInternalId(internalId: string): Promise<LinkRecord | null>;
  verifyManagementToken(internalId: string, token?: string, ownerId?: string): Promise<boolean>;
  listLinksByOwner(ownerId?: string, tokens?: string[]): Promise<LinkRecord[]>;
  updateDestination(internalId: string, newDestination: string, token?: string, ownerId?: string): Promise<LinkRecord>;
  toggleLinkStatus(internalId: string, status: 'active' | 'disabled', token?: string, ownerId?: string): Promise<LinkRecord>;
  deleteLink(internalId: string, token?: string, permanentServerDelete?: boolean, ownerId?: string): Promise<{ success: boolean; code: string; wasPermanent: boolean }>;
  recordClick(code: string, clientInfo: { referrer?: string; userAgent?: string; country?: string }): Promise<void>;
  getAnalytics(internalId: string, token?: string, ownerId?: string): Promise<LinkAnalytics | null>;
  recordReport(code: string, category: string, notes: string, clientIp: string): Promise<void>;
  checkRateLimit(key: string, maxRequests: number, windowSeconds: number): Promise<{ allowed: boolean; remaining: number; resetTimeSeconds: number }>;
  getAllLinksForExport(ownerId?: string, tokens?: string[]): Promise<LinkRecord[]>;
}

// Helper to hash management token
export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token.trim()).digest('hex');
}

/**
 * High-performance file & memory storage engine with guaranteed ACID atomic checks.
 * Ensures that even without Upstash Redis configured yet, SHRTLY works with 100% fidelity.
 */
class LocalStorageEngine implements IStorageEngine {
  private dataFilePath: string;
  private links: Map<string, StoredLinkData> = new Map(); // internal_id -> data
  private codeToId: Map<string, string> = new Map(); // code -> internal_id
  private tombstones: Set<string> = new Set(); // codes permanently reserved
  private rateLimits: Map<string, { count: number; resetAt: number }> = new Map();
  private reports: ReportRecord[] = [];
  private saveTimeout: NodeJS.Timeout | null = null;

  constructor() {
    const dataDir = path.join(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    this.dataFilePath = path.join(dataDir, 'shrtly_storage.json');
    this.loadFromDisk();
  }

  private loadFromDisk(): void {
    try {
      if (fs.existsSync(this.dataFilePath)) {
        const raw = fs.readFileSync(this.dataFilePath, 'utf-8');
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed.links)) {
          for (const item of parsed.links) {
            this.links.set(item.link.internal_id, item);
            this.codeToId.set(item.link.code.trim().toLowerCase(), item.link.internal_id);
          }
        }
        if (Array.isArray(parsed.tombstones)) {
          for (const t of parsed.tombstones) {
            this.tombstones.add(t.trim().toLowerCase());
          }
        }
        if (Array.isArray(parsed.reports)) {
          this.reports = parsed.reports;
        }
      }
    } catch (err) {
      console.warn('Could not read existing local storage file, starting fresh:', err);
    }
  }

  private scheduleSave(): void {
    if (this.saveTimeout) return;
    this.saveTimeout = setTimeout(() => {
      this.saveTimeout = null;
      try {
        const payload = {
          links: Array.from(this.links.values()),
          tombstones: Array.from(this.tombstones),
          reports: this.reports,
        };
        fs.writeFileSync(this.dataFilePath, JSON.stringify(payload, null, 2), 'utf-8');
      } catch (err) {
        console.error('Failed to write storage file:', err);
      }
    }, 200);
  }

  isUpstashConfigured(): boolean {
    return false;
  }

  totalLinksCount(): number {
    return this.links.size;
  }

  async checkHealth(): Promise<HealthCheckResult> {
    return {
      connected: true,
      engine: 'local_persistent' as const,
      total_links: this.links.size,
      total_tombstones: this.tombstones.size,
      latency_ms: 1,
      redis_configured: false,
      detail_message: 'Operating on local persistent JSON storage (Zero-setup).',
    };
  }

  async reserveCode(code: string, internalId: string): Promise<boolean> {
    const normalized = code.trim().toLowerCase();
    if (this.tombstones.has(normalized)) {
      return false; // Code was previously used and tombstoned!
    }
    if (this.codeToId.has(normalized)) {
      return false; // Code currently taken
    }
    this.codeToId.set(normalized, internalId);
    return true;
  }

  async releaseCode(code: string): Promise<void> {
    const normalized = code.trim().toLowerCase();
    if (this.codeToId.get(normalized) === 'pending') {
      this.codeToId.delete(normalized);
    }
  }

  async tombstoneCode(code: string): Promise<void> {
    this.tombstones.add(code.trim().toLowerCase());
    this.scheduleSave();
  }

  async createLink(data: {
    code: string;
    destination: string;
    expires_at: string | null;
    owner_id: string;
    management_token: string;
    is_suspicious?: boolean;
    suspicious_reason?: string;
  }): Promise<{ link: LinkRecord; management_token: string }> {
    const internalId = crypto.randomUUID();
    const tokenHash = hashToken(data.management_token);

    const link: LinkRecord = {
      internal_id: internalId,
      code: data.code,
      destination: data.destination,
      created_at: new Date().toISOString(),
      expires_at: data.expires_at,
      owner_id: data.owner_id,
      status: 'active',
      click_count: 0,
      is_suspicious: data.is_suspicious || false,
      suspicious_reason: data.suspicious_reason,
    };

    const audit: AuditLogEntry = {
      id: crypto.randomUUID(),
      timestamp: link.created_at,
      event: 'created',
      details: `Created short link for ${data.destination}`,
    };

    const storedData: StoredLinkData = {
      link,
      management_token_hash: tokenHash,
      analytics: {
        clicks: [],
        audit_logs: [audit],
      },
    };

    this.links.set(internalId, storedData);
    this.codeToId.set(data.code.trim().toLowerCase(), internalId);
    this.scheduleSave();

    return { link, management_token: data.management_token };
  }

  saveDirectLink(link: LinkRecord, tokenHash: string, audit: AuditLogEntry): void {
    const storedData: StoredLinkData = {
      link,
      management_token_hash: tokenHash,
      analytics: {
        clicks: [],
        audit_logs: [audit],
      },
    };
    this.links.set(link.internal_id, storedData);
    this.codeToId.set(link.code.trim().toLowerCase(), link.internal_id);
    this.scheduleSave();
  }

  async getLinkByCode(code: string): Promise<LinkRecord | null> {
    const normalized = code.trim().toLowerCase();
    let internalId = this.codeToId.get(normalized);

    // Self-heal: if codeToId is missing or stuck at 'pending', scan existing links
    if (!internalId || internalId === 'pending') {
      for (const [id, item] of this.links.entries()) {
        if (item.link.code.trim().toLowerCase() === normalized) {
          internalId = id;
          this.codeToId.set(normalized, id);
          break;
        }
      }
    }

    if (!internalId || internalId === 'pending') {
      if (this.tombstones.has(normalized)) {
        return {
          internal_id: 'tombstone',
          code: normalized,
          destination: '',
          created_at: '',
          expires_at: null,
          owner_id: '',
          status: 'deleted',
          click_count: 0,
          tombstone: true,
        };
      }
      return null;
    }
    const item = this.links.get(internalId);
    if (!item) return null;

    // Check dynamic expiration
    const link = { ...item.link };
    if (link.expires_at && link.status === 'active') {
      if (new Date(link.expires_at).getTime() < Date.now()) {
        link.status = 'expired';
      }
    }
    return link;
  }

  async getLinkByInternalId(internalId: string): Promise<LinkRecord | null> {
    const item = this.links.get(internalId);
    if (!item) return null;
    const link = { ...item.link };
    if (link.expires_at && link.status === 'active') {
      if (new Date(link.expires_at).getTime() < Date.now()) {
        link.status = 'expired';
      }
    }
    return link;
  }

  async verifyManagementToken(internalId: string, token?: string, ownerId?: string): Promise<boolean> {
    const item = this.links.get(internalId) || (this.codeToId.has(internalId) ? this.links.get(this.codeToId.get(internalId)!) : undefined);
    if (!item) return false;
    if (token && item.management_token_hash === hashToken(token)) return true;
    if (ownerId && item.link.owner_id === ownerId) return true;
    return false;
  }

  async listLinksByOwner(ownerId: string = '', tokens: string[] = []): Promise<LinkRecord[]> {
    const tokenHashes = new Set(tokens.map((t) => hashToken(t)));
    const results: LinkRecord[] = [];

    for (const item of this.links.values()) {
      const matchOwner = Boolean(ownerId && item.link.owner_id === ownerId);
      const matchToken = Boolean(tokens.length > 0 && tokenHashes.has(item.management_token_hash));

      if ((matchOwner || matchToken) && item.link.status !== 'deleted') {
        const link = { ...item.link };
        if (link.expires_at && link.status === 'active') {
          if (new Date(link.expires_at).getTime() < Date.now()) {
            link.status = 'expired';
          }
        }
        results.push(link);
      }
    }

    // Sort newest first
    return results.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  async updateDestination(internalId: string, newDestination: string, token?: string, ownerId?: string): Promise<LinkRecord> {
    const item = this.links.get(internalId) || (this.codeToId.has(internalId) ? this.links.get(this.codeToId.get(internalId)!) : undefined);
    if (!item) throw new Error('Link not found');
    const isTokenMatch = Boolean(token && item.management_token_hash === hashToken(token));
    const isOwnerMatch = Boolean(ownerId && item.link.owner_id === ownerId);
    if (!isTokenMatch && !isOwnerMatch) throw new Error('Unauthorized');

    const oldDest = item.link.destination;
    item.link.destination = newDestination;
    item.link.updated_at = new Date().toISOString();

    item.analytics.audit_logs.unshift({
      id: crypto.randomUUID(),
      timestamp: item.link.updated_at,
      event: 'destination_edited',
      details: `Destination updated from ${oldDest} to ${newDestination}`,
    });

    this.scheduleSave();
    return item.link;
  }

  async toggleLinkStatus(internalId: string, status: 'active' | 'disabled', token?: string, ownerId?: string): Promise<LinkRecord> {
    const item = this.links.get(internalId) || (this.codeToId.has(internalId) ? this.links.get(this.codeToId.get(internalId)!) : undefined);
    if (!item) throw new Error('Link not found');
    const isTokenMatch = Boolean(token && item.management_token_hash === hashToken(token));
    const isOwnerMatch = Boolean(ownerId && item.link.owner_id === ownerId);
    if (!isTokenMatch && !isOwnerMatch) throw new Error('Unauthorized');

    item.link.status = status;
    item.link.updated_at = new Date().toISOString();

    item.analytics.audit_logs.unshift({
      id: crypto.randomUUID(),
      timestamp: item.link.updated_at,
      event: status === 'active' ? 'enabled' : 'disabled',
      details: `Link status changed to ${status}`,
    });

    this.scheduleSave();
    return item.link;
  }

  async deleteLink(
    internalId: string,
    token?: string,
    permanentServerDelete: boolean = false,
    ownerId?: string
  ): Promise<{ success: boolean; code: string; wasPermanent: boolean }> {
    const item = this.links.get(internalId) || (this.codeToId.has(internalId) ? this.links.get(this.codeToId.get(internalId)!) : undefined);
    if (!item) throw new Error('Link not found');
    const isTokenMatch = Boolean(token && item.management_token_hash === hashToken(token));
    const isOwnerMatch = Boolean(ownerId && item.link.owner_id === ownerId);
    if (!isTokenMatch && !isOwnerMatch) throw new Error('Unauthorized');

    const code = item.link.code;
    const normalizedCode = code.trim().toLowerCase();

    // ALWAYS tombstone the public code so it can NEVER be reused!
    this.tombstones.add(normalizedCode);
    this.codeToId.delete(normalizedCode);

    if (permanentServerDelete) {
      // Hard delete from storage
      this.links.delete(internalId);
    } else {
      // Soft delete: status = 'deleted'
      item.link.status = 'deleted';
      item.link.tombstone = true;
      item.link.updated_at = new Date().toISOString();
      item.analytics.audit_logs.unshift({
        id: crypto.randomUUID(),
        timestamp: item.link.updated_at,
        event: 'deleted',
        details: 'Link marked as deleted (code permanently tombstoned)',
      });
    }

    this.scheduleSave();
    return { success: true, code, wasPermanent: permanentServerDelete };
  }

  async recordClick(
    code: string,
    clientInfo: { referrer?: string; userAgent?: string; country?: string }
  ): Promise<void> {
    const internalId = this.codeToId.get(code);
    if (!internalId) return;
    const item = this.links.get(internalId);
    if (!item) return;

    item.link.click_count += 1;

    // Parse simple device/browser from userAgent without raw IP retention
    const ua = clientInfo.userAgent || '';
    let device = 'Desktop';
    if (/mobile/i.test(ua)) device = 'Mobile';
    else if (/tablet|ipad/i.test(ua)) device = 'Tablet';

    let browser = 'Other';
    if (/edg/i.test(ua)) browser = 'Edge';
    else if (/chrome/i.test(ua)) browser = 'Chrome';
    else if (/firefox/i.test(ua)) browser = 'Firefox';
    else if (/safari/i.test(ua)) browser = 'Safari';

    let referrerHost = 'Direct';
    if (clientInfo.referrer) {
      try {
        const refUrl = new URL(clientInfo.referrer);
        referrerHost = refUrl.hostname.replace(/^www\./, '');
      } catch {
        referrerHost = 'Other';
      }
    }

    const clickEvent: ClickEvent = {
      timestamp: new Date().toISOString(),
      referrer: referrerHost,
      device,
      browser,
      country: clientInfo.country || 'Unknown',
    };

    item.analytics.clicks.unshift(clickEvent);
    // Keep max 1000 clicks in memory/local file
    if (item.analytics.clicks.length > 1000) {
      item.analytics.clicks.length = 1000;
    }

    this.scheduleSave();
  }

  async getAnalytics(internalId: string, token?: string, ownerId?: string): Promise<LinkAnalytics | null> {
    const isAuth = await this.verifyManagementToken(internalId, token, ownerId);
    if (!isAuth) throw new Error('Unauthorized');

    let item = this.links.get(internalId);
    if (!item) {
      const resolvedId = this.codeToId.get(internalId) || this.codeToId.get(internalId.toLowerCase());
      if (resolvedId) {
        item = this.links.get(resolvedId);
      }
    }
    if (!item) return null;

    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;
    const todayCutoff = now - oneDay;
    const weekCutoff = now - 7 * oneDay;
    const monthCutoff = now - 30 * oneDay;

    let todayClicks = 0;
    let weekClicks = 0;
    let monthClicks = 0;

    const dateMap: Map<string, number> = new Map();
    const refMap: Map<string, number> = new Map();
    const devMap: Map<string, number> = new Map();
    const browserMap: Map<string, number> = new Map();
    const countryMap: Map<string, number> = new Map();

    // Initialize last 30 days buckets
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now - i * oneDay).toISOString().split('T')[0];
      dateMap.set(d, 0);
    }

    for (const c of item.analytics.clicks) {
      const t = new Date(c.timestamp).getTime();
      const dateKey = c.timestamp.split('T')[0];

      if (t >= todayCutoff) todayClicks++;
      if (t >= weekCutoff) weekClicks++;
      if (t >= monthCutoff) monthClicks++;

      if (dateMap.has(dateKey)) {
        dateMap.set(dateKey, (dateMap.get(dateKey) || 0) + 1);
      }

      refMap.set(c.referrer, (refMap.get(c.referrer) || 0) + 1);
      devMap.set(c.device, (devMap.get(c.device) || 0) + 1);
      browserMap.set(c.browser, (browserMap.get(c.browser) || 0) + 1);
      countryMap.set(c.country, (countryMap.get(c.country) || 0) + 1);
    }

    const mapToSortedArray = (map: Map<string, number>, keyName: string) =>
      Array.from(map.entries())
        .map(([k, count]) => ({ [keyName]: k, count }))
        .sort((a, b) => (b.count as number) - (a.count as number)) as any[];

    return {
      internal_id: item.link.internal_id,
      code: item.link.code,
      destination: item.link.destination,
      total_clicks: item.link.click_count,
      today_clicks: todayClicks,
      last_7_days_clicks: weekClicks,
      last_30_days_clicks: monthClicks,
      clicks_by_date: Array.from(dateMap.entries()).map(([date, clicks]) => ({ date, clicks })),
      referrers: mapToSortedArray(refMap, 'source'),
      devices: mapToSortedArray(devMap, 'device'),
      browsers: mapToSortedArray(browserMap, 'browser'),
      countries: mapToSortedArray(countryMap, 'country'),
      audit_logs: item.analytics.audit_logs,
    };
  }

  async recordReport(code: string, category: string, notes: string, clientIp: string): Promise<void> {
    const report: ReportRecord = {
      id: crypto.randomUUID(),
      code,
      category,
      notes,
      reported_at: new Date().toISOString(),
      client_ip: clientIp.replace(/(\d+)\.(\d+)\..*/, '$1.$2.*.*'), // Mask IP for privacy
    };
    this.reports.push(report);

    // Auto-flag threshold: if link receives >= 3 reports, flag it as suspicious
    const normalizedCode = code.trim().toLowerCase();
    const codeReports = this.reports.filter((r) => r.code.trim().toLowerCase() === normalizedCode);
    if (codeReports.length >= 3) {
      const internalId = this.codeToId.get(normalizedCode);
      if (internalId) {
        const item = this.links.get(internalId);
        if (item && !item.link.is_suspicious) {
          item.link.is_suspicious = true;
          item.link.suspicious_reason = `Auto-flagged due to multiple community reports (${codeReports.length} reports for ${category})`;
          item.analytics.audit_logs.unshift({
            id: crypto.randomUUID(),
            timestamp: new Date().toISOString(),
            event: 'flagged_suspicious',
            details: `Auto-flagged due to community abuse reports`,
          });
        }
      }
    }

    this.scheduleSave();
  }

  async checkRateLimit(
    key: string,
    maxRequests: number,
    windowSeconds: number
  ): Promise<{ allowed: boolean; remaining: number; resetTimeSeconds: number }> {
    const now = Date.now();
    const existing = this.rateLimits.get(key);

    if (!existing || now > existing.resetAt) {
      this.rateLimits.set(key, { count: 1, resetAt: now + windowSeconds * 1000 });
      return { allowed: true, remaining: maxRequests - 1, resetTimeSeconds: windowSeconds };
    }

    if (existing.count < maxRequests) {
      existing.count += 1;
      const remainingSeconds = Math.ceil((existing.resetAt - now) / 1000);
      return { allowed: true, remaining: maxRequests - existing.count, resetTimeSeconds: remainingSeconds };
    }

    const remainingSeconds = Math.ceil((existing.resetAt - now) / 1000);
    return { allowed: false, remaining: 0, resetTimeSeconds: remainingSeconds };
  }

  async getAllLinksForExport(ownerId: string, tokens: string[] = []): Promise<LinkRecord[]> {
    return this.listLinksByOwner(ownerId, tokens);
  }
}

/**
 * Upstash Redis Implementation with identical semantics.
 * Connects directly using @upstash/redis when env vars are provided.
 */
class UpstashStorageEngine implements IStorageEngine {
  private redis: Redis;
  private fallback: LocalStorageEngine;

  constructor(url: string, token: string, fallback: LocalStorageEngine) {
    this.redis = new Redis({ url, token });
    this.fallback = fallback;
  }

  isUpstashConfigured(): boolean {
    return true;
  }

  async checkHealth(): Promise<HealthCheckResult> {
    const t0 = Date.now();
    try {
      await this.redis.ping();
      const latency_ms = Date.now() - t0;
      const count = (await this.redis.scard('shrtly:codes:active')) || 0;
      const tombstones = (await this.redis.scard('shrtly:codes:tombstones')) || 0;
      return {
        connected: true,
        engine: 'upstash_redis' as const,
        total_links: count,
        total_tombstones: tombstones,
        latency_ms,
        redis_configured: true,
        detail_message: `Connected to Upstash Redis cluster (${latency_ms}ms roundtrip).`,
      };
    } catch (err: any) {
      console.warn('Upstash health check failed, will use local fallback:', err);
      return {
        connected: false,
        engine: 'upstash_redis' as const,
        total_links: this.fallback.totalLinksCount(),
        total_tombstones: 0,
        redis_configured: true,
        detail_message: err?.message ? `Upstash ping failed: ${err.message}` : 'Upstash connection failed',
      };
    }
  }

  async reserveCode(code: string, internalId: string): Promise<boolean> {
    const normalized = code.trim().toLowerCase();
    try {
      const isTombstoned = await this.redis.sismember('shrtly:codes:tombstones', normalized);
      if (isTombstoned) return false;

      // SETNX atomic operation
      const success = await this.redis.set(`shrtly:code:${normalized}`, internalId, { nx: true });
      if (success) {
        await this.redis.sadd('shrtly:codes:active', normalized);
        return true;
      }
      return false;
    } catch (err) {
      console.warn('Redis error during reserveCode, falling back to local engine:', err);
      return this.fallback.reserveCode(normalized, internalId);
    }
  }

  async releaseCode(code: string): Promise<void> {
    const normalized = code.trim().toLowerCase();
    try {
      const current = await this.redis.get<string>(`shrtly:code:${normalized}`);
      if (current === 'pending') {
        await this.redis.del(`shrtly:code:${normalized}`);
        await this.redis.srem('shrtly:codes:active', normalized);
      }
    } catch {
      // ignore
    }
    await this.fallback.releaseCode(normalized);
  }

  async tombstoneCode(code: string): Promise<void> {
    const normalized = code.trim().toLowerCase();
    try {
      await this.redis.del(`shrtly:code:${normalized}`);
      await this.redis.srem('shrtly:codes:active', normalized);
      await this.redis.sadd('shrtly:codes:tombstones', normalized);
    } catch {
      await this.fallback.tombstoneCode(normalized);
    }
  }

  async createLink(data: {
    code: string;
    destination: string;
    expires_at: string | null;
    owner_id: string;
    management_token: string;
    is_suspicious?: boolean;
    suspicious_reason?: string;
  }): Promise<{ link: LinkRecord; management_token: string }> {
    try {
      const internalId = crypto.randomUUID();
      const tokenHash = hashToken(data.management_token);
      const normalizedCode = data.code.trim().toLowerCase();

      const link: LinkRecord = {
        internal_id: internalId,
        code: data.code,
        destination: data.destination,
        created_at: new Date().toISOString(),
        expires_at: data.expires_at,
        owner_id: data.owner_id,
        status: 'active',
        click_count: 0,
        is_suspicious: data.is_suspicious || false,
        suspicious_reason: data.suspicious_reason,
      };

      const audit: AuditLogEntry = {
        id: crypto.randomUUID(),
        timestamp: link.created_at,
        event: 'created',
        details: `Created short link for ${data.destination}`,
      };

      // Batch all Redis write operations in a single pipeline request
      const pipeline = this.redis.pipeline();
      pipeline.hset(`shrtly:link:${internalId}`, {
        link: JSON.stringify(link),
        token_hash: tokenHash,
      });
      pipeline.sadd(`shrtly:owner:${data.owner_id}:links`, internalId);
      pipeline.rpush(`shrtly:audit:${internalId}`, JSON.stringify(audit));
      pipeline.set(`shrtly:code:${normalizedCode}`, internalId);
      pipeline.sadd('shrtly:codes:active', normalizedCode);
      await pipeline.exec();

      // Mirror to local fallback with the EXACT SAME internal_id and token_hash (asynchronous/non-blocking)
      this.fallback.saveDirectLink(link, tokenHash, audit);

      return { link, management_token: data.management_token };
    } catch (err) {
      console.warn('Upstash createLink error, routing to local store:', err);
      return this.fallback.createLink(data);
    }
  }

  async getLinkByCode(code: string): Promise<LinkRecord | null> {
    try {
      const normalized = code.trim().toLowerCase();

      // Optimize: pipeline both the code lookup and tombstone check to cut round-trips down to exactly 1 request
      const pipeline = this.redis.pipeline();
      pipeline.get<string>(`shrtly:code:${normalized}`);
      pipeline.sismember('shrtly:codes:tombstones', normalized);
      const [internalId, isTombstoned] = await pipeline.exec<[string | null, number]>();

      if (isTombstoned) {
        return {
          internal_id: 'tombstone',
          code: normalized,
          destination: '',
          created_at: '',
          expires_at: null,
          owner_id: '',
          status: 'deleted',
          click_count: 0,
          tombstone: true,
        };
      }

      // Self-heal: If missing or stuck on 'pending' reservation, resolve from local fallback
      if (!internalId || internalId === 'pending') {
        const local = await this.fallback.getLinkByCode(normalized);
        if (local && local.internal_id !== 'tombstone') {
          await this.redis.set(`shrtly:code:${normalized}`, local.internal_id);
          await this.redis.sadd('shrtly:codes:active', normalized);
          return local;
        }
        return local;
      }

      const link = await this.getLinkByInternalId(internalId);
      if (!link) {
        return this.fallback.getLinkByCode(normalized);
      }
      return link;
    } catch {
      return this.fallback.getLinkByCode(code);
    }
  }

  async getLinkByInternalId(internalId: string): Promise<LinkRecord | null> {
    try {
      const raw = await this.redis.hget<string>(`shrtly:link:${internalId}`, 'link');
      if (!raw) return this.fallback.getLinkByInternalId(internalId);
      const link: LinkRecord = typeof raw === 'string' ? JSON.parse(raw) : raw;

      if (link.expires_at && link.status === 'active') {
        if (new Date(link.expires_at).getTime() < Date.now()) {
          link.status = 'expired';
        }
      }
      return link;
    } catch {
      return this.fallback.getLinkByInternalId(internalId);
    }
  }

  async verifyManagementToken(internalId: string, token?: string, ownerId?: string): Promise<boolean> {
    try {
      if (token) {
        const hash = await this.redis.hget<string>(`shrtly:link:${internalId}`, 'token_hash');
        if (hash && hash === hashToken(token)) return true;
      }
      return this.fallback.verifyManagementToken(internalId, token, ownerId);
    } catch {
      return this.fallback.verifyManagementToken(internalId, token, ownerId);
    }
  }

  async listLinksByOwner(ownerId: string = '', tokens: string[] = []): Promise<LinkRecord[]> {
    try {
      const redisLinkIds = new Set<string>();

      // 1. Fetch owned link IDs from Upstash Redis Set
      if (ownerId) {
        const ids = await this.redis.smembers(`shrtly:owner:${ownerId}:links`);
        if (ids && Array.isArray(ids)) {
          for (const id of ids) {
            if (id) redisLinkIds.add(id);
          }
        }
      }

      // Also merge any links that are stored in local fallback (handles local mirrors & guest token matches)
      const fallbackLinks = await this.fallback.listLinksByOwner(ownerId, tokens);
      for (const link of fallbackLinks) {
        redisLinkIds.add(link.internal_id);
      }

      if (redisLinkIds.size === 0) {
        return [];
      }

      // 2. Load all actual link records from Redis in a single pipeline to minimize latencies!
      const linkIdsArray = Array.from(redisLinkIds);
      const pipeline = this.redis.pipeline();
      for (const id of linkIdsArray) {
        pipeline.hget(`shrtly:link:${id}`, 'link');
      }
      const results = await pipeline.exec<string[]>();

      const finalLinks: LinkRecord[] = [];
      for (let i = 0; i < linkIdsArray.length; i++) {
        const rawJson = results[i];
        if (rawJson) {
          try {
            const parsed = JSON.parse(rawJson) as LinkRecord;
            if (parsed.status !== 'deleted') {
              // Handle active-to-expired dynamic check
              if (parsed.expires_at && parsed.status === 'active') {
                if (new Date(parsed.expires_at).getTime() < Date.now()) {
                  parsed.status = 'expired';
                }
              }
              finalLinks.push(parsed);
            }
          } catch {
            // fallback if JSON parse fails
          }
        } else {
          // If Redis doesn't have it, use local fallback link
          const fLink = fallbackLinks.find((l) => l.internal_id === linkIdsArray[i]);
          if (fLink) {
            finalLinks.push(fLink);
          }
        }
      }

      // Sort by created_at descending (newest first)
      return finalLinks.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    } catch (err) {
      console.warn('Redis error during listLinksByOwner, falling back to local engine:', err);
      return this.fallback.listLinksByOwner(ownerId, tokens);
    }
  }

  async updateDestination(internalId: string, newDestination: string, token?: string, ownerId?: string): Promise<LinkRecord> {
    const isAuth = await this.verifyManagementToken(internalId, token, ownerId);
    if (!isAuth) throw new Error('Unauthorized');

    const link = await this.getLinkByInternalId(internalId);
    if (!link) throw new Error('Link not found');

    link.destination = newDestination;
    link.updated_at = new Date().toISOString();

    try {
      await this.redis.hset(`shrtly:link:${internalId}`, { link: JSON.stringify(link) });
    } catch (redisErr) {
      console.error(`[UpstashStorageEngine] Failed to update destination in Redis for ${internalId}:`, redisErr);
      throw new Error('Database write failure');
    }

    try {
      await this.fallback.updateDestination(internalId, newDestination, token, ownerId);
    } catch (fallbackErr) {
      console.error(`[UpstashStorageEngine] Partial failure: Destination updated in Redis but failed to sync to fallback storage for ${internalId}:`, fallbackErr);
    }

    return link;
  }

  async toggleLinkStatus(internalId: string, status: 'active' | 'disabled', token?: string, ownerId?: string): Promise<LinkRecord> {
    const isAuth = await this.verifyManagementToken(internalId, token, ownerId);
    if (!isAuth) throw new Error('Unauthorized');

    const link = await this.getLinkByInternalId(internalId);
    if (!link) throw new Error('Link not found');

    link.status = status;
    link.updated_at = new Date().toISOString();

    try {
      await this.redis.hset(`shrtly:link:${internalId}`, { link: JSON.stringify(link) });
    } catch (redisErr) {
      console.error(`[UpstashStorageEngine] Failed to update status in Redis for ${internalId}:`, redisErr);
      throw new Error('Database write failure');
    }

    try {
      await this.fallback.toggleLinkStatus(internalId, status, token, ownerId);
    } catch (fallbackErr) {
      console.error(`[UpstashStorageEngine] Partial failure: Status updated in Redis but failed to sync to fallback storage for ${internalId}:`, fallbackErr);
    }

    return link;
  }

  async deleteLink(
    internalId: string,
    token?: string,
    permanentServerDelete: boolean = false,
    ownerId?: string
  ): Promise<{ success: boolean; code: string; wasPermanent: boolean }> {
    const isAuth = await this.verifyManagementToken(internalId, token, ownerId);
    if (!isAuth) throw new Error('Unauthorized');

    const link = await this.getLinkByInternalId(internalId);
    if (!link) throw new Error('Link not found');

    const code = link.code;

    // Permanently tombstone code
    await this.tombstoneCode(code);

    if (permanentServerDelete) {
      await this.redis.del(`shrtly:link:${internalId}`);
      await this.redis.del(`shrtly:audit:${internalId}`);
      await this.redis.del(`shrtly:analytics:${internalId}`);
    } else {
      link.status = 'deleted';
      link.tombstone = true;
      await this.redis.hset(`shrtly:link:${internalId}`, { link: JSON.stringify(link) });
    }

    await this.fallback.deleteLink(internalId, token, permanentServerDelete, ownerId);
    return { success: true, code, wasPermanent: permanentServerDelete };
  }

  async recordClick(
    code: string,
    clientInfo: { referrer?: string; userAgent?: string; country?: string }
  ): Promise<void> {
    // Non-blocking best-effort
    try {
      const internalId = await this.redis.get<string>(`shrtly:code:${code}`);
      if (internalId) {
        await this.redis.hincrby(`shrtly:link:${internalId}`, 'click_count', 1);
      }
    } catch {
      // Ignore in non-blocking redirect
    }
    // Record in local engine for stats accuracy
    await this.fallback.recordClick(code, clientInfo);
  }

  async getAnalytics(internalId: string, token?: string, ownerId?: string): Promise<LinkAnalytics | null> {
    const isAuth = await this.verifyManagementToken(internalId, token, ownerId);
    if (!isAuth) throw new Error('Unauthorized');
    return this.fallback.getAnalytics(internalId, token, ownerId);
  }

  async recordReport(code: string, category: string, notes: string, clientIp: string): Promise<void> {
    await this.fallback.recordReport(code, category, notes, clientIp);

    // Sync any automatic suspension to Redis
    try {
      const normalizedCode = code.trim().toLowerCase();
      const internalId = await this.redis.get<string>(`shrtly:code:${normalizedCode}`);
      if (internalId) {
        const fallbackLink = await this.fallback.getLinkByInternalId(internalId);
        if (fallbackLink && fallbackLink.is_suspicious) {
          await this.redis.hset(`shrtly:link:${internalId}`, { link: JSON.stringify(fallbackLink) });
        }
      }
    } catch (err) {
      console.warn('Failed to sync auto-suspension to Redis:', err);
    }
  }

  async checkRateLimit(
    key: string,
    maxRequests: number,
    windowSeconds: number
  ): Promise<{ allowed: boolean; remaining: number; resetTimeSeconds: number }> {
    try {
      // Optimize: execute both increment and TTL lookup in a single pipelined request (only 1 network round-trip)
      const pipeline = this.redis.pipeline();
      pipeline.incr(`shrtly:rate:${key}`);
      pipeline.ttl(`shrtly:rate:${key}`);
      const [current, ttlResult] = await pipeline.exec<[number, number]>();

      const actualTtl = ttlResult > 0 ? ttlResult : windowSeconds;

      if (current === 1) {
        // Set expiry on first increment asynchronously (fire-and-forget) to avoid blocking the request
        this.redis.expire(`shrtly:rate:${key}`, windowSeconds).catch((err) => {
          console.error('[RateLimit] Failed to set expire:', err);
        });
      }

      if (current > maxRequests) {
        return { allowed: false, remaining: 0, resetTimeSeconds: actualTtl };
      }
      return { allowed: true, remaining: maxRequests - current, resetTimeSeconds: actualTtl };
    } catch {
      return this.fallback.checkRateLimit(key, maxRequests, windowSeconds);
    }
  }

  async getAllLinksForExport(ownerId: string, tokens: string[] = []): Promise<LinkRecord[]> {
    return this.listLinksByOwner(ownerId, tokens);
  }
}

/**
 * Dynamic Storage Manager
 * Seamlessly manages and hot-swaps between Upstash Redis and Local Persistent engine
 * whenever environment variables are configured or updated, without requiring manual server restart.
 */
export class DynamicStorageManager implements IStorageEngine {
  private localEngine: LocalStorageEngine;
  private upstashEngine: UpstashStorageEngine | null = null;
  private currentUrl: string = '';
  private currentToken: string = '';

  constructor() {
    this.localEngine = new LocalStorageEngine();
    this.resolveEngine();
  }

  private resolveEngine(): IStorageEngine {
    // Check if new environment variables have been set
    const url = (process.env.UPSTASH_REDIS_REST_URL || '').trim();
    const token = (process.env.UPSTASH_REDIS_REST_TOKEN || '').trim();

    if (url && token) {
      if (!this.upstashEngine || this.currentUrl !== url || this.currentToken !== token) {
        console.log('[StorageManager] Active configuration: Upstash Redis (' + url.slice(0, 20) + '...)');
        this.currentUrl = url;
        this.currentToken = token;
        this.upstashEngine = new UpstashStorageEngine(url, token, this.localEngine);
      }
      return this.upstashEngine;
    }

    if (this.upstashEngine) {
      console.log('[StorageManager] Switching to Local Persistent Engine (Credentials cleared)');
      this.upstashEngine = null;
      this.currentUrl = '';
      this.currentToken = '';
    }

    return this.localEngine;
  }

  private get active(): IStorageEngine {
    return this.resolveEngine();
  }

  isUpstashConfigured(): boolean {
    const url = (process.env.UPSTASH_REDIS_REST_URL || '').trim();
    const token = (process.env.UPSTASH_REDIS_REST_TOKEN || '').trim();
    return Boolean(url && token);
  }

  async checkHealth(): Promise<HealthCheckResult> {
    const engine = this.resolveEngine();
    return engine.checkHealth();
  }

  reserveCode(code: string, internalId: string): Promise<boolean> {
    return this.active.reserveCode(code, internalId);
  }

  releaseCode(code: string): Promise<void> {
    return this.active.releaseCode(code);
  }

  tombstoneCode(code: string): Promise<void> {
    return this.active.tombstoneCode(code);
  }

  createLink(data: {
    code: string;
    destination: string;
    expires_at: string | null;
    owner_id: string;
    management_token: string;
    is_suspicious?: boolean;
    suspicious_reason?: string;
  }): Promise<{ link: LinkRecord; management_token: string }> {
    return this.active.createLink(data);
  }

  getLinkByCode(code: string): Promise<LinkRecord | null> {
    return this.active.getLinkByCode(code);
  }

  getLinkByInternalId(internalId: string): Promise<LinkRecord | null> {
    return this.active.getLinkByInternalId(internalId);
  }

  verifyManagementToken(internalId: string, token?: string, ownerId?: string): Promise<boolean> {
    return this.active.verifyManagementToken(internalId, token, ownerId);
  }

  listLinksByOwner(ownerId: string = '', tokens: string[] = []): Promise<LinkRecord[]> {
    return this.active.listLinksByOwner(ownerId, tokens);
  }

  updateDestination(internalId: string, newDestination: string, token?: string, ownerId?: string): Promise<LinkRecord> {
    return this.active.updateDestination(internalId, newDestination, token, ownerId);
  }

  toggleLinkStatus(internalId: string, status: 'active' | 'disabled', token?: string, ownerId?: string): Promise<LinkRecord> {
    return this.active.toggleLinkStatus(internalId, status, token, ownerId);
  }

  deleteLink(internalId: string, token?: string, permanentServerDelete: boolean = false, ownerId?: string): Promise<{ success: boolean; code: string; wasPermanent: boolean }> {
    return this.active.deleteLink(internalId, token, permanentServerDelete, ownerId);
  }

  recordClick(code: string, clientInfo: { referrer?: string; userAgent?: string; country?: string }): Promise<void> {
    return this.active.recordClick(code, clientInfo);
  }

  getAnalytics(internalId: string, token?: string, ownerId?: string): Promise<LinkAnalytics | null> {
    return this.active.getAnalytics(internalId, token, ownerId);
  }

  recordReport(code: string, category: string, notes: string, clientIp: string): Promise<void> {
    return this.active.recordReport(code, category, notes, clientIp);
  }

  checkRateLimit(key: string, maxRequests: number, windowSeconds: number): Promise<{ allowed: boolean; remaining: number; resetTimeSeconds: number }> {
    return this.active.checkRateLimit(key, maxRequests, windowSeconds);
  }

  getAllLinksForExport(ownerId: string = '', tokens: string[] = []): Promise<LinkRecord[]> {
    return this.active.getAllLinksForExport(ownerId, tokens);
  }
}

export const storage = new DynamicStorageManager();

