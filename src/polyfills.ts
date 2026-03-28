// ─── Polyfills ───────────────────────────────────────────────────────
// Builds the Web-standard global context injected into the VM sandbox.
// Node 18+ ships fetch / Request / Response / Headers natively; we
// simply forward them so user code sees the same APIs as an edge runtime.

/**
 * Return a plain object that will become the VM context's global scope.
 * Also returns a helper to retrieve a handler captured by `Deno.serve()`.
 */
export function createEdgeRuntimeContext() {
  // Capture handler registered via Deno.serve(handler)
  let denoServeHandler: ((req: Request) => Response | Promise<Response>) | null =
    null;

  const context: Record<string, unknown> = {
    // ── Web-standard APIs (Node 18+) ──────────────────────────────
    Request,
    Response,
    Headers,
    URL,
    URLSearchParams,
    fetch,
    AbortController,
    AbortSignal,

    // ── Encoding ──────────────────────────────────────────────────
    TextEncoder,
    TextDecoder,
    atob,
    btoa,

    // ── Crypto ────────────────────────────────────────────────────
    crypto: globalThis.crypto,

    // ── Structured data ───────────────────────────────────────────
    structuredClone,
    JSON,

    // ── Timers ────────────────────────────────────────────────────
    setTimeout,
    clearTimeout,
    setInterval,
    clearInterval,
    queueMicrotask,

    // ── Console (prefixed so dev can distinguish edge logs) ──────
    console: {
      log:   (...a: unknown[]) => console.log('  [edge]', ...a),
      info:  (...a: unknown[]) => console.info('  [edge]', ...a),
      warn:  (...a: unknown[]) => console.warn('  [edge]', ...a),
      error: (...a: unknown[]) => console.error('  [edge]', ...a),
      debug: (...a: unknown[]) => console.debug('  [edge]', ...a),
    },

    // ── Deno compatibility shim ───────────────────────────────────
    Deno: {
      serve(handler: (req: Request) => Response | Promise<Response>) {
        denoServeHandler = handler;
      },
      env: {
        get(key: string) {
          return process.env[key];
        },
        toObject() {
          return { ...process.env };
        },
      },
    },

    // ── Misc ──────────────────────────────────────────────────────
    performance,
    Event,
    EventTarget,

    // Placeholder — filled after vm.createContext so the IIFE `var`
    // declaration lands on the context object.
    __edge_fn__: undefined as unknown,
  };

  return {
    context,
    getDenoHandler: () => denoServeHandler,
  };
}
