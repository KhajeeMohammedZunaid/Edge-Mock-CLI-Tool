#!/usr/bin/env node
"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// src/index.ts
var fs = __toESM(require("node:fs"));
var path2 = __toESM(require("node:path"));

// src/server.ts
var http = __toESM(require("node:http"));
var path = __toESM(require("node:path"));

// src/compiler.ts
var esbuild = __toESM(require("esbuild"));

// src/logger.ts
var C = {
  reset: "\x1B[0m",
  bold: "\x1B[1m",
  dim: "\x1B[2m",
  red: "\x1B[31m",
  green: "\x1B[32m",
  yellow: "\x1B[33m",
  blue: "\x1B[34m",
  magenta: "\x1B[35m",
  cyan: "\x1B[36m",
  white: "\x1B[37m",
  bgGreen: "\x1B[42m",
  bgRed: "\x1B[41m",
  bgYellow: "\x1B[43m"
};
function statusColor(status) {
  if (status < 300) return C.green;
  if (status < 400) return C.yellow;
  return C.red;
}
function pad(n, decimals = 2) {
  return n.toFixed(decimals);
}
function timestamp() {
  return (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", { hour12: false });
}
function logBanner(port, file) {
  const art = [
    ` __|  _ \\   __|  __|     \\  |   _ \\   __|  |  /`,
    ` _|   |  | (_ |  _|     |\\/ |  (   | (     . < `,
    `___| ___/ \\___| ___|   _|  _| \\___/ \\___| _|\\_ \\`
  ];
  const lines = [
    "",
    ...art.map((l) => `  ${C.bold}${C.cyan}${l}${C.reset}`),
    `${C.dim}  ${"\u2500".repeat(52)}${C.reset}`,
    `  ${C.dim}v1.0.0${C.reset}  ${C.white}Universal Local Edge Function Mocker${C.reset}`,
    "",
    `  ${C.dim}\u2192${C.reset} Function : ${C.white}${file}${C.reset}`,
    `  ${C.dim}\u2192${C.reset} Listening: ${C.green}http://localhost:${port}${C.reset}`,
    `  ${C.dim}\u2192${C.reset} Press ${C.bold}Ctrl+C${C.reset} to stop`,
    "",
    `${C.dim}  ${"\u2500".repeat(52)}${C.reset}`,
    ""
  ];
  console.log(lines.join("\n"));
}
function logRequest(log) {
  const sc = statusColor(log.status);
  const line = [
    `  ${C.dim}${timestamp()}${C.reset}`,
    `${sc}${C.bold}${log.status}${C.reset}`,
    `${C.white}${log.method.padEnd(6)}${C.reset}`,
    `${log.url}`,
    `${C.dim}(compile ${pad(log.compilationMs)}ms \xB7 exec ${pad(log.durationMs)}ms)${C.reset}`
  ].join("  ");
  console.log(line);
}
function logCompilation(file, durationMs) {
  console.log(
    `  ${C.dim}${timestamp()}${C.reset}  ${C.magenta}compiled${C.reset}  ${C.dim}${file} in ${pad(durationMs)}ms${C.reset}`
  );
}
function logError(message, error) {
  console.error(`
  ${C.red}${C.bold}\u2716 ${message}${C.reset}`);
  if (error?.message) {
    console.error(`  ${C.dim}${error.message}${C.reset}`);
  }
  if (error?.stack) {
    const stackLines = error.stack.split("\n").slice(1, 4).map((l) => `  ${C.dim}${l.trim()}${C.reset}`).join("\n");
    console.error(stackLines);
  }
}
function logInfo(message) {
  console.log(`  ${C.dim}${timestamp()}${C.reset}  ${C.blue}info${C.reset}  ${message}`);
}
function logWatch(file) {
  console.log(
    `  ${C.dim}${timestamp()}${C.reset}  ${C.yellow}reload${C.reset}  ${C.dim}${file} changed \u2014 next request uses fresh code${C.reset}`
  );
}
function logVerboseBody(label, body) {
  const preview = body.length > 512 ? body.slice(0, 512) + "\u2026" : body;
  console.log(`  ${C.dim}${label}:${C.reset}
  ${C.dim}${preview}${C.reset}`);
}

// src/compiler.ts
async function compileEdgeFunction(filePath) {
  const start = performance.now();
  const result = await esbuild.build({
    entryPoints: [filePath],
    bundle: true,
    write: false,
    // keep output in memory (no disk I/O)
    format: "iife",
    globalName: "__edge_fn__",
    // `var __edge_fn__ = (()=>{ … })()`
    platform: "browser",
    // edge runtime ≈ browser globals
    target: "es2022",
    treeShaking: true,
    minify: false,
    // keep readable for local debugging
    sourcemap: "inline",
    logLevel: "silent"
  });
  const code = result.outputFiles[0].text;
  const warnings = result.warnings.map((w) => w.text);
  const durationMs = performance.now() - start;
  logCompilation(filePath, durationMs);
  return { code, warnings, durationMs };
}

// src/sandbox.ts
var vm = __toESM(require("node:vm"));

// src/polyfills.ts
function createEdgeRuntimeContext() {
  let denoServeHandler = null;
  const context = {
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
      log: (...a) => console.log("  [edge]", ...a),
      info: (...a) => console.info("  [edge]", ...a),
      warn: (...a) => console.warn("  [edge]", ...a),
      error: (...a) => console.error("  [edge]", ...a),
      debug: (...a) => console.debug("  [edge]", ...a)
    },
    // ── Deno compatibility shim ───────────────────────────────────
    Deno: {
      serve(handler) {
        denoServeHandler = handler;
      },
      env: {
        get(key) {
          return process.env[key];
        },
        toObject() {
          return { ...process.env };
        }
      }
    },
    // ── Misc ──────────────────────────────────────────────────────
    performance,
    Event,
    EventTarget,
    // Placeholder — filled after vm.createContext so the IIFE `var`
    // declaration lands on the context object.
    __edge_fn__: void 0
  };
  return {
    context,
    getDenoHandler: () => denoServeHandler
  };
}

// src/sandbox.ts
async function executeEdgeFunction(compiledCode, request) {
  const start = performance.now();
  const { context, getDenoHandler } = createEdgeRuntimeContext();
  const sandbox = vm.createContext(context);
  const script = new vm.Script(compiledCode, {
    filename: "edge-function.js"
  });
  script.runInContext(sandbox, {
    timeout: 1e4
    // hard 10 s ceiling to prevent infinite loops
  });
  let handler = null;
  const exported = sandbox.__edge_fn__;
  if (exported?.default && typeof exported.default === "function") {
    handler = exported.default;
  } else if (getDenoHandler()) {
    handler = getDenoHandler();
  }
  if (!handler) {
    throw new Error(
      "No handler found. Your edge function must either:\n  \u2022 export default a function (req: Request) => Response\n  \u2022 call Deno.serve(handler)"
    );
  }
  const response = await handler(request);
  if (!(response instanceof Response)) {
    throw new Error(
      `Handler returned ${typeof response} instead of a Response object.`
    );
  }
  const durationMs = performance.now() - start;
  return { response, durationMs };
}

// src/server.ts
function collectBody(req) {
  return new Promise((resolve3, reject) => {
    const chunks = [];
    req.on("data", (c) => chunks.push(c));
    req.on("end", () => resolve3(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}
function toWebRequest(req, body, baseUrl) {
  const url = new URL(req.url || "/", baseUrl);
  const headers = new Headers();
  for (const [key, val] of Object.entries(req.headers)) {
    if (!val) continue;
    if (Array.isArray(val)) val.forEach((v) => headers.append(key, v));
    else headers.set(key, val);
  }
  const init = { method: req.method, headers };
  const hasBody = req.method !== "GET" && req.method !== "HEAD" && body.length > 0;
  if (hasBody) {
    init.body = body;
    init.duplex = "half";
  }
  return new Request(url.toString(), init);
}
function createServer2(options) {
  const filePath = path.resolve(options.file);
  const baseUrl = `http://localhost:${options.port}`;
  return http.createServer(async (req, res) => {
    const reqStart = performance.now();
    try {
      const body = await collectBody(req);
      if (options.verbose) {
        logVerboseBody("\u2190 request body", body.toString("utf-8"));
      }
      const compiled = await compileEdgeFunction(filePath);
      const webReq = toWebRequest(req, body, baseUrl);
      const { response, durationMs } = await executeEdgeFunction(
        compiled.code,
        webReq
      );
      const responseBody = Buffer.from(await response.arrayBuffer());
      res.writeHead(response.status, Object.fromEntries(response.headers));
      res.end(responseBody);
      if (options.verbose) {
        logVerboseBody("\u2192 response body", responseBody.toString("utf-8"));
      }
      logRequest({
        method: req.method || "UNKNOWN",
        url: req.url || "/",
        status: response.status,
        durationMs,
        compilationMs: compiled.durationMs,
        timestamp: /* @__PURE__ */ new Date()
      });
    } catch (err) {
      logError("Request handling failed", err);
      if (!res.headersSent) {
        res.writeHead(500, { "Content-Type": "application/json" });
      }
      res.end(
        JSON.stringify({
          error: "Edge function execution failed",
          message: err.message
        })
      );
    }
  });
}

// src/index.ts
function parseArgs(argv) {
  const opts = {
    port: 3e3,
    file: "",
    watch: false,
    verbose: false
  };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    switch (arg) {
      case "-p":
      case "--port":
        opts.port = Number(argv[++i]);
        if (Number.isNaN(opts.port) || opts.port < 1 || opts.port > 65535) {
          logError("Invalid port number. Must be between 1 and 65535.");
          process.exit(1);
        }
        break;
      case "-f":
      case "--file":
        opts.file = argv[++i];
        break;
      case "-w":
      case "--watch":
        opts.watch = true;
        break;
      case "-v":
      case "--verbose":
        opts.verbose = true;
        break;
      case "-h":
      case "--help":
        printHelp();
        process.exit(0);
        break;
      default:
        if (!opts.file && !arg.startsWith("-")) {
          opts.file = arg;
        }
        break;
    }
  }
  return opts;
}
function printHelp() {
  const B = "\x1B[1m";
  const C2 = "\x1B[36m";
  const R = "\x1B[0m";
  const D = "\x1B[2m";
  console.log(`
  ${B}${C2} __|  _ \\   __|  __|     \\  |   _ \\   __|  |  /${R}
  ${B}${C2} _|   |  | (_ |  _|     |\\/  |  (   | (     . < ${R}
  ${B}${C2}___| ___/ \\___| ___|   _|  _| \\___/ \\___| _|\\_ \\${R}
  ${D}\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500${R}
  ${D}v1.0.0${R}  Universal Local Edge Function Mocker

  ${B}USAGE${R}
    edge-mock --file <path> [options]
    edge-mock <path>        (shorthand)

  ${"\x1B[1m"}OPTIONS${"\x1B[0m"}
    -f, --file <path>       Path to edge function (.ts / .js)  ${"\x1B[2m"}required${"\x1B[0m"}
    -p, --port <number>     Port to listen on                  ${"\x1B[2m"}default: 3000${"\x1B[0m"}
    -w, --watch             Reload when the function file changes
    -v, --verbose           Print request/response bodies
    -h, --help              Show this message

  ${"\x1B[1m"}EXAMPLES${"\x1B[0m"}
    edge-mock -f ./functions/webhook.ts
    edge-mock -f ./handler.ts -p 8080 --watch --verbose

  ${"\x1B[1m"}SUPPORTED PATTERNS${"\x1B[0m"}
    \u2022 export default function handler(req: Request): Response
    \u2022 Deno.serve((req) => new Response("ok"))
`);
}
function main() {
  const opts = parseArgs(process.argv.slice(2));
  if (!opts.file) {
    logError("Missing required argument: --file <path>");
    printHelp();
    process.exit(1);
  }
  const resolved = path2.resolve(opts.file);
  if (!fs.existsSync(resolved)) {
    logError(`File not found: ${resolved}`);
    process.exit(1);
  }
  opts.file = resolved;
  const server = createServer2(opts);
  server.listen(opts.port, () => logBanner(opts.port, opts.file));
  if (opts.watch) {
    fs.watch(resolved, (event) => {
      if (event === "change") logWatch(resolved);
    });
  }
  const shutdown = () => {
    logInfo("Shutting down");
    server.close(() => process.exit(0));
    setTimeout(() => process.exit(0), 3e3).unref();
  };
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}
main();
