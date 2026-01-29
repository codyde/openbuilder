/**
 * Factory Droid SDK Integration
 * 
 * This module provides integration with the Factory Droid SDK (droid-sdk)
 * for AI-powered builds. It wraps the DroidSession class and transforms
 * DroidEvents into the standard TransformedMessage format used by the runner.
 * 
 * Enable by setting agent to 'factory-droid' in build requests.
 */

import { DroidSession } from 'droid-sdk';
import type { DroidEvent, DroidSessionOptions } from 'droid-sdk';
import * as Sentry from '@sentry/node';
import { existsSync, mkdirSync } from 'node:fs';
import { ensureProjectSkills } from './skills.js';
import { CLAUDE_SYSTEM_PROMPT } from '@openbuilder/agent-core';

const debugLog = (message: string) => {
  if (process.env.SILENT_MODE !== '1' && process.env.DEBUG_BUILD === '1') {
    console.log(message);
  }
};

interface MessagePart {
  type: string;
  text?: string;
  image?: string;
  mimeType?: string;
  fileName?: string;
}

interface TransformedMessage {
  type: 'assistant' | 'user' | 'result' | 'system';
  message?: {
    id: string;
    content: Array<{
      type: string;
      text?: string;
      id?: string;
      name?: string;
      input?: unknown;
      tool_use_id?: string;
      content?: string;
      is_error?: boolean;
    }>;
  };
  result?: string;
  usage?: unknown;
  subtype?: string;
  session_id?: string;
}

/**
 * Transform a DroidEvent to our internal TransformedMessage format
 */
function transformDroidEvent(event: DroidEvent): TransformedMessage | null {
  switch (event.type) {
    case 'system': {
      // System init event - emit session info
      if (event.subtype === 'init') {
        return {
          type: 'system',
          subtype: 'init',
          session_id: event.session_id,
        };
      }
      return null;
    }

    case 'message': {
      // Message events from assistant
      if (event.role === 'assistant') {
        return {
          type: 'assistant',
          message: {
            id: event.id,
            content: [{ type: 'text', text: event.text }],
          },
        };
      }
      return null;
    }

    case 'tool_call': {
      // Tool call events - map to tool_use format
      return {
        type: 'assistant',
        message: {
          id: event.messageId,
          content: [{
            type: 'tool_use',
            id: event.toolId,
            name: event.toolName,
            input: event.parameters,
          }],
        },
      };
    }

    case 'tool_result': {
      // Tool result events - map to tool_result format
      return {
        type: 'user',
        message: {
          id: event.messageId,
          content: [{
            type: 'tool_result',
            tool_use_id: event.toolId,
            content: event.value,
            is_error: event.isError,
          }],
        },
      };
    }

    case 'completion': {
      // Completion event - final result
      return {
        type: 'result',
        result: event.finalText,
        session_id: event.session_id,
        usage: {
          numTurns: event.numTurns,
          durationMs: event.durationMs,
        },
      };
    }

    default:
      return null;
  }
}

/**
 * Create a Factory Droid query function
 * 
 * This implements the same BuildQueryFn interface as createNativeClaudeQuery
 * but uses the Factory Droid SDK instead.
 */
export function createDroidQuery(modelId?: string) {
  return async function* droidQuery(
    prompt: string,
    workingDirectory: string,
    systemPrompt: string,
    _agent?: string,
    _codexThreadId?: string,
    _messageParts?: MessagePart[]
  ): AsyncGenerator<TransformedMessage, void, unknown> {
    debugLog('[runner] [droid-sdk] Starting Factory Droid query');
    debugLog(`[runner] [droid-sdk] Model: ${modelId || 'default'}`);
    debugLog(`[runner] [droid-sdk] Working dir: ${workingDirectory}`);
    debugLog(`[runner] [droid-sdk] Prompt length: ${prompt.length}`);

    // Build combined system prompt
    const systemPromptSegments: string[] = [CLAUDE_SYSTEM_PROMPT.trim()];
    if (systemPrompt && systemPrompt.trim().length > 0) {
      systemPromptSegments.push(systemPrompt.trim());
    }
    const combinedSystemPrompt = systemPromptSegments.join('\n\n');

    // Ensure working directory exists
    if (!existsSync(workingDirectory)) {
      console.log(`[droid-sdk] Creating working directory: ${workingDirectory}`);
      mkdirSync(workingDirectory, { recursive: true });
    }

    // Ensure project has skills
    ensureProjectSkills(workingDirectory);

    // Configure DroidSession options
    const sessionOptions: DroidSessionOptions = {
      model: modelId,
      cwd: workingDirectory,
      autonomyLevel: 'high',
      systemPrompt: combinedSystemPrompt,
    };

    console.log('[runner] [droid-sdk] Creating DroidSession with options:', {
      model: modelId || 'default',
      cwd: workingDirectory,
      autonomyLevel: 'high',
      systemPromptLength: combinedSystemPrompt.length,
    });
    const session = new DroidSession(sessionOptions);

    let messageCount = 0;
    let toolCallCount = 0;

    try {
      debugLog('[runner] [droid-sdk] Sending prompt to Droid');

      // Stream events from the Droid SDK
      for await (const event of session.send(prompt)) {
        messageCount++;

        // Transform Droid event to our internal format
        const transformed = transformDroidEvent(event);

        if (transformed) {
          // Track stats
          if (event.type === 'tool_call') {
            toolCallCount++;
            debugLog(`[runner] [droid-sdk] Tool call: ${event.toolName}`);
          }

          yield transformed;
        }

        // Log completion
        if (event.type === 'completion') {
          debugLog(`[runner] [droid-sdk] Query complete - ${event.numTurns} turns, ${event.durationMs}ms`);
        }
      }

      debugLog(`[runner] [droid-sdk] Stream complete - ${messageCount} events, ${toolCallCount} tool calls`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : '';
      console.error(`[runner] [droid-sdk] ❌ Error: ${errorMessage}`);
      console.error(`[runner] [droid-sdk] Stack: ${errorStack}`);
      console.error(`[runner] [droid-sdk] Model: ${modelId || 'default'}`);
      console.error(`[runner] [droid-sdk] Working dir: ${workingDirectory}`);
      Sentry.captureException(error, {
        extra: {
          modelId,
          workingDirectory,
          promptLength: prompt.length,
        }
      });
      throw error;
    } finally {
      // Cleanup session
      await session.close();
    }
  };
}

export type { TransformedMessage, MessagePart };
