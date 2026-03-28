// ─── Sandbox ─────────────────────────────────────────────────────────
// Executes compiled edge-function code inside an isolated V8 context
// powered by Node's built-in `vm` module.

import * as vm from 'node:vm';
import { createEdgeRuntimeContext } from './polyfills';
import type { ExecutionResult } from './types';

/**
 * Run a compiled edge-function IIFE inside a sandboxed VM and invoke
 * the handler with the given Web `Request`.
 *
 * Supports two handler patterns:
 *   1. `export default function handler(req: Request)` → reads `__edge_fn__.default`
 *   2. `Deno.serve(handler)`                           → captured by shim
 */
export async function executeEdgeFunction(
  compiledCode: string,
  request: Request,
): Promise<ExecutionResult> {
  const start = performance.now();

  // 1. Build the Web-standard global context
  const { context, getDenoHandler } = createEdgeRuntimeContext();
  const sandbox = vm.createContext(context);

  // 2. Run the IIFE — this populates __edge_fn__ and/or triggers Deno.serve()
  const script = new vm.Script(compiledCode, {
    filename: 'edge-function.js',
  });
  script.runInContext(sandbox, {
    timeout: 10_000, // hard 10 s ceiling to prevent infinite loops
  });

  // 3. Resolve the handler
  type Handler = (req: Request) => Response | Promise<Response>;
  let handler: Handler | null = null;

  const exported = sandbox.__edge_fn__ as Record<string, unknown> | undefined;
  if (exported?.default && typeof exported.default === 'function') {
    handler = exported.default as Handler;
  } else if (getDenoHandler()) {
    handler = getDenoHandler()!;
  }

  if (!handler) {
    throw new Error(
      'No handler found. Your edge function must either:\n' +
        '  • export default a function (req: Request) => Response\n' +
        '  • call Deno.serve(handler)',
    );
  }

  // 4. Call the handler with the Request
  const response = await handler(request);

  if (!(response instanceof Response)) {
    throw new Error(
      `Handler returned ${typeof response} instead of a Response object.`,
    );
  }

  const durationMs = performance.now() - start;

  return { response, durationMs };
}
