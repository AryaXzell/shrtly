import {
  LinkRecord,
  LinkCreatePayload,
  LinkCreateResponse,
  LinkAnalytics,
  HealthStatus,
  ApiErrorResponse,
} from '../types';
import {
  getOrCreateOwnerId,
  saveManagementToken,
  getManagementTokenForLink,
  getAllTokensList,
  removeManagementToken,
} from './tokenStorage';

export async function checkHealth(): Promise<HealthStatus> {
  const res = await fetch('/api/health');
  if (!res.ok) {
    throw new Error('Health check failed');
  }
  return res.json();
}

export async function createShortLink(
  payload: Omit<LinkCreatePayload, 'owner_id'>
): Promise<LinkCreateResponse> {
  const ownerId = getOrCreateOwnerId();
  const res = await fetch('/api/links', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      ...payload,
      owner_id: ownerId,
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    const err = data as ApiErrorResponse;
    throw new Error(err?.error?.message || 'Failed to create short link');
  }

  // Save the management token locally (keyed by both internalId and code)
  saveManagementToken(data.link.internal_id, data.management_token, data.link.code);
  return data;
}

export async function listOwnerLinks(): Promise<LinkRecord[]> {
  const ownerId = getOrCreateOwnerId();
  const tokens = getAllTokensList();

  const res = await fetch('/api/links', {
    headers: {
      'x-owner-id': ownerId,
      'x-management-tokens': tokens.join(','),
    },
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.error?.message || 'Failed to list links');
  }
  return data.links;
}

export async function getLinkAnalytics(internalId: string, code?: string): Promise<LinkAnalytics> {
  const token = getManagementTokenForLink(internalId) || (code ? getManagementTokenForLink(code) : null);
  const ownerId = getOrCreateOwnerId();
  const headers: Record<string, string> = {
    'x-owner-id': ownerId,
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`/api/links/${internalId}`, {
    headers,
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.error?.message || 'Gagal memuat analitik tautan');
  }
  return data.analytics;
}

export async function updateLinkDestination(internalId: string, newDestination: string, code?: string): Promise<LinkRecord> {
  const token = getManagementTokenForLink(internalId) || (code ? getManagementTokenForLink(code) : null);
  const ownerId = getOrCreateOwnerId();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'x-owner-id': ownerId,
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`/api/links/${internalId}`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({ destination: newDestination }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.error?.message || 'Gagal memperbarui tautan');
  }
  return data.link;
}

export async function toggleLinkStatus(internalId: string, status: 'active' | 'disabled', code?: string): Promise<LinkRecord> {
  const token = getManagementTokenForLink(internalId) || (code ? getManagementTokenForLink(code) : null);
  const ownerId = getOrCreateOwnerId();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'x-owner-id': ownerId,
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`/api/links/${internalId}`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({ status }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.error?.message || 'Gagal mengubah status tautan');
  }
  return data.link;
}

export async function deleteLink(
  internalId: string,
  permanentServerDelete: boolean,
  code?: string
): Promise<{ success: boolean; code: string; wasPermanent: boolean; message: string }> {
  const token = getManagementTokenForLink(internalId) || (code ? getManagementTokenForLink(code) : null);
  const ownerId = getOrCreateOwnerId();
  const headers: Record<string, string> = {
    'x-owner-id': ownerId,
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`/api/links/${internalId}?permanent=${permanentServerDelete}`, {
    method: 'DELETE',
    headers,
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.error?.message || 'Gagal menghapus tautan');
  }

  // Remove local management token if permanently deleted
  if (permanentServerDelete) {
    removeManagementToken(internalId, code);
  }
  return data;
}

export async function reportLinkAbuse(code: string, category: string, notes: string): Promise<void> {
  const res = await fetch('/api/report', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code, category, notes }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.error?.message || 'Failed to submit report');
  }
}
