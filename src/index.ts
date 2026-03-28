#!/usr/bin/env node
// ─── CLI Entry Point ─────────────────────────────────────────────────
// edge-mock — Universal Local Edge Function Mocker

import * as fs from 'node:fs';
import * as path from 'node:path';
import { createServer } from './server';
import { logBanner, logError, logInfo, logWatch } from './logger';
import type { CLIOptions } from './types';

// ── Argument parser (zero deps) ─────────────────────────────────────

function parseArgs(argv: string[]): CLIOptions {
  const opts: CLIOptions = {
    port: 3000,
    file: '',
    watch: false,
    verbose: false,
  };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    switch (arg) {
      case '-p':
      case '--port':
        opts.port = Number(argv[++i]);
        if (Number.isNaN(opts.port) || opts.port < 1 || opts.port > 65535) {
          logError('Invalid port number. Must be between 1 and 65535.');
          process.exit(1);
        }
        break;
      case '-f':
      case '--file':
        opts.file = argv[++i];
        break;
      case '-w':
      case '--watch':
        opts.watch = true;
        break;
      case '-v':
      case '--verbose':
        opts.verbose = true;
        break;
      case '-h':
      case '--help':
        printHelp();
        process.exit(0);
        break;
      default:
        // If first positional arg and no --file yet, treat as file path
        if (!opts.file && !arg.startsWith('-')) {
          opts.file = arg;
        }
        break;
    }
  }

  return opts;
}

function printHelp(): void {
  const B = '\x1b[1m';
  const C = '\x1b[36m';
  const R = '\x1b[0m';
  const D = '\x1b[2m';

  console.log(`
  ${B}${C} __|  _ \\   __|  __|     \\  |   _ \\   __|  |  /${R}
  ${B}${C} _|   |  | (_ |  _|     |\\/  |  (   | (     . < ${R}
  ${B}${C}___| ___/ \\___| ___|   _|  _| \\___/ \\___| _|\\_ \\${R}
  ${D}────────────────────────────────────────────────────${R}
  ${D}v1.0.0${R}  Universal Local Edge Function Mocker

  ${B}USAGE${R}
    edge-mock --file <path> [options]
    edge-mock <path>        (shorthand)

  ${'\x1b[1m'}OPTIONS${'\x1b[0m'}
    -f, --file <path>       Path to edge function (.ts / .js)  ${'\x1b[2m'}required${'\x1b[0m'}
    -p, --port <number>     Port to listen on                  ${'\x1b[2m'}default: 3000${'\x1b[0m'}
    -w, --watch             Reload when the function file changes
    -v, --verbose           Print request/response bodies
    -h, --help              Show this message

  ${'\x1b[1m'}EXAMPLES${'\x1b[0m'}
    edge-mock -f ./functions/webhook.ts
    edge-mock -f ./handler.ts -p 8080 --watch --verbose

  ${'\x1b[1m'}SUPPORTED PATTERNS${'\x1b[0m'}
    • export default function handler(req: Request): Response
    • Deno.serve((req) => new Response("ok"))
`);
}

// ── Main ─────────────────────────────────────────────────────────────

function main(): void {
  const opts = parseArgs(process.argv.slice(2));

  // Validate --file
  if (!opts.file) {
    logError('Missing required argument: --file <path>');
    printHelp();
    process.exit(1);
  }

  const resolved = path.resolve(opts.file);
  if (!fs.existsSync(resolved)) {
    logError(`File not found: ${resolved}`);
    process.exit(1);
  }
  opts.file = resolved;

  // Start server
  const server = createServer(opts);
  server.listen(opts.port, () => logBanner(opts.port, opts.file));

  // Optional: watch mode
  if (opts.watch) {
    fs.watch(resolved, (event) => {
      if (event === 'change') logWatch(resolved);
    });
  }

  // Graceful shutdown
  const shutdown = () => {
    logInfo('Shutting down');
    server.close(() => process.exit(0));
    // Force exit after 3 s if connections linger
    setTimeout(() => process.exit(0), 3000).unref();
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

main();
