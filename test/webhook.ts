// ─── Test: Supabase-style Database Webhook ───────────────────────────
// Pattern: export default handler (simulates a DB trigger webhook)

interface WebhookPayload {
  type: 'INSERT' | 'UPDATE' | 'DELETE';
  table: string;
  schema: string;
  record: Record<string, unknown>;
  old_record?: Record<string, unknown>;
}

export default async function handler(req: Request): Promise<Response> {
  // Only accept POST
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const payload: WebhookPayload = await req.json();

  console.log(`DB event: ${payload.type} on ${payload.schema}.${payload.table}`);

  // Simulate processing logic
  let statusMessage: string;
  switch (payload.type) {
    case 'INSERT':
      statusMessage = `New row inserted into ${payload.table}`;
      break;
    case 'UPDATE':
      statusMessage = `Row updated in ${payload.table}`;
      break;
    case 'DELETE':
      statusMessage = `Row deleted from ${payload.table}`;
      break;
    default:
      statusMessage = 'Unknown event type';
  }

  return new Response(
    JSON.stringify({
      processed: true,
      event: payload.type,
      message: statusMessage,
      record_id: payload.record?.id ?? null,
    }),
    { status: 200, headers: { 'Content-Type': 'application/json' } },
  );
}
