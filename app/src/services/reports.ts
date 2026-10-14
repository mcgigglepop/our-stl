import type { CivicIssue } from './civicRouting';

const API_BASE = (process.env.EXPO_PUBLIC_API_BASE_URL ?? '').replace(/\/$/, '');

if (!API_BASE) {
  console.warn('EXPO_PUBLIC_API_BASE_URL is not set — civic report submission will fail.');
}

export type AnalyzeResult =
  | { kind: 'rejected'; reason: string }
  | {
      kind: 'ok';
      category: CivicIssue | null;
      confidence: 'high' | 'medium' | 'low';
      description: string;
      locationLabel: string;
    };

export interface Report {
  reportId: string;
  userId: string;
  status: string;
  category: CivicIssue;
  description: string;
  locationLabel: string;
  latitude: number;
  longitude: number;
  s3Key: string;
  createdAt: string;
  thumbnailUrl?: string;
}

interface ApiOptions {
  idToken: string;
  signal?: AbortSignal;
}

async function apiFetch<T>(
  path: string,
  init: RequestInit & ApiOptions
): Promise<T> {
  const { idToken, signal, headers, ...rest } = init;
  const res = await fetch(`${API_BASE}${path}`, {
    ...rest,
    signal,
    headers: {
      authorization: `Bearer ${idToken}`,
      'content-type': 'application/json',
      ...(headers ?? {}),
    },
  });
  const text = await res.text();
  const body = text ? (JSON.parse(text) as unknown) : {};
  if (!res.ok) {
    const message = (body as { message?: string; error?: string }).message
      ?? (body as { error?: string }).error
      ?? `Request failed (${res.status})`;
    throw new Error(message);
  }
  return body as T;
}

export async function requestUploadUrl(opts: ApiOptions): Promise<{ putUrl: string; s3Key: string }> {
  return apiFetch<{ putUrl: string; s3Key: string }>('/uploads/presign', {
    method: 'POST',
    idToken: opts.idToken,
    signal: opts.signal,
  });
}

export async function uploadPhoto(putUrl: string, uri: string, signal?: AbortSignal): Promise<void> {
  // The presigned URL is signed with just Bucket+Key, so no extra headers are
  // required on the client side. Fetching the local file as a Blob and
  // PUTting it keeps the request shape minimal.
  const fileRes = await fetch(uri);
  const blob = await fileRes.blob();
  const res = await fetch(putUrl, {
    method: 'PUT',
    body: blob,
    signal,
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new Error(`Upload failed (${res.status})${detail ? `: ${detail.slice(0, 200)}` : ''}`);
  }
}

export async function analyzeReport(input: {
  idToken: string;
  s3Key: string;
  latitude: number;
  longitude: number;
  signal?: AbortSignal;
}): Promise<AnalyzeResult> {
  return apiFetch<AnalyzeResult>('/reports/analyze', {
    method: 'POST',
    body: JSON.stringify({
      s3Key: input.s3Key,
      latitude: input.latitude,
      longitude: input.longitude,
    }),
    idToken: input.idToken,
    signal: input.signal,
  });
}

export async function createReport(input: {
  idToken: string;
  s3Key: string;
  category: CivicIssue;
  description: string;
  locationLabel: string;
  latitude: number;
  longitude: number;
  signal?: AbortSignal;
}): Promise<{ report: Report }> {
  return apiFetch<{ report: Report }>('/reports', {
    method: 'POST',
    body: JSON.stringify({
      s3Key: input.s3Key,
      category: input.category,
      description: input.description,
      locationLabel: input.locationLabel,
      latitude: input.latitude,
      longitude: input.longitude,
    }),
    idToken: input.idToken,
    signal: input.signal,
  });
}

export async function listMyReports(opts: ApiOptions): Promise<{ reports: Report[] }> {
  return apiFetch<{ reports: Report[] }>('/reports/mine', {
    method: 'GET',
    idToken: opts.idToken,
    signal: opts.signal,
  });
}
