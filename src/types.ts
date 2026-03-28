// ─── Types ───────────────────────────────────────────────────────────

export interface CLIOptions {
  port: number;
  file: string;
  watch: boolean;
  verbose: boolean;
}

export interface CompilationResult {
  code: string;
  warnings: string[];
  durationMs: number;
}

export interface ExecutionResult {
  response: Response;
  durationMs: number;
}

export interface RequestLog {
  method: string;
  url: string;
  status: number;
  durationMs: number;
  compilationMs: number;
  timestamp: Date;
}
