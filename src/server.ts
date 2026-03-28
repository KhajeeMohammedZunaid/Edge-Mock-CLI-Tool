// ─── Server ──────────────────────────────────────────────────────────
// Lightweight HTTP server that wires together the five architecture
// layers: Ingest → Compile → Polyfill → Sandbox → Output.

import * as http from 'node:http';
import * as path from 'node:path';
import { compileEdgeFunction } from './compiler';
import { executeEdgeFunction } from './sandbox';
import { logRequest, logError, logVerboseBody } from './logger';
import type { CLIOptions } from './types';

// ── Helpers ──────────────────────────────────────────────────────────

/** Drain the incoming stream into a single Buffer. */
function collectBody(req: http.IncomingMessage): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (c: Buffer) => chunks.push(c));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

/** Convert a Node IncomingMessage + body buffer into a Web `Request`. */
function toWebRequest(
  req: http.IncomingMessage,
  body: Buffer,
  baseUrl: string,
): Request {
  const url = new URL(req.url || '/', baseUrl);

  const headers = new Headers();
  for (const [key, val] of Object.entries(req.headers)) {
    if (!val) continue;
    if (Array.isArray(val)) val.forEach((v) => headers.append(key, v));
    else headers.set(key, val);
  }

  const init: RequestInit = { method: req.method, headers };

  // Only attach a body for methods that semantically carry one.
  const hasBody = req.method !== 'GET' && req.method !== 'HEAD' && body.length > 0;
  if (hasBody) {
    init.body = body;
    // Node 20+ Request constructor requires duplex when body is present
    (init as Record<string, unknown>).duplex = 'half';
  }

  return new Request(url.toString(), init);
}

// ── Server factory ───────────────────────────────────────────────────

export function createServer(options: CLIOptions): http.Server {
  const filePath = path.resolve(options.file);
  const baseUrl  = `http://localhost:${options.port}`;

  return http.createServer(async (req, res) => {
    const reqStart = performance.now();

    try {
      // Layer 1 — Ingest
      const body = await collectBody(req);

      if (options.verbose) {
        logVerboseBody('← request body', body.toString('utf-8'));
      }

      // Layer 2 — Compile
      const compiled = await compileEdgeFunction(filePath);

      // Layer 3 + 4 — Polyfill & Sandbox
      const webReq = toWebRequest(req, body, baseUrl);
      const { response, durationMs } = await executeEdgeFunction(
        compiled.code,
        webReq,
      );

      // Layer 5 — Output
      const responseBody = Buffer.from(await response.arrayBuffer());

      res.writeHead(response.status, Object.fromEntries(response.headers));
      res.end(responseBody);

      if (options.verbose) {
        logVerboseBody('→ response body', responseBody.toString('utf-8'));
      }

      logRequest({
        method: req.method || 'UNKNOWN',
        url: req.url || '/',
        status: response.status,
        durationMs,
        compilationMs: compiled.durationMs,
        timestamp: new Date(),
      });
    } catch (err) {
      logError('Request handling failed', err as Error);

      if (!res.headersSent) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
      }
      res.end(
        JSON.stringify({
          error: 'Edge function execution failed',
          message: (err as Error).message,
        }),
      );
    }
  });
}
