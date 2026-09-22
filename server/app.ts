import express, { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { storage } from './storage';
import {
  validateAndNormalizeUrl,
  validateCustomAlias,
  generateShortCode,
  RESERVED_WORDS,
} from './urlUtils';
import { LinkCreatePayload, HealthStatus } from '../src/types';

const app = express();
app.set('trust proxy', 1);

const startTime = Date.now();

app.use(express.json());

// Security headers middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // Strict HSTS for production (only when connection is HTTPS or via reverse proxy)
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');

  // Robust Content-Security-Policy supporting fonts from Google/Gstatic and standard source assets
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self';"
  );
  next();
});

// Helper to get client IP
function getClientIp(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') {
    return forwarded.split(',')[0].trim();
  }
  const realIp = req.headers['x-real-ip'];
  if (typeof realIp === 'string') {
    return realIp.trim();
  }
  return req.socket.remoteAddress || '127.0.0.1';
}

// -------------------------------------------------------------
// API ROUTES
// -------------------------------------------------------------

// Health & observability
app.get('/api/health', async (req: Request, res: Response) => {
  const healthData = await storage.checkHealth();
  const response: HealthStatus = {
    status: healthData.connected ? 'ok' : 'degraded',
    timestamp: new Date().toISOString(),
    uptime_seconds: Math.floor((Date.now() - startTime) / 1000),
    storage: {
      engine: healthData.engine,
      connected: healthData.connected,
      total_links: healthData.total_links,
      total_tombstones: healthData.total_tombstones,
      latency_ms: healthData.latency_ms,
      redis_configured: healthData.redis_configured,
      detail_message: healthData.detail_message,
    },
    version: '1.0.0',
  };
  res.json(response);
});

// Create Link
app.post('/api/links', async (req: Request, res: Response) => {
  const clientIp = getClientIp(req);

  // Rate limiting: 30 creates per minute per IP
  const rateCheck = await storage.checkRateLimit(`create:${clientIp}`, 30, 60);
  if (!rateCheck.allowed) {
    res.status(429).json({
      error: {
        code: 'RATE_LIMITED',
        message: `Too many link creations. Please try again in ${rateCheck.resetTimeSeconds} seconds.`,
      },
    });
    return;
  }

  const { url, custom_alias, expires_in, custom_expires_at, owner_id } = req.body as LinkCreatePayload;

  if (!url) {
    res.status(400).json({
      error: {
        code: 'MISSING_URL',
        message: 'Destination URL is required.',
      },
    });
    return;
  }

  // Validate URL
  const valResult = validateAndNormalizeUrl(url);
  if (!valResult.isValid || !valResult.normalizedUrl) {
    res.status(400).json({
      error: {
        code: 'INVALID_URL',
        message: valResult.error || 'The provided URL is invalid.',
      },
    });
    return;
  }

  // Compute Expiration
  let expiresAt: string | null = null;
  const now = Date.now();
  if (expires_in === '1h') {
    expiresAt = new Date(now + 60 * 60 * 1000).toISOString();
  } else if (expires_in === '24h') {
    expiresAt = new Date(now + 24 * 60 * 60 * 1000).toISOString();
  } else if (expires_in === '7d') {
    expiresAt = new Date(now + 7 * 24 * 60 * 60 * 1000).toISOString();
  } else if (expires_in === '30d') {
    expiresAt = new Date(now + 30 * 24 * 60 * 60 * 1000).toISOString();
  } else if (expires_in === 'custom' && custom_expires_at) {
    const parsedCustom = new Date(custom_expires_at).getTime();
    if (isNaN(parsedCustom) || parsedCustom <= now) {
      res.status(400).json({
        error: {
          code: 'INVALID_URL',
          message: 'Custom expiration date must be a valid future date.',
        },
      });
      return;
    }
    expiresAt = new Date(parsedCustom).toISOString();
  }

  // Resolve Short Code / Alias
  let code = '';
  if (custom_alias && custom_alias.trim().length > 0) {
    const trimmedAlias = custom_alias.trim().toLowerCase();
    const aliasValidation = validateCustomAlias(trimmedAlias);
    if (!aliasValidation.isValid) {
      res.status(400).json({
        error: {
          code: RESERVED_WORDS.has(trimmedAlias) ? 'RESERVED_ALIAS' : 'INVALID_ALIAS',
          message: aliasValidation.error || 'Invalid custom alias.',
        },
      });
      return;
    }
    code = trimmedAlias;
    // Atomic reservation
    const reserved = await storage.reserveCode(code, 'pending');
    if (!reserved) {
      res.status(409).json({
        error: {
          code: 'ALIAS_TAKEN',
          message: `The alias "${code}" is already taken or was previously used.`,
        },
      });
      return;
    }
  } else {
    // Generate unique random code
    let attempts = 0;
    let reserved = false;
    while (attempts < 10 && !reserved) {
      const candidate = generateShortCode(6).toLowerCase();
      if (!RESERVED_WORDS.has(candidate)) {
        reserved = await storage.reserveCode(candidate, 'pending');
        if (reserved) {
          code = candidate;
          break;
        }
      }
      attempts++;
    }

    if (!reserved || !code) {
      res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Could not generate a unique short code. Please try again.',
        },
      });
      return;
    }
  }

  // Generate a high-entropy management token
  const managementToken = 'shrtly_sec_' + crypto.randomBytes(24).toString('hex');
  const finalOwnerId = owner_id && typeof owner_id === 'string' && owner_id.trim().length > 0
    ? owner_id.trim()
    : 'anon_' + crypto.randomBytes(12).toString('hex');

  try {
    const result = await storage.createLink({
      code,
      destination: valResult.normalizedUrl,
      expires_at: expiresAt,
      owner_id: finalOwnerId,
      management_token: managementToken,
      is_suspicious: valResult.isSuspicious,
      suspicious_reason: valResult.suspiciousReason,
    });

    const host = req.get('host') || 'localhost:3000';
    const protocol = req.protocol === 'https' || req.headers['x-forwarded-proto'] === 'https' ? 'https' : 'http';
    const shortUrl = `${protocol}://${host}/${code}`;

    res.status(201).json({
      link: result.link,
      management_token: result.management_token,
      short_url: shortUrl,
    });
  } catch (err) {
    console.error('Failed to create link:', err);
    // Release reserved code
    await storage.releaseCode(code).catch(() => {});
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to persist short link to database.',
      },
    });
  }
});

// List owner links - authenticated via owner_id and/or management tokens
app.get('/api/links', async (req: Request, res: Response) => {
  const ownerId = (req.headers['x-owner-id'] as string) || '';
  const tokensHeader = (req.headers['x-management-tokens'] as string) || '';
  const tokens = tokensHeader
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean);

  if (!ownerId && tokens.length === 0) {
    res.json({ links: [] });
    return;
  }

  try {
    const links = await storage.listLinksByOwner(ownerId, tokens);
    res.json({ links });
  } catch (err) {
    console.error('Failed to list links:', err);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Could not retrieve links.',
      },
    });
  }
});

// Get single link analytics & detail - accessible directly
app.get('/api/links/:id', async (req: Request, res: Response) => {
  const clientIp = getClientIp(req);

  // Rate limit: 60 analytics reads per minute per IP
  const rateCheck = await storage.checkRateLimit(`analytics:${clientIp}`, 60, 60);
  if (!rateCheck.allowed) {
    res.status(429).json({
      error: {
        code: 'RATE_LIMITED',
        message: 'Too many analytics requests. Please try again later.',
      },
    });
    return;
  }

  const { id } = req.params;
  const authHeader = req.headers['authorization'] || '';
  const tokenFromHeader = (req.headers['x-management-token'] as string) || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.substring(7).trim() : tokenFromHeader.trim();
  const ownerId = (req.headers['x-owner-id'] as string) || '';

  try {
    const analytics = await storage.getAnalytics(id, token, ownerId);
    if (!analytics) {
      res.status(404).json({
        error: {
          code: 'LINK_NOT_FOUND',
          message: 'Tautan tidak ditemukan.',
        },
      });
      return;
    }
    res.json({ analytics });
  } catch (err: any) {
    if (err?.message === 'Unauthorized') {
      res.status(403).json({
        error: {
          code: 'FORBIDDEN',
          message: 'Tidak memiliki izin untuk mengakses analitik tautan ini.',
        },
      });
      return;
    }
    console.error('Failed to get analytics:', err);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Gagal memuat analitik tautan.',
      },
    });
  }
});

// Update destination or toggle status
app.patch('/api/links/:id', async (req: Request, res: Response) => {
  const clientIp = getClientIp(req);

  // Rate limit: 20 edits per minute per IP
  const rateCheck = await storage.checkRateLimit(`edit:${clientIp}`, 20, 60);
  if (!rateCheck.allowed) {
    res.status(429).json({
      error: {
        code: 'RATE_LIMITED',
        message: 'Too many edit requests. Please try again later.',
      },
    });
    return;
  }

  const { id } = req.params;
  const authHeader = req.headers['authorization'] || '';
  const tokenFromHeader = (req.headers['x-management-token'] as string) || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.substring(7).trim() : tokenFromHeader.trim();
  const ownerId = (req.headers['x-owner-id'] as string) || '';

  const { destination, status } = req.body;

  try {
    let updatedLink;
    if (destination) {
      const valResult = validateAndNormalizeUrl(destination);
      if (!valResult.isValid || !valResult.normalizedUrl) {
        res.status(400).json({
          error: {
            code: 'INVALID_URL',
            message: valResult.error || 'New destination URL is invalid.',
          },
        });
        return;
      }
      updatedLink = await storage.updateDestination(id, valResult.normalizedUrl, token, ownerId);
    } else if (status === 'active' || status === 'disabled') {
      updatedLink = await storage.toggleLinkStatus(id, status, token, ownerId);
    } else {
      res.status(400).json({
        error: {
          code: 'INVALID_URL',
          message: 'Specify either new destination or status (active/disabled).',
        },
      });
      return;
    }

    res.json({ link: updatedLink });
  } catch (err: any) {
    if (err?.message === 'Unauthorized') {
      res.status(403).json({
        error: {
          code: 'FORBIDDEN',
          message: 'Tidak memiliki izin untuk mengubah tautan ini.',
        },
      });
      return;
    }
    if (err?.message === 'Link not found') {
      res.status(404).json({
        error: {
          code: 'LINK_NOT_FOUND',
          message: 'Link not found.',
        },
      });
      return;
    }
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Could not update link.',
      },
    });
  }
});

// Delete link
app.delete('/api/links/:id', async (req: Request, res: Response) => {
  const clientIp = getClientIp(req);

  // Rate limit: 20 deletions per minute per IP
  const rateCheck = await storage.checkRateLimit(`delete:${clientIp}`, 20, 60);
  if (!rateCheck.allowed) {
    res.status(429).json({
      error: {
        code: 'RATE_LIMITED',
        message: 'Too many delete requests. Please try again later.',
      },
    });
    return;
  }

  const { id } = req.params;
  const authHeader = req.headers['authorization'] || '';
  const tokenFromHeader = (req.headers['x-management-token'] as string) || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.substring(7).trim() : tokenFromHeader.trim();
  const ownerId = (req.headers['x-owner-id'] as string) || '';

  const permanent = req.query.permanent === 'true' || req.body?.permanent === true;

  try {
    const result = await storage.deleteLink(id, token, permanent, ownerId);
    res.json({
      success: true,
      code: result.code,
      permanent: result.wasPermanent,
      message: result.wasPermanent
        ? 'Link and data permanently deleted from server. Short code remains permanently tombstoned.'
        : 'Link removed from active list. Short code remains tombstoned.',
    });
  } catch (err: any) {
    if (err?.message === 'Unauthorized') {
      res.status(403).json({
        error: {
          code: 'FORBIDDEN',
          message: 'Tidak memiliki izin untuk menghapus tautan ini.',
        },
      });
      return;
    }
    res.status(500).json({
      error: {
        code: 'DELETE_FAILED',
        message: 'Server failed to delete the link. Please retry.',
      },
    });
  }
});

// Report abuse
app.post('/api/report', async (req: Request, res: Response) => {
  const clientIp = getClientIp(req);
  const rateCheck = await storage.checkRateLimit(`report:${clientIp}`, 10, 60);
  if (!rateCheck.allowed) {
    res.status(429).json({
      error: {
        code: 'RATE_LIMITED',
        message: 'Report rate limit reached. Please try again later.',
      },
    });
    return;
  }

  const { code, category, notes } = req.body;
  if (!code || !category) {
    res.status(400).json({
      error: {
        code: 'INVALID_URL',
        message: 'Code and category are required.',
      },
    });
    return;
  }

  await storage.recordReport(code, category, notes || '', clientIp);
  res.json({ success: true, message: 'Report submitted successfully. Thank you for keeping SHRTLY safe.' });
});

// Export links (JSON / CSV)
app.get('/api/export', async (req: Request, res: Response) => {
  const ownerId = (req.headers['x-owner-id'] as string) || '';
  const tokensHeader = (req.headers['x-management-tokens'] as string) || '';
  const tokens = tokensHeader
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean);
  const format = req.query.format === 'csv' ? 'csv' : 'json';

  if (!ownerId && tokens.length === 0) {
    if (format === 'csv') {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="shrtly-links.csv"');
      res.send('code,destination,created_at,expires_at,status,click_count\n');
      return;
    }
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename="shrtly-links.json"');
    res.json({ exported_at: new Date().toISOString(), total: 0, links: [] });
    return;
  }

  const links = await storage.getAllLinksForExport(ownerId, tokens);

  if (format === 'csv') {
    const headers = ['code', 'destination', 'created_at', 'expires_at', 'status', 'click_count'];
    const rows = links.map((l) => [
      `"${l.code}"`,
      `"${l.destination.replace(/"/g, '""')}"`,
      `"${l.created_at}"`,
      `"${l.expires_at || 'never'}"`,
      `"${l.status}"`,
      l.click_count,
    ]);
    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="shrtly-links.csv"');
    res.send(csvContent);
    return;
  }

  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', 'attachment; filename="shrtly-links.json"');
  res.json({ exported_at: new Date().toISOString(), total: links.length, links });
});

// -------------------------------------------------------------
// PUBLIC SHORT LINK REDIRECT (302) & STATUS HANDLERS
// -------------------------------------------------------------
app.get('/:code', async (req: Request, res: Response, next: NextFunction) => {
  const code = (req.params.code || '').trim().toLowerCase();

  // If this matches any known frontend route or static file, let Vite/SPA/Vercel static file handle it!
  if (RESERVED_WORDS.has(code) || code.includes('.')) {
    return next();
  }

  try {
    const link = await storage.getLinkByCode(code);

    if (!link) {
      // Unknown code -> route to SPA not found status
      return res.redirect(302, `/?status=unknown&code=${encodeURIComponent(code)}`);
    }

    if (link.tombstone || link.status === 'deleted') {
      return res.redirect(302, `/?status=deleted&code=${encodeURIComponent(code)}`);
    }

    if (link.status === 'disabled') {
      return res.redirect(302, `/?status=disabled&code=${encodeURIComponent(code)}`);
    }

    if (link.status === 'expired') {
      return res.redirect(302, `/?status=expired&code=${encodeURIComponent(code)}`);
    }

    // Suspicious destination check: show interstitial warning page
    if (link.is_suspicious) {
      return res.redirect(
        302,
        `/warning?code=${encodeURIComponent(code)}&dest=${encodeURIComponent(link.destination)}&target=${encodeURIComponent(
          link.destination
        )}&reason=${encodeURIComponent(link.suspicious_reason || 'Flagged for security review')}`
      );
    }

    // Active & valid: Asynchronously record click (non-blocking!)
    const userAgent = req.headers['user-agent'] || '';
    const referrer = req.headers['referer'] || '';
    const country = (req.headers['cf-ipcountry'] as string) || (req.headers['x-country'] as string) || (req.headers['x-vercel-ip-country'] as string) || 'Unknown';

    // Fire and forget - do not await
    storage.recordClick(code, { referrer, userAgent, country }).catch((err) => {
      console.warn('Background click recording error:', err);
    });

    // 302 Found redirect
    res.redirect(302, link.destination);
  } catch (err) {
    console.error('Redirect lookup error:', err);
    res.redirect(302, `/?status=error&code=${encodeURIComponent(code)}`);
  }
});

export { app };
export default app;
