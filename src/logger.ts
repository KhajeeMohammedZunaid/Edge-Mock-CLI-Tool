// ─── Logger ──────────────────────────────────────────────────────────
// Zero-dependency, ANSI-colored terminal output for the CLI.

import type { RequestLog } from './types';

// ANSI escape codes — no chalk dependency needed
const C = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  bgGreen: '\x1b[42m',
  bgRed: '\x1b[41m',
  bgYellow: '\x1b[43m',
} as const;

// ── Helpers ──────────────────────────────────────────────────────────

function statusColor(status: number): string {
  if (status < 300) return C.green;
  if (status < 400) return C.yellow;
  return C.red;
}

function pad(n: number, decimals = 2): string {
  return n.toFixed(decimals);
}

function timestamp(): string {
  return new Date().toLocaleTimeString('en-US', { hour12: false });
}

// ── Public API ───────────────────────────────────────────────────────

export function logBanner(port: number, file: string): void {
  const art = [
    ` __|  _ \\   __|  __|     \\  |   _ \\   __|  |  /`,
    ` _|   |  | (_ |  _|     |\\/ |  (   | (     . < `,
    `___| ___/ \\___| ___|   _|  _| \\___/ \\___| _|\\_ \\`,
  ];

  const lines = [
    '',
    ...art.map((l) => `  ${C.bold}${C.cyan}${l}${C.reset}`),
    `${C.dim}  ${'─'.repeat(52)}${C.reset}`,
    `  ${C.dim}v1.0.0${C.reset}  ${C.white}Universal Local Edge Function Mocker${C.reset}`,
    '',
    `  ${C.dim}→${C.reset} Function : ${C.white}${file}${C.reset}`,
    `  ${C.dim}→${C.reset} Listening: ${C.green}http://localhost:${port}${C.reset}`,
    `  ${C.dim}→${C.reset} Press ${C.bold}Ctrl+C${C.reset} to stop`,
    '',
    `${C.dim}  ${'─'.repeat(52)}${C.reset}`,
    '',
  ];
  console.log(lines.join('\n'));
}

export function logRequest(log: RequestLog): void {
  const sc = statusColor(log.status);
  const line = [
    `  ${C.dim}${timestamp()}${C.reset}`,
    `${sc}${C.bold}${log.status}${C.reset}`,
    `${C.white}${log.method.padEnd(6)}${C.reset}`,
    `${log.url}`,
    `${C.dim}(compile ${pad(log.compilationMs)}ms · exec ${pad(log.durationMs)}ms)${C.reset}`,
  ].join('  ');

  console.log(line);
}

export function logCompilation(file: string, durationMs: number): void {
  console.log(
    `  ${C.dim}${timestamp()}${C.reset}  ${C.magenta}compiled${C.reset}  ${C.dim}${file} in ${pad(durationMs)}ms${C.reset}`
  );
}

export function logError(message: string, error?: Error): void {
  console.error(`\n  ${C.red}${C.bold}✖ ${message}${C.reset}`);
  if (error?.message) {
    console.error(`  ${C.dim}${error.message}${C.reset}`);
  }
  if (error?.stack) {
    const stackLines = error.stack
      .split('\n')
      .slice(1, 4)
      .map((l) => `  ${C.dim}${l.trim()}${C.reset}`)
      .join('\n');
    console.error(stackLines);
  }
}

export function logInfo(message: string): void {
  console.log(`  ${C.dim}${timestamp()}${C.reset}  ${C.blue}info${C.reset}  ${message}`);
}

export function logWatch(file: string): void {
  console.log(
    `  ${C.dim}${timestamp()}${C.reset}  ${C.yellow}reload${C.reset}  ${C.dim}${file} changed — next request uses fresh code${C.reset}`
  );
}

export function logVerboseBody(label: string, body: string): void {
  const preview = body.length > 512 ? body.slice(0, 512) + '…' : body;
  console.log(`  ${C.dim}${label}:${C.reset}\n  ${C.dim}${preview}${C.reset}`);
}
