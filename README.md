<main>
  <h1>Edge Mock CLI Tool</h1>
  <p>
    Edge Mock is a lightweight, vendor-agnostic command line tool for testing edge functions and webhook handlers locally.
    It removes the slow deploy-debug cycle by compiling and running your function instantly on incoming HTTP requests.
  </p>

  <section>
    <h2>Problem It Solves</h2>
    <p>
      Teams building Stripe, Supabase, Clerk, Auth0, or custom webhook flows often debug by deploying to cloud environments,
      triggering test events, and searching remote logs. Each fix can take minutes.
    </p>
    <p>
      Edge Mock runs the same handler logic locally so you can iterate in milliseconds, validate behavior before deployment,
      and reduce production risk.
    </p>
  </section>

  <section>
    <h2>How It Works</h2>
    <ol>
      <li>Receives incoming webhook payloads through a local HTTP server.</li>
      <li>Compiles your TypeScript edge function in memory using esbuild.</li>
      <li>Converts Node HTTP input into Web-standard Request objects.</li>
      <li>Executes your function in an isolated VM context with Web APIs injected.</li>
      <li>Returns the function Response and prints timing and status logs to terminal.</li>
    </ol>
  </section>

  <section>
    <h2>Installation</h2>
    <h3>Global Install from npm</h3>
    <pre><code>npm install -g edge-mock</code></pre>

    <h3>Run from Source</h3>
    <pre><code>npm install
npm run build
node dist/index.js --help</code></pre>
  </section>

  <section>
    <h2>Quick Start</h2>
    <h3>1) Create a Handler</h3>
    <pre><code>export default async function handler(req: Request): Promise&lt;Response&gt; {
  const payload = await req.json();

  return new Response(JSON.stringify({
    ok: true,
    received: payload,
  }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}</code></pre>

    <h3>2) Start Edge Mock</h3>
    <pre><code>edge-mock --file ./handler.ts --port 3000</code></pre>

    <h3>3) Send a Test Request</h3>
    <pre><code>curl -X POST http://localhost:3000 \
  -H "Content-Type: application/json" \
  -d '{"event":"user.created","id":123}'</code></pre>
  </section>

  <section>
    <h2>CLI Usage</h2>
    <pre><code>edge-mock --file &lt;path&gt; [options]
edge-mock &lt;path&gt;</code></pre>

    <h3>Options</h3>
    <ul>
      <li><code>-f, --file &lt;path&gt;</code>: Path to edge function file (.ts or .js), required.</li>
      <li><code>-p, --port &lt;number&gt;</code>: HTTP port, default 3000.</li>
      <li><code>-w, --watch</code>: Watch file changes and reload automatically.</li>
      <li><code>-v, --verbose</code>: Print request and response body previews.</li>
      <li><code>-h, --help</code>: Show help output.</li>
    </ul>
  </section>

  <section>
    <h2>Supported Handler Patterns</h2>
    <h3>Default Export Pattern</h3>
    <pre><code>export default async function handler(req: Request): Promise&lt;Response&gt; {
  return new Response("ok");
}</code></pre>

    <h3>Deno Serve Pattern</h3>
    <pre><code>Deno.serve(async (req: Request): Promise&lt;Response&gt; =&gt; {
  return new Response("ok");
});</code></pre>
  </section>

  <section>
    <h2>Testing with Real Providers</h2>
    <h3>Supabase Database Webhooks</h3>
    <ol>
      <li>Start Edge Mock with your handler on port 3000.</li>
      <li>Expose localhost using a tunnel (for example, ngrok).</li>
      <li>Configure the Supabase webhook URL to the tunnel address.</li>
      <li>Run INSERT, UPDATE, DELETE events and verify terminal output.</li>
    </ol>

    <h3>Stripe Webhooks</h3>
    <ol>
      <li>Start Edge Mock with your Stripe handler.</li>
      <li>Use Stripe CLI forwarding to local server.</li>
      <li>Trigger test events and validate state transitions.</li>
    </ol>
    <pre><code>stripe listen --forward-to http://localhost:3000
stripe trigger payment_intent.succeeded</code></pre>

    <h3>Generic Webhook Systems</h3>
    <p>
      Any service that sends HTTP webhooks with JSON payloads can be tested by posting payload samples to your local endpoint.
    </p>
  </section>

  <section>
    <h2>Why It Saves Time</h2>
    <p>
      Traditional workflow: write code, deploy, trigger event, inspect cloud logs, fix, deploy again.
      Local workflow with Edge Mock: write code, run once, send payload, inspect terminal output immediately.
    </p>
    <p>
      This shift shortens feedback loops from minutes to milliseconds and improves development speed and confidence.
    </p>
  </section>

  <section>
    <h2>Local Development Commands</h2>
    <pre><code>npm install
npm run build
npm run dev</code></pre>
  </section>

  <section>
    <h2>Requirements</h2>
    <ul>
      <li>Node.js 18 or newer.</li>
      <li>TypeScript or JavaScript edge function file.</li>
    </ul>
  </section>

  <section>
    <h2>License</h2>
    <p>MIT</p>
  </section>
</main>
