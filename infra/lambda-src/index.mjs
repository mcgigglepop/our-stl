// OurSTL API — Stage A placeholder.
// Returns stubbed success responses for all four routes so Terraform can
// apply + end-to-end plumbing can be verified before real AWS calls go in.

const json = (statusCode, body) => ({
  statusCode,
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify(body),
});

const notFound = () => json(404, { error: 'route_not_found' });
const serverError = (err) =>
  json(500, { error: 'internal_error', message: err?.message ?? String(err) });

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
  // Cognito JWT authorizer puts claims under requestContext.authorizer.jwt.claims
  return event?.requestContext?.authorizer?.jwt?.claims?.sub ?? null;
}

async function presignHandler(event) {
  const userId = getUserId(event);
  return json(200, {
    stage: 'A-placeholder',
    userId,
    putUrl: 'https://placeholder.invalid/upload',
    s3Key: `tmp/${userId}/placeholder.jpg`,
  });
}

async function analyzeHandler(event) {
  const body = parseBody(event);
  return json(200, {
    stage: 'A-placeholder',
    received: body,
    category: 'Pothole',
    description: 'Stage A placeholder response. Real analysis arrives in Stage B.',
    locationLabel: 'Downtown St. Louis',
    confidence: 'low',
  });
}

async function createReportHandler(event) {
  const userId = getUserId(event);
  const body = parseBody(event);
  return json(200, {
    stage: 'A-placeholder',
    report: {
      reportId: 'placeholder-01',
      userId,
      ...body,
      status: 'submitted',
      createdAt: new Date().toISOString(),
    },
  });
}

async function listReportsHandler(event) {
  const userId = getUserId(event);
  return json(200, {
    stage: 'A-placeholder',
    userId,
    reports: [],
  });
}

export const handler = async (event) => {
  try {
    const method = event?.requestContext?.http?.method;
    const path = event?.requestContext?.http?.path;
    const route = `${method} ${path}`;

    if (route === 'POST /uploads/presign') return presignHandler(event);
    if (route === 'POST /reports/analyze') return analyzeHandler(event);
    if (route === 'POST /reports') return createReportHandler(event);
    if (route === 'GET /reports/mine') return listReportsHandler(event);
    return notFound();
  } catch (err) {
    console.error('Unhandled error', err);
    return serverError(err);
  }
};
