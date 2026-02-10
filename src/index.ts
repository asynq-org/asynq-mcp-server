#!/usr/bin/env node
import readline from "readline";

// Configuration from Environment
const ASYNQ_PAT = process.env.ASYNQ_PAT;
const ASYNQ_URL = process.env.ASYNQ_URL || "https://asynq.org/mcp";

// Validation
if (!ASYNQ_PAT) {
  console.error("Error: ASYNQ_PAT environment variable is missing.");
  process.exit(1);
}

// Setup Readline interface for JSON-RPC over Stdio
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false,
});

// Log startup to stderr (stderr is safe, stdout is for JSON-RPC)
console.error(`Asynq MCP Bridge started. Connecting to ${ASYNQ_URL}...`);

// Rate Limiter Implementation
class RateLimiter {
  private limit: number;
  private windowMs: number;
  private timestamps: number[];

  constructor(limit: number = 100, windowMs: number = 60000) {
    this.limit = limit;
    this.windowMs = windowMs;
    this.timestamps = [];
  }

  check(): { allowed: boolean; resetAt?: number } {
    const now = Date.now();
    const windowStart = now - this.windowMs;

    // Filter old timestamps
    this.timestamps = this.timestamps.filter((t: number) => t > windowStart);

    if (this.timestamps.length >= this.limit) {
      const oldest = this.timestamps[0];
      const resetAt = oldest + this.windowMs;
      return {
        allowed: false,
        resetAt,
      };
    }

    this.timestamps.push(now);
    return { allowed: true };
  }
}

const rateLimiter = new RateLimiter();

rl.on("line", async (line) => {
  if (!line.trim()) return;

  try {
    const request = JSON.parse(line);

    // Check Rate Limit locally
    const limitStatus = rateLimiter.check();
    if (!limitStatus.allowed) {
      const resetAt = limitStatus.resetAt || Date.now() + 60000;
      const resetInSeconds = Math.ceil((resetAt - Date.now()) / 1000);
      console.log(
        JSON.stringify({
          jsonrpc: "2.0",
          id: request.id,
          error: {
            code: -32000,
            message: `Local Rate Limit Exceeded. Please wait ${resetInSeconds}s.`,
          },
        }),
      );
      return;
    }

    // Forward the JSON-RPC request to Asynq MCP Server
    try {
      const response = await fetch(ASYNQ_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${ASYNQ_PAT}`,
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        // ... (rest of error handling)
        console.error(`HTTP Error: ${response.status} ${response.statusText}`);

        // Attempt to read error details if returned as JSON
        const text = await response.text();
        try {
          const errJson = JSON.parse(text);
          console.log(JSON.stringify(errJson));
        } catch {
          // Fallback generic JSON-RPC error
          const errorResponse = {
            jsonrpc: "2.0",
            id: request.id,
            error: {
              code: -32000,
              message: `HTTP Error ${response.status}: ${text.substring(0, 100)}`,
            },
          };
          console.log(JSON.stringify(errorResponse));
        }
        return;
      }

      // Proxy the successful JSON-RPC response back to stdout
      const data = await response.json();
      console.log(JSON.stringify(data));
    } catch (fetchError: any) {
      console.error("Fetch error:", fetchError);

      const errorResponse = {
        jsonrpc: "2.0",
        id: request.id,
        error: {
          code: -32000,
          message: fetchError.message || "Connection failed",
        },
      };
      console.log(JSON.stringify(errorResponse));
    }
  } catch (parseError) {
    console.error("JSON Parse error:", parseError);
  }
});
