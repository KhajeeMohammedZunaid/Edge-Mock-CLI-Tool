# Universal Local Edge Function Mocker

## Project Overview
A lightweight, vendor-agnostic CLI tool designed to test serverless edge functions and database webhooks locally without requiring heavy Docker containers or full replica environments. 

## Target Problem
Testing backend webhooks (like Supabase database triggers or Stripe events) locally introduces severe development friction. Currently, developers must either deploy blindly to a staging environment or spin up heavy, battery-draining containerized infrastructure just to verify a simple TypeScript function.

## Architecture & Execution Flow
The tool operates entirely at the HTTP and Web Standard layers, ensuring it works universally across any platform's webhooks.

* **1. The Ingestion Layer:** A native local HTTP server acts as a blank canvas, listening for incoming webhook payloads (raw byte streams) from any external source or database.
* **2. Instant Compilation:** Instead of forcing a manual build step, the target TypeScript edge function is compiled in memory instantly upon receiving the webhook request.
* **3. The Web API Polyfill:** Edge functions expect standard Web APIs, not Node.js structures. The tool translates the raw HTTP incoming message into a standard Web `Request` object.
* **4. The Sandbox Execution:** The compiled TypeScript logic is executed securely inside an isolated Virtual Machine (VM) context, injecting the polyfilled Web APIs (`Request`, `Response`, `fetch`).
* **5. Terminal Output:** Once the function returns a `Response`, the CLI extracts the status code and body, forwards it to the caller, and outputs clean, precise execution logs (time taken, status code) to the developer's terminal.

## Core Tool Requirements
To build this utility using pure code, the CLI must implement the following foundational pieces:
* A native Node HTTP interceptor to catch the payloads.
* An ultra-fast bundler (e.g., `esbuild`) configured for on-the-fly, in-memory compilation.
* Node's native `vm` module to create the secure execution sandbox.
* Strict polyfills that map the Node runtime environment to modern Web Standards.