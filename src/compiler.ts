// ─── Compiler ────────────────────────────────────────────────────────
// Uses esbuild for ultra-fast, in-memory TypeScript → IIFE compilation.

import * as esbuild from 'esbuild';
import { logCompilation } from './logger';
import type { CompilationResult } from './types';

/**
 * Compile an edge function file to an IIFE string that can be executed
 * inside a Node VM context.  The IIFE assigns its exports to the global
 * variable `__edge_fn__`, so the sandbox can read `__edge_fn__.default`.
 */
export async function compileEdgeFunction(
  filePath: string,
): Promise<CompilationResult> {
  const start = performance.now();

  const result = await esbuild.build({
    entryPoints: [filePath],
    bundle: true,
    write: false,               // keep output in memory (no disk I/O)
    format: 'iife',
    globalName: '__edge_fn__',  // `var __edge_fn__ = (()=>{ … })()`
    platform: 'browser',        // edge runtime ≈ browser globals
    target: 'es2022',
    treeShaking: true,
    minify: false,              // keep readable for local debugging
    sourcemap: 'inline',
    logLevel: 'silent',
  });

  const code = result.outputFiles[0].text;
  const warnings = result.warnings.map((w) => w.text);
  const durationMs = performance.now() - start;

  logCompilation(filePath, durationMs);

  return { code, warnings, durationMs };
}
