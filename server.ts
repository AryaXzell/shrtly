import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import crypto from 'crypto';
import { createServer as createViteServer } from 'vite';
import { storage } from './server/storage';
import {
  validateAndNormalizeUrl,
  validateCustomAlias,
  generateShortCode,
  RESERVED_WORDS,
} from './server/urlUtils';
import { LinkCreatePayload, HealthStatus } from './src/types';

const app = express();
const PORT = 3000;
const startTime = Date.now();

app.use(express.json());

// Security headers middleware
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

// Helper to get client IP
function getClientIp(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') {
    return forwarded.split(',')[0].trim();
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
    const aliasValidation = validateCustomAlias(custom_alias);
    if (!aliasValidation.isValid) {
      res.status(400).json({
        error: {
          code: RESERVED_WORDS.has(custom_alias.toLowerCase()) ? 'RESERVED_ALIAS' : 'INVALID_ALIAS',
          message: aliasValidation.error || 'Invalid custom alias.',
        },
      });
      return;
    }
    code = custom_alias.trim();
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
      const candidate = generateShortCode(6);
      if (!RESERVED_WORDS.has(candidate.toLowerCase())) {
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
    const protocol = req.protocol;
    const shortUrl = `${protocol}://${host}/${code}`;

    res.status(201).json({
      link: result.link,
      management_token: result.management_token,
      short_url: shortUrl,
    });
  } catch (err) {
    console.error('Failed to create link:', err);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to persist short link to database.',
      },
    });
  }
});

// List owner links
app.get('/api/links', async (req: Request, res: Response) => {
  const ownerId = (req.headers['x-owner-id'] as string) || '';
  const tokensHeader = (req.headers['x-management-tokens'] as string) || '';
  const tokens = tokensHeader
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean);

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

// Get single link analytics & detail
app.get('/api/links/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  const authHeader = req.headers['authorization'] || '';
  const tokenFromHeader = (req.headers['x-management-token'] as string) || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.substring(7).trim() : tokenFromHeader.trim();

  if (!token) {
    res.status(401).json({
      error: {
        code: 'UNAUTHORIZED',
        message: 'Management token is required to access analytics.',
      },
    });
    return;
  }

  try {
    const analytics = await storage.getAnalytics(id, token);
    if (!analytics) {
      res.status(404).json({
        error: {
          code: 'LINK_NOT_FOUND',
          message: 'Link not found.',
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
          message: 'Invalid management token for this link.',
        },
      });
      return;
    }
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Could not fetch analytics.',
      },
    });
  }
});

// Update destination or toggle status
app.patch('/api/links/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  const authHeader = req.headers['authorization'] || '';
  const tokenFromHeader = (req.headers['x-management-token'] as string) || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.substring(7).trim() : tokenFromHeader.trim();

  if (!token) {
    res.status(401).json({
      error: {
        code: 'UNAUTHORIZED',
        message: 'Management token is required to modify this link.',
      },
    });
    return;
  }

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
      updatedLink = await storage.updateDestination(id, valResult.normalizedUrl, token);
    } else if (status === 'active' || status === 'disabled') {
      updatedLink = await storage.toggleLinkStatus(id, status, token);
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
          message: 'Invalid management token for this link.',
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
  const { id } = req.params;
  const authHeader = req.headers['authorization'] || '';
  const tokenFromHeader = (req.headers['x-management-token'] as string) || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.substring(7).trim() : tokenFromHeader.trim();

  if (!token) {
    res.status(401).json({
      error: {
        code: 'UNAUTHORIZED',
        message: 'Management token is required to delete this link.',
      },
    });
    return;
  }

  const permanent = req.query.permanent === 'true' || req.body?.permanent === true;

  try {
    const result = await storage.deleteLink(id, token, permanent);
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
          message: 'Invalid management token.',
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

// Claim anonymous link
app.post('/api/links/:id/claim', async (req: Request, res: Response) => {
  const { id } = req.params;
  const { new_owner_id, token } = req.body;

  if (!new_owner_id || !token) {
    res.status(400).json({
      error: {
        code: 'CLAIM_FAILED',
        message: 'Both new_owner_id and management token are required.',
      },
    });
    return;
  }

  try {
    const claimed = await storage.claimLink(id, new_owner_id, token);
    res.json({ success: true, link: claimed });
  } catch (err: any) {
    res.status(403).json({
      error: {
        code: 'CLAIM_FAILED',
        message: 'Could not claim link: unauthorized or invalid token.',
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
  const code = req.params.code.trim();

  // If this matches any known frontend route or static file, let Vite/SPA handle it!
  if (RESERVED_WORDS.has(code.toLowerCase()) || code.includes('.')) {
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
    const country = (req.headers['cf-ipcountry'] as string) || (req.headers['x-country'] as string) || 'Unknown';

    // Fire and forget - do not await
    storage.recordClick(code, { referrer, userAgent, country }).catch((err) => {
      console.warn('Background click recording error:', err);
    });

    // 302 Found redirect according to PRD section 24
    res.redirect(302, link.destination);
  } catch (err) {
    console.error('Redirect lookup error:', err);
    res.redirect(302, `/?status=error&code=${encodeURIComponent(code)}`);
  }
});

// -------------------------------------------------------------
// VITE SPA MIDDLEWARE / PRODUCTION STATIC FILES
// -------------------------------------------------------------
async function start() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`SHRTLY server running on http://0.0.0.0:${PORT}`);
  });
}

start();
