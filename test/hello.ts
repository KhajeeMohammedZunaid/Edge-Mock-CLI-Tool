// ─── Test: Simple Hello World Edge Function ──────────────────────────
// Pattern: export default handler

export default async function handler(req: Request): Promise<Response> {
  const url = new URL(req.url);

  // GET → simple greeting
  if (req.method === 'GET') {
    return new Response(
      JSON.stringify({ message: 'Hello from edge-mock!', path: url.pathname }),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    );
  }

  // POST → echo the webhook payload back
  const body = await req.json();
  return new Response(
    JSON.stringify({
      message: 'Webhook received!',
      echo: body,
      timestamp: new Date().toISOString(),
    }),
    { status: 200, headers: { 'Content-Type': 'application/json' } },
  );
}
