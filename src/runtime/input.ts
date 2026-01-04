/**
 * Stdin AsyncIterable for streaming input mode
 */

import * as readline from "readline";
import type { SDKUserMessage } from "@anthropic-ai/claude-agent-sdk";

/**
 * Message queue for async iteration
 */
export class MessageQueue {
  private queue: SDKUserMessage[] = [];
  private resolvers: Array<(value: IteratorResult<SDKUserMessage>) => void> = [];
  private done = false;
  private sessionId = "";

  /**
   * Set session ID (called when session starts)
   */
  setSessionId(id: string): void {
    this.sessionId = id;
  }

  /**
   * Push a user message
   */
  push(content: string): void {
    if (this.done) return;

    const message: SDKUserMessage = {
      type: "user",
      session_id: this.sessionId,
      message: {
        role: "user",
        content,
      },
      parent_tool_use_id: null,
    };

    if (this.resolvers.length > 0) {
      const resolve = this.resolvers.shift()!;
      resolve({ value: message, done: false });
    } else {
      this.queue.push(message);
    }
  }

  /**
   * Close the queue
   */
  close(): void {
    this.done = true;
    for (const resolve of this.resolvers) {
      resolve({ value: undefined as unknown as SDKUserMessage, done: true });
    }
    this.resolvers = [];
  }

  /**
   * Check if closed
   */
  isClosed(): boolean {
    return this.done;
  }

  /**
   * Async iterator implementation
   */
  [Symbol.asyncIterator](): AsyncIterator<SDKUserMessage> {
    return {
      next: (): Promise<IteratorResult<SDKUserMessage>> => {
        if (this.queue.length > 0) {
          return Promise.resolve({ value: this.queue.shift()!, done: false });
        }

        if (this.done) {
          return Promise.resolve({
            value: undefined as unknown as SDKUserMessage,
            done: true,
          });
        }

        return new Promise((resolve) => {
          this.resolvers.push(resolve);
        });
      },
    };
  }
}

/**
 * Create readline interface for user input
 */
export function createReadlineInterface(): readline.Interface {
  return readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
}

/**
 * Read a line from stdin
 */
export function readLine(
  rl: readline.Interface,
  prompt: string
): Promise<string | null> {
  return new Promise((resolve) => {
    rl.question(prompt, (answer) => resolve(answer));
    rl.once("close", () => resolve(null));
  });
}
