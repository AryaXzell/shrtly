const OWNER_ID_KEY = 'shrtly_owner_id';
const TOKENS_KEY = 'shrtly_management_tokens';

export interface TokenStore {
  [internalId: string]: string; // internal_id -> management_token
}

export function getOrCreateOwnerId(): string {
  if (typeof window === 'undefined') return '';
  let id = localStorage.getItem(OWNER_ID_KEY);
  if (!id) {
    id = 'anon_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    localStorage.setItem(OWNER_ID_KEY, id);
  }
  return id;
}

export function getSavedTokens(): TokenStore {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(TOKENS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function saveManagementToken(internalId: string, token: string): void {
  if (typeof window === 'undefined') return;
  const current = getSavedTokens();
  current[internalId] = token;
  localStorage.setItem(TOKENS_KEY, JSON.stringify(current));
}

export function removeManagementToken(internalId: string): void {
  if (typeof window === 'undefined') return;
  const current = getSavedTokens();
  delete current[internalId];
  localStorage.setItem(TOKENS_KEY, JSON.stringify(current));
}

export function getManagementTokenForLink(internalId: string): string | null {
  const current = getSavedTokens();
  return current[internalId] || null;
}

export function getAllTokensList(): string[] {
  const current = getSavedTokens();
  return Object.values(current);
}

export function clearAllLocalData(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(OWNER_ID_KEY);
  localStorage.removeItem(TOKENS_KEY);
}
