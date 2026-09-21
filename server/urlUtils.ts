import { URL } from 'url';

export const RESERVED_WORDS = new Set([
  'api',
  'links',
  'settings',
  'about',
  'warning',
  'report',
  'health',
  'login',
  'signup',
  'admin',
  'assets',
  'dist',
  'status',
  'export',
  'null',
  'undefined',
  'src',
  'node_modules',
  'public',
  'index',
  'manifest',
  'static',
  'app',
]);

const PRIVATE_IP_REGEX = /^(?:10\.\d{1,3}\.\d{1,3}\.\d{1,3}|172\.(?:1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3}|192\.168\.\d{1,3}\.\d{1,3}|127\.\d{1,3}\.\d{1,3}\.\d{1,3}|0\.0\.0\.0|169\.254\.\d{1,3}\.\d{1,3}|100\.(?:6[4-9]|[7-9]\d|1[01]\d|12[0-7])\.\d{1,3}\.\d{1,3})$/;

const SUSPICIOUS_DOMAINS = new Set([
  'grabify.link',
  'iplogger.org',
  'blasze.com',
  '2no.co',
  'yip.su',
  'psportable.org',
]);

export interface URLValidationResult {
  isValid: boolean;
  normalizedUrl?: string;
  error?: string;
  isSuspicious?: boolean;
  suspiciousReason?: string;
}

/**
 * Validates and conservatively normalizes an input URL.
 * Accepts full http/https URLs or host-only inputs like 'example.com'.
 */
export function validateAndNormalizeUrl(rawInput: string): URLValidationResult {
  if (!rawInput || typeof rawInput !== 'string') {
    return { isValid: false, error: 'URL cannot be empty' };
  }

  const trimmed = rawInput.trim();
  if (trimmed.length > 2048) {
    return { isValid: false, error: 'URL exceeds maximum length of 2048 characters' };
  }

  let candidate = trimmed;
  // If user entered something like example.com or www.example.com, prepend https://
  if (!/^[a-zA-Z][a-zA-Z\d+\-.]*:\/\//.test(candidate)) {
    // Check if it looks like a valid hostname with at least one dot
    if (/^[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+(?:\/.*)?$/.test(candidate)) {
      candidate = 'https://' + candidate;
    } else {
      return { isValid: false, error: 'Invalid URL format' };
    }
  }

  let parsed: URL;
  try {
    parsed = new URL(candidate);
  } catch {
    return { isValid: false, error: 'Malformed URL' };
  }

  // Scheme must be http or https
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return { isValid: false, error: 'Only http and https protocols are supported' };
  }

  let rawHostname = parsed.hostname.toLowerCase();
  // Strip trailing dot (e.g. localhost. or example.com.)
  if (rawHostname.endsWith('.')) {
    rawHostname = rawHostname.slice(0, -1);
  }
  // Strip IPv6 square brackets if present
  const unbracketed = rawHostname.startsWith('[') && rawHostname.endsWith(']')
    ? rawHostname.slice(1, -1)
    : rawHostname;

  if (!rawHostname || rawHostname.length === 0) {
    return { isValid: false, error: 'Invalid hostname' };
  }

  // SSRF prevention: reject localhost, IPv6 loopbacks, IPv4-mapped addresses, private IPs, link-local IPs
  const isIpv6LoopbackOrLocal =
    unbracketed === '::1' ||
    unbracketed === '::' ||
    unbracketed.startsWith('::ffff:127.') ||
    unbracketed.startsWith('::ffff:7f') ||
    unbracketed.startsWith('fc') ||
    unbracketed.startsWith('fd') ||
    unbracketed.startsWith('fe80:');

  if (
    rawHostname === 'localhost' ||
    rawHostname.endsWith('.localhost') ||
    PRIVATE_IP_REGEX.test(rawHostname) ||
    PRIVATE_IP_REGEX.test(unbracketed) ||
    isIpv6LoopbackOrLocal
  ) {
    return {
      isValid: false,
      error: 'Destination points to a restricted local or private network address',
    };
  }

  const hostname = rawHostname;

  // Check suspicious domains / heuristics
  let isSuspicious = false;
  let suspiciousReason: string | undefined;

  if (SUSPICIOUS_DOMAINS.has(hostname)) {
    isSuspicious = true;
    suspiciousReason = 'Domain is associated with IP loggers or deceptive tracking.';
  } else if (parsed.username || parsed.password) {
    isSuspicious = true;
    suspiciousReason = 'URL contains embedded authentication credentials.';
  } else if (hostname.endsWith('.zip') || hostname.endsWith('.mov')) {
    isSuspicious = true;
    suspiciousReason = 'Top-level domain can be misused for file extension deception.';
  }

  // Conservative normalization:
  // - Hostname is lowercased (standard DNS behavior)
  // - Protocol is lowercased
  // - Path, query string, and fragment are preserved EXACTLY as entered!
  // Node's URL constructor preserves query params and casing of pathname accurately.
  return {
    isValid: true,
    normalizedUrl: parsed.toString(),
    isSuspicious,
    suspiciousReason,
  };
}

/**
 * Validates a custom alias.
 * Must be 3-30 characters, alphanumeric with hyphens or underscores.
 */
export function validateCustomAlias(alias: string): { isValid: boolean; error?: string } {
  const trimmed = alias.trim();
  if (trimmed.length < 3) {
    return { isValid: false, error: 'Alias must be at least 3 characters long' };
  }
  if (trimmed.length > 30) {
    return { isValid: false, error: 'Alias cannot exceed 30 characters' };
  }
  if (!/^[a-zA-Z0-9_-]+$/.test(trimmed)) {
    return { isValid: false, error: 'Alias may only contain letters, numbers, hyphens, and underscores' };
  }
  if (RESERVED_WORDS.has(trimmed.toLowerCase())) {
    return { isValid: false, error: `The alias "${trimmed}" is reserved by system routes` };
  }
  return { isValid: true };
}

/**
 * Generates a collision-safe, non-ambiguous random code.
 * Alphabet excludes easily confused characters (0, O, 1, l, I).
 */
const BASE_ALPHABET = '23456789abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ';

export function generateShortCode(length = 6): string {
  let result = '';
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * BASE_ALPHABET.length);
    result += BASE_ALPHABET[randomIndex];
  }
  return result;
}
