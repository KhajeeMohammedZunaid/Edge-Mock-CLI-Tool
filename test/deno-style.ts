// ─── Test: Deno.serve() pattern ──────────────────────────────────────
// Pattern: Deno.serve(handler) — used by Supabase Edge Functions

Deno.serve(async (req: Request): Promise<Response> => {
  const url = new URL(req.url);

  if (req.method === 'GET') {
    return new Response(
      JSON.stringify({ message: 'Deno-style edge function works!', path: url.pathname }),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    );
  }

  const body = await req.json();
  return new Response(
    JSON.stringify({ ok: true, received: body }),
    { status: 200, headers: { 'Content-Type': 'application/json' } },
  );
});
