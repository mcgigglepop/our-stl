// OurSTL API — Stage B.
// Real logic: S3 presign, Rekognition moderation, Bedrock Claude vision for
// classify+describe, Location Service reverse geocode, DynamoDB persistence.
//
// Node 20 Lambda runtime includes @aws-sdk/* v3 modules; no node_modules
// shipped. Keep this file dep-free beyond those.

import { randomUUID } from 'node:crypto';

import {
  CopyObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { RekognitionClient, DetectModerationLabelsCommand } from '@aws-sdk/client-rekognition';
import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';
import { LocationClient, SearchPlaceIndexForPositionCommand } from '@aws-sdk/client-location';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DeleteCommand,
  DynamoDBDocumentClient,
  PutCommand,
  QueryCommand,
} from '@aws-sdk/lib-dynamodb';

// ─── Config ───────────────────────────────────────────────────────────────

const REGION = process.env.AWS_REGION;
const BUCKET = process.env.REPORTS_BUCKET;
const TABLE = process.env.REPORTS_TABLE;
const PLACE_INDEX = process.env.PLACE_INDEX_NAME;
const BEDROCK_MODEL = process.env.BEDROCK_MODEL_ID;

const CIVIC_CATEGORIES = [
  'Pothole',
  'Illegal dumping',
  'Graffiti',
  'Streetlight problem',
  'Damaged sidewalk',
  'Overgrown tree',
  'Unsafe building',
  'Water service issue',
];

const COMMUNITY_POST_KINDS = ['issue', 'good', 'event'];

const EARTH_MILES = 3958.8;

function haversineMiles(a, b) {
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_MILES * Math.asin(Math.min(1, Math.sqrt(h)));
}

// ─── Clients ──────────────────────────────────────────────────────────────

const s3 = new S3Client({ region: REGION });
const rekognition = new RekognitionClient({ region: REGION });
const bedrock = new BedrockRuntimeClient({ region: REGION });
const location = new LocationClient({ region: REGION });
const dynamo = DynamoDBDocumentClient.from(new DynamoDBClient({ region: REGION }));

// ─── HTTP helpers ─────────────────────────────────────────────────────────

const json = (statusCode, body) => ({
  statusCode,
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify(body),
});

function parseBody(event) {
  if (!event.body) return {};
  const raw = event.isBase64Encoded ? Buffer.from(event.body, 'base64').toString('utf8') : event.body;
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function getUserId(event) {
  return event?.requestContext?.authorizer?.jwt?.claims?.sub ?? null;
}

function getAuthorDisplay(event) {
  const claims = event?.requestContext?.authorizer?.jwt?.claims ?? {};
  const name = typeof claims.name === 'string' ? claims.name.trim() : '';
  if (name) return name;
  const email = typeof claims.email === 'string' ? claims.email.trim() : '';
  if (email) return email.split('@')[0];
  return 'Anonymous';
}

function badRequest(message) {
  return json(400, { error: 'bad_request', message });
}

function serverError(err) {
  console.error('Internal error', err);
  return json(500, { error: 'internal_error', message: err?.message ?? String(err) });
}

// ─── ID generation ────────────────────────────────────────────────────────
// Padded-timestamp + short UUID → lexicographic sort = time ascending.
// Query with ScanIndexForward:false to get newest first.

function makeReportId() {
  const ts = Date.now().toString().padStart(13, '0');
  const suffix = randomUUID().replace(/-/g, '').slice(0, 8);
  return `${ts}-${suffix}`;
}

// ─── POST /uploads/presign ────────────────────────────────────────────────

async function presignHandler(event) {
  const userId = getUserId(event);
  if (!userId) return json(401, { error: 'unauthorized' });

  // Minimal signed PUT: no ContentType or Tagging, so the client can PUT
  // bytes without matching extra headers. The tmp/ prefix means the
  // lifecycle rule reaps the object in 7 days if we never promote it.
  const key = `tmp/${userId}/${randomUUID()}.jpg`;
  const command = new PutObjectCommand({ Bucket: BUCKET, Key: key });
  const putUrl = await getSignedUrl(s3, command, { expiresIn: 300 });

  return json(200, { putUrl, s3Key: key });
}

// ─── POST /reports/analyze ────────────────────────────────────────────────

async function fetchS3Bytes(key) {
  const res = await s3.send(new GetObjectCommand({ Bucket: BUCKET, Key: key }));
  const chunks = [];
  for await (const chunk of res.Body) chunks.push(chunk);
  return Buffer.concat(chunks);
}

async function moderate(key) {
  const res = await rekognition.send(
    new DetectModerationLabelsCommand({
      Image: { S3Object: { Bucket: BUCKET, Name: key } },
      MinConfidence: 60,
    })
  );
  const labels = res.ModerationLabels ?? [];
  if (labels.length === 0) return { ok: true };
  const top = labels[0];
  return {
    ok: false,
    reason: `This photo was flagged as "${top.Name}" (${Math.round(top.Confidence)}% confidence). Please upload a civic-issue photo only.`,
  };
}

async function classifyAndDescribe(imageBytes) {
  const base64 = imageBytes.toString('base64');
  const prompt = `You are triaging a civic issue report for the City of St. Louis.
Look at the photo and respond with ONLY a JSON object matching this schema (no prose, no code fences):
{
  "category": one of ${JSON.stringify(CIVIC_CATEGORIES)} or null if none fit,
  "confidence": "high" | "medium" | "low",
  "description": "1 to 2 sentences, factual, only what is directly observable, no speculation"
}`;

  const body = {
    anthropic_version: 'bedrock-2023-05-31',
    max_tokens: 400,
    messages: [
      {
        role: 'user',
        content: [
          { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: base64 } },
          { type: 'text', text: prompt },
        ],
      },
    ],
  };

  const res = await bedrock.send(
    new InvokeModelCommand({
      modelId: BEDROCK_MODEL,
      contentType: 'application/json',
      accept: 'application/json',
      body: Buffer.from(JSON.stringify(body)),
    })
  );
  const payload = JSON.parse(Buffer.from(res.body).toString('utf8'));
  const text = payload?.content?.[0]?.text ?? '';

  // Claude sometimes wraps JSON in code fences despite instructions.
  const stripped = text.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '').trim();
  try {
    const parsed = JSON.parse(stripped);
    const category = CIVIC_CATEGORIES.includes(parsed.category) ? parsed.category : null;
    const confidence = ['high', 'medium', 'low'].includes(parsed.confidence) ? parsed.confidence : 'low';
    const description = typeof parsed.description === 'string' ? parsed.description.slice(0, 500) : '';
    return { category, confidence, description };
  } catch (err) {
    console.error('Failed to parse Bedrock response', { text, err });
    return { category: null, confidence: 'low', description: '' };
  }
}

function cleanLabel(raw) {
  if (!raw) return '';
  // Esri returns labels like "1200 Market St, Saint Louis, MO 63103, USA".
  // Strip the trailing country and collapse whitespace.
  return raw.replace(/,\s*USA\s*$/, '').replace(/\s+/g, ' ').trim();
}

async function reverseGeocode(latitude, longitude) {
  try {
    const res = await location.send(
      new SearchPlaceIndexForPositionCommand({
        IndexName: PLACE_INDEX,
        Position: [longitude, latitude],
        MaxResults: 1,
      })
    );
    const place = res.Results?.[0]?.Place;
    if (!place) return `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;

    const num = (place.AddressNumber ?? '').trim();
    const street = (place.Street ?? '').trim();
    const city = (place.Municipality ?? '').trim();
    const region = (place.Region ?? '').trim();
    const neighborhood = (place.Neighborhood ?? '').trim();

    // Only claim a street address when Esri actually gave us a street name.
    // An AddressNumber alone (common for interpolated geocodes) is useless to
    // the user — "1200" doesn't locate anything without the street.
    if (street) {
      const streetPart = num ? `${num} ${street}` : street;
      if (city) return `${streetPart}, ${city}`;
      return streetPart;
    }

    // No street — prefer the Label which usually contains the full line.
    const label = cleanLabel(place.Label);
    if (label) return label;

    // Last resort: compose from whatever locale fields exist.
    const localeParts = [neighborhood, city, region].filter(Boolean);
    if (localeParts.length > 0) return `Near ${localeParts.join(', ')}`;
    return `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
  } catch (err) {
    console.error('Geocode failed', err);
    return `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
  }
}

async function analyzeHandler(event) {
  const userId = getUserId(event);
  if (!userId) return json(401, { error: 'unauthorized' });

  const body = parseBody(event);
  const { s3Key, latitude, longitude } = body;
  if (!s3Key || typeof latitude !== 'number' || typeof longitude !== 'number') {
    return badRequest('s3Key, latitude, longitude required');
  }
  if (!s3Key.startsWith(`tmp/${userId}/`)) {
    return json(403, { error: 'forbidden', message: 'Key does not belong to the current user.' });
  }

  // 1. Moderation gate.
  const mod = await moderate(s3Key);
  if (!mod.ok) {
    await s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: s3Key })).catch(() => {});
    return json(200, { kind: 'rejected', reason: mod.reason });
  }

  // 2. Fetch bytes once; Bedrock needs them base64-encoded in the message.
  const imageBytes = await fetchS3Bytes(s3Key);

  // 3. Classify + describe (Bedrock) and geocode (Location Service) in parallel.
  const [visionRes, locationLabel] = await Promise.all([
    classifyAndDescribe(imageBytes),
    reverseGeocode(latitude, longitude),
  ]);

  return json(200, {
    kind: 'ok',
    category: visionRes.category,
    confidence: visionRes.confidence,
    description: visionRes.description,
    locationLabel,
  });
}

// ─── POST /reports ────────────────────────────────────────────────────────

async function createReportHandler(event) {
  const userId = getUserId(event);
  if (!userId) return json(401, { error: 'unauthorized' });

  const body = parseBody(event);
  const { s3Key, category, description, locationLabel, latitude, longitude, isPublic } = body;
  if (!s3Key || !category || typeof latitude !== 'number' || typeof longitude !== 'number') {
    return badRequest('s3Key, category, latitude, longitude required');
  }
  if (!s3Key.startsWith(`tmp/${userId}/`)) {
    return json(403, { error: 'forbidden', message: 'Key does not belong to the current user.' });
  }
  if (!CIVIC_CATEGORIES.includes(category)) {
    return badRequest(`category must be one of ${CIVIC_CATEGORIES.join(', ')}`);
  }

  const reportId = makeReportId();
  const createdAt = new Date().toISOString();
  const makePublic = isPublic === true;
  const authorDisplay = getAuthorDisplay(event);

  // Move the object out of tmp/ so the lifecycle rule doesn't reap it.
  // Copy to reports/<userId>/<reportId>.jpg, then delete the tmp original.
  const persistedKey = `reports/${userId}/${reportId}.jpg`;
  await s3.send(
    new CopyObjectCommand({
      Bucket: BUCKET,
      Key: persistedKey,
      CopySource: `${BUCKET}/${encodeURIComponent(s3Key)}`,
    })
  );
  await s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: s3Key })).catch(() => {});

  const report = {
    userId,
    reportId,
    itemType: 'report',
    status: 'submitted',
    category,
    description: (description ?? '').slice(0, 1000),
    locationLabel: locationLabel ?? '',
    latitude,
    longitude,
    s3Key: persistedKey,
    createdAt,
    isPublic: makePublic,
    authorDisplay,
    // Sparse GSI partition key — only set when the report is public, so the
    // GSI only indexes shared items.
    ...(makePublic ? { publicPartition: 'PUBLIC' } : {}),
  };

  await dynamo.send(new PutCommand({ TableName: TABLE, Item: report }));
  return json(200, { report });
}

// ─── GET /reports/mine ────────────────────────────────────────────────────

async function withThumbnail(item) {
  const thumbnailUrl = await getSignedUrl(
    s3,
    new GetObjectCommand({ Bucket: BUCKET, Key: item.s3Key }),
    { expiresIn: 3600 }
  );
  return { ...item, thumbnailUrl };
}

async function listReportsHandler(event) {
  const userId = getUserId(event);
  if (!userId) return json(401, { error: 'unauthorized' });

  const res = await dynamo.send(
    new QueryCommand({
      TableName: TABLE,
      KeyConditionExpression: 'userId = :u',
      // Only civic reports show up in My Requests; community posts live in
      // the feed. Items created before itemType existed are reports by
      // definition, so the filter accepts both missing and explicit values.
      FilterExpression: 'attribute_not_exists(itemType) OR itemType = :r',
      ExpressionAttributeValues: { ':u': userId, ':r': 'report' },
      ScanIndexForward: false, // newest first
      Limit: 50,
    })
  );

  const reports = await Promise.all((res.Items ?? []).map(withThumbnail));
  return json(200, { reports });
}

// ─── GET /community/reports ───────────────────────────────────────────────

async function listCommunityReportsHandler(event) {
  const userId = getUserId(event);
  if (!userId) return json(401, { error: 'unauthorized' });

  const qs = event?.queryStringParameters ?? {};
  const viewerLat = Number(qs.lat);
  const viewerLng = Number(qs.lng);
  const hasViewerCoords = Number.isFinite(viewerLat) && Number.isFinite(viewerLng);

  const res = await dynamo.send(
    new QueryCommand({
      TableName: TABLE,
      IndexName: 'PublicByCreatedAt',
      KeyConditionExpression: 'publicPartition = :p',
      ExpressionAttributeValues: { ':p': 'PUBLIC' },
      ScanIndexForward: false, // newest first (secondary sort by distance below)
      Limit: 100,
    })
  );

  const enriched = await Promise.all(
    (res.Items ?? []).map(async (item) => {
      const base =
        item.itemType === 'post' ? item : await withThumbnail(item);
      const { userId: _ownerId, ...rest } = base;
      const distanceMiles = hasViewerCoords
        ? haversineMiles(
            { latitude: viewerLat, longitude: viewerLng },
            { latitude: item.latitude, longitude: item.longitude }
          )
        : null;
      return {
        ...rest,
        itemType: item.itemType ?? 'report',
        isOwn: _ownerId === userId,
        distanceMiles,
      };
    })
  );

  // Distance-first when the viewer gave us coords; newest-first otherwise.
  // Ties on distance break by createdAt desc.
  const reports = hasViewerCoords
    ? enriched.sort((a, b) => {
        const da = a.distanceMiles ?? Infinity;
        const db = b.distanceMiles ?? Infinity;
        if (da !== db) return da - db;
        return (b.createdAt ?? '').localeCompare(a.createdAt ?? '');
      })
    : enriched;

  return json(200, { reports });
}

// ─── POST /community/posts ────────────────────────────────────────────────

async function createCommunityPostHandler(event) {
  const userId = getUserId(event);
  if (!userId) return json(401, { error: 'unauthorized' });

  const body = parseBody(event);
  const { title, message, kind, latitude, longitude } = body;

  if (!title || typeof title !== 'string' || title.trim().length === 0) {
    return badRequest('title is required');
  }
  if (!message || typeof message !== 'string' || message.trim().length === 0) {
    return badRequest('message is required');
  }
  if (!COMMUNITY_POST_KINDS.includes(kind)) {
    return badRequest(`kind must be one of ${COMMUNITY_POST_KINDS.join(', ')}`);
  }
  if (typeof latitude !== 'number' || typeof longitude !== 'number') {
    return badRequest('latitude and longitude required');
  }

  const trimmedTitle = title.trim().slice(0, 120);
  const trimmedMessage = message.trim().slice(0, 1000);
  const authorDisplay = getAuthorDisplay(event);
  const reportId = makeReportId();
  const createdAt = new Date().toISOString();
  const locationLabel = await reverseGeocode(latitude, longitude);

  const post = {
    userId,
    reportId,
    itemType: 'post',
    status: 'posted',
    kind,
    title: trimmedTitle,
    description: trimmedMessage,
    locationLabel,
    latitude,
    longitude,
    createdAt,
    isPublic: true,
    authorDisplay,
    publicPartition: 'PUBLIC',
  };

  await dynamo.send(new PutCommand({ TableName: TABLE, Item: post }));
  return json(200, { post });
}

// ─── DELETE /community/posts/{postId} ─────────────────────────────────────

async function deleteCommunityPostHandler(event) {
  const userId = getUserId(event);
  if (!userId) return json(401, { error: 'unauthorized' });

  const postId = event?.pathParameters?.postId;
  if (!postId) return badRequest('postId required');

  try {
    await dynamo.send(
      new DeleteCommand({
        TableName: TABLE,
        Key: { userId, reportId: postId },
        // Only let posts (not civic reports) be deleted via this endpoint.
        ConditionExpression: 'attribute_exists(reportId) AND itemType = :p',
        ExpressionAttributeValues: { ':p': 'post' },
      })
    );
  } catch (err) {
    if (err?.name === 'ConditionalCheckFailedException') {
      return json(404, { error: 'not_found', message: 'Post not found or not owned by you.' });
    }
    throw err;
  }
  return json(200, { ok: true });
}

// ─── Router ───────────────────────────────────────────────────────────────

export const handler = async (event) => {
  try {
    const method = event?.requestContext?.http?.method;
    const path = event?.requestContext?.http?.path;
    const route = `${method} ${path}`;

    if (route === 'POST /uploads/presign') return presignHandler(event);
    if (route === 'POST /reports/analyze') return analyzeHandler(event);
    if (route === 'POST /reports') return createReportHandler(event);
    if (route === 'GET /reports/mine') return listReportsHandler(event);
    if (route === 'GET /community/reports') return listCommunityReportsHandler(event);
    if (route === 'POST /community/posts') return createCommunityPostHandler(event);
    if (route === 'DELETE /community/posts/{postId}') return deleteCommunityPostHandler(event);
    return json(404, { error: 'route_not_found', route });
  } catch (err) {
    return serverError(err);
  }
};
