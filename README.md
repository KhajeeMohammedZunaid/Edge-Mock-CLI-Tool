# Edge Mock CLI Tool

Edge Mock is a lightweight, vendor-agnostic command line tool for testing edge functions and webhook handlers locally. It removes the slow deploy-debug cycle by compiling and running your function instantly on incoming HTTP requests.

## Problem It Solves

Teams building Stripe, Supabase, Clerk, Auth0, or custom webhook flows often debug by deploying to cloud environments, triggering test events, and searching remote logs. Each fix can take minutes.

Edge Mock runs the same handler logic locally so you can iterate in milliseconds, validate behavior before deployment, and reduce production risk.

## How It Works

1. Receives incoming webhook payloads through a local HTTP server.
2. Compiles your TypeScript edge function in memory using esbuild.
3. Converts Node HTTP input into Web-standard Request objects.
4. Executes your function in an isolated VM context with Web APIs injected.
5. Returns the function Response and prints timing and status logs to terminal.

## Installation

### Global Install from npm

```bash
npm install -g edge-mock
```

### Run from Source

```bash
npm install
npm run build
node dist/index.js --help
```

## Quick Start

### 1) Create a Handler

```ts
export default async function handler(req: Request): Promise<Response> {
  const payload = await req.json();

  return new Response(JSON.stringify({
    ok: true,
    received: payload,
  }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
```

### 2) Start Edge Mock

```bash
edge-mock --file ./handler.ts --port 3000
```

### 3) Send a Test Request

```bash
curl -X POST http://localhost:3000 \
  -H "Content-Type: application/json" \
  -d '{"event":"user.created","id":123}'
```

## CLI Usage

```bash
edge-mock --file <path> [options]
edge-mock <path>
```

### Options

- `-f, --file <path>`: Path to edge function file (.ts or .js), required.
- `-p, --port <number>`: HTTP port, default 3000.
- `-w, --watch`: Watch file changes and reload automatically.
- `-v, --verbose`: Print request and response body previews.
- `-h, --help`: Show help output.

## Supported Handler Patterns

### Default Export Pattern

```ts
export default async function handler(req: Request): Promise<Response> {
  return new Response("ok");
}
```

### Deno Serve Pattern

```ts
Deno.serve(async (req: Request): Promise<Response> => {
  return new Response("ok");
});
```

## Testing with Real Providers

### Supabase Database Webhooks

1. Start Edge Mock with your handler on port 3000.
2. Expose localhost using a tunnel (for example, ngrok).
3. Configure the Supabase webhook URL to the tunnel address.
4. Run INSERT, UPDATE, DELETE events and verify terminal output.

### Stripe Webhooks

1. Start Edge Mock with your Stripe handler.
2. Use Stripe CLI forwarding to local server.
3. Trigger test events and validate state transitions.

```bash
stripe listen --forward-to http://localhost:3000
stripe trigger payment_intent.succeeded
```

### Generic Webhook Systems

Any service that sends HTTP webhooks with JSON payloads can be tested by posting payload samples to your local endpoint.

## Why It Saves Time

Traditional workflow: write code, deploy, trigger event, inspect cloud logs, fix, deploy again.
Local workflow with Edge Mock: write code, run once, send payload, inspect terminal output immediately.

This shift shortens feedback loops from minutes to milliseconds and improves development speed and confidence.

## Local Development Commands

```bash
npm install
npm run build
npm run dev
```

## Requirements

- Node.js 18 or newer.
- TypeScript or JavaScript edge function file.

## License

MIT
