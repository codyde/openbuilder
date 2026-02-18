/**
 * Native Claude Agent SDK Integration
 * 
 * This is the default SDK integration for AI-powered builds.
 * For multi-provider support, set ENABLE_OPENCODE_SDK=true to use opencode-sdk.ts instead.
 *
 * This module provides direct integration with the official @anthropic-ai/claude-agent-sdk
 * without going through the AI SDK or community provider layers.
 *
 * Benefits:
 * - Native message format (no transformation needed)
 * - Full access to SDK features (hooks, sessions, subagents)
 * - Simpler architecture with fewer dependencies
 * - Direct streaming without adaptation layer
 */

import { query, type SDKMessage, type Options } from '@anthropic-ai/claude-agent-sdk';
import * as Sentry from '@sentry/node';
import { existsSync, mkdirSync } from 'node:fs';
import { createProjectScopedPermissionHandler } from './permissions/project-scoped-handler.js';
import { getPlatformPluginDir } from './skills.js';
import {
  CLAUDE_SYSTEM_PROMPT,
  type ClaudeModelId,
  DEFAULT_CLAUDE_MODEL_ID,
} from '@hatchway/agent-core';

// Debug logging helper - suppressed in TUI mode (SILENT_MODE=1)
const debugLog = (message: string) => {
  if (process.env.SILENT_MODE !== '1' && process.env.DEBUG_BUILD === '1') {
    debugLog(message);
  }
};

// Message part types for multi-modal support
interface MessagePart {
  type: string;
  text?: string;
  image?: string;
  mimeType?: string;
  fileName?: string;
}

// Internal message format that matches our transformer expectations
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
 * Transform SDK messages to our internal format
 *
 * The SDK outputs messages in a format very similar to what our message transformer expects,
 * but we need to ensure consistent structure for downstream processing.
 */
function transformSDKMessage(sdkMessage: SDKMessage): TransformedMessage | null {
  switch (sdkMessage.type) {
    case 'assistant': {
      // Assistant messages contain the Claude response with text and tool use blocks
      return {
        type: 'assistant',
        message: {
          id: sdkMessage.uuid || `msg-${Date.now()}`,
          content: sdkMessage.message.content.map((block: { type: string; text?: string; id?: string; name?: string; input?: unknown; thinking?: string }) => {
            if (block.type === 'text') {
              return { type: 'text', text: block.text };
            } else if (block.type === 'tool_use') {
              return {
                type: 'tool_use',
                id: block.id,
                name: block.name,
                input: block.input,
              };
            } else if (block.type === 'thinking') {
              // Extended thinking blocks - pass through
              return { type: 'thinking', text: (block as { thinking?: string }).thinking };
            }
            return block as { type: string };
          }),
        },
      };
    }

    case 'user': {
      // User messages contain tool results
      const content = sdkMessage.message.content;
      const transformedContent = Array.isArray(content)
        ? content.map((block) => {
            if (typeof block === 'object' && block !== null) {
              const typedBlock = block as { type: string; tool_use_id?: string; content?: unknown; is_error?: boolean };
              if (typedBlock.type === 'tool_result') {
                return {
                  type: 'tool_result',
                  tool_use_id: typedBlock.tool_use_id,
                  content: typeof typedBlock.content === 'string'
                    ? typedBlock.content
                    : JSON.stringify(typedBlock.content),
                  is_error: typedBlock.is_error,
                };
              }
            }
            return block as { type: string };
          })
        : [{ type: 'text', text: String(content) }];

      return {
        type: 'user',
        message: {
          id: sdkMessage.uuid || `user-${Date.now()}`,
          content: transformedContent,
        },
      };
    }

    case 'result': {
      // Final result message with usage stats
      return {
        type: 'result',
        result: sdkMessage.subtype === 'success' ? sdkMessage.result : undefined,
        usage: sdkMessage.usage,
        subtype: sdkMessage.subtype,
        session_id: sdkMessage.session_id,
      };
    }

    case 'system': {
      // System messages (init, status, etc.)
      if (sdkMessage.subtype === 'init') {
        // Could emit session info if needed
        return null; // Skip for now - we don't need init messages in output
      }
      return null;
    }

    case 'stream_event': {
      // Partial streaming events - skip unless includePartialMessages is true
      // These are handled separately if needed
      return null;
    }

    default:
      return null;
  }
}

/**
 * Build prompt with image support for multi-modal messages
 */
function buildPromptWithImages(prompt: string, messageParts?: MessagePart[]): string {
  // For now, we pass images via the message format rather than prompt string
  // The SDK handles multi-modal via the prompt parameter accepting different formats
  // TODO: Investigate SDK support for image content in prompts
  return prompt;
}

/**
 * Create a native Claude query function using the official SDK directly
 *
 * This replaces the previous approach of:
 * claudeCode() provider -> AI SDK streamText() -> transformAISDKStream()
 *
 * With:
 * query() SDK function -> minimal transformation -> output
 * 
 * Sentry Integration:
 * - Manual gen_ai.* spans for AI Agent Monitoring in Sentry
 * - gen_ai.invoke_agent wraps the full query lifecycle
 * - gen_ai.execute_tool spans are emitted per tool call
 * - Token usage and cost are captured from the SDK result message
 */
export function createNativeClaudeQuery(
  modelId: ClaudeModelId = DEFAULT_CLAUDE_MODEL_ID,
  abortController?: AbortController
) {
  return async function* nativeClaudeQuery(
    prompt: string,
    workingDirectory: string,
    systemPrompt: string,
    _agent?: string,
    _codexThreadId?: string,
    messageParts?: MessagePart[]
  ): AsyncGenerator<TransformedMessage, void, unknown> {
    debugLog('[runner] [native-sdk] 🎯 Starting native SDK query\n');
    debugLog(`[runner] [native-sdk] Model: ${modelId}\n`);
    debugLog(`[runner] [native-sdk] Working dir: ${workingDirectory}\n`);
    debugLog(`[runner] [native-sdk] Prompt length: ${prompt.length}\n`);

    // Build combined system prompt
    const systemPromptSegments: string[] = [CLAUDE_SYSTEM_PROMPT.trim()];
    if (systemPrompt && systemPrompt.trim().length > 0) {
      systemPromptSegments.push(systemPrompt.trim());
    }
    const appendedSystemPrompt = systemPromptSegments.join('\n\n');

    // Ensure working directory exists
    if (!existsSync(workingDirectory)) {
      console.log(`[native-sdk] Creating working directory: ${workingDirectory}`);
      mkdirSync(workingDirectory, { recursive: true });
    }
    
    // Platform skills are packaged as a local plugin for SDK discovery.
    const platformPluginDir = getPlatformPluginDir();
    const platformPlugins = platformPluginDir
      ? [{ type: 'local' as const, path: platformPluginDir }]
      : [];

    if (platformPlugins.length === 0) {
      Sentry.logger.warn('Agent starting without platform skills — degraded capabilities', {
        model: modelId,
        workingDirectory,
      });
    }

    // Check for multi-modal content
    const hasImages = messageParts?.some(p => p.type === 'image');
    if (hasImages) {
      const imageCount = messageParts?.filter(p => p.type === 'image').length || 0;
      debugLog(`[runner] [native-sdk] 🖼️  Multi-modal message with ${imageCount} image(s)\n`);
    }

    // Build the final prompt
    const finalPrompt = buildPromptWithImages(prompt, messageParts);

    // Configure SDK options
    const options: Options = {
      model: modelId,
      systemPrompt: {
        type: 'preset',
        preset: 'claude_code',
        append: appendedSystemPrompt,
      },
      cwd: workingDirectory,
      permissionMode: 'bypassPermissions',
      allowDangerouslySkipPermissions: true, // Required for bypassPermissions
      maxTurns: 100,
      additionalDirectories: [workingDirectory],
      plugins: platformPlugins,
      canUseTool: createProjectScopedPermissionHandler(workingDirectory),
      includePartialMessages: false, // We don't need streaming deltas
      settingSources: ['user', 'project'],
      env: {
        ...process.env,
        CLAUDE_CODE_MAX_OUTPUT_TOKENS: process.env.CLAUDE_CODE_MAX_OUTPUT_TOKENS ?? '64000',
        // Enable SDK debug logging for skill discovery diagnostics
        ...(process.env.DEBUG_SKILLS === '1' ? { DEBUG_CLAUDE_AGENT_SDK: '1' } : {}),
      },
      // Use preset tools from Claude Code
      tools: { type: 'preset', preset: 'claude_code' },
      // Pass abort controller for cancellation support
      // NOTE: There is a known bug in the Claude Agent SDK where AbortController
      // signals are not fully respected. When abort() is called, the SDK may
      // continue processing for several more turns before stopping.
      // See: https://github.com/anthropics/claude-code/issues/2970
      // See: https://github.com/anthropics/claude-agent-sdk-typescript/issues/46
      abortController,
      // Capture SDK internal stderr to debug skill discovery (suppressed in TUI mode)
      stderr: (data: string) => {
        if (process.env.SILENT_MODE !== '1') {
          if (data.toLowerCase().includes('skill') || data.includes('add-dir') || data.includes('additional')) {
            process.stderr.write(`[native-sdk:stderr] ${data}\n`);
          }
        }
      },
    };

    debugLog('[runner] [native-sdk] 🚀 Starting SDK query stream\n');
    if (process.env.SILENT_MODE !== '1') {
      process.stderr.write(`[native-sdk] plugins: ${JSON.stringify(platformPlugins.map(p => p.path))}\n`);
    }

    let messageCount = 0;
    let toolCallCount = 0;
    let textBlockCount = 0;

    // Create the gen_ai.invoke_agent span as a child of the current active span.
    //
    // We use startInactiveSpan because this is an async generator — we can't use
    // startSpan/startSpanManual (both require a callback, and yields can't cross
    // callback boundaries). startInactiveSpan creates a span that inherits the
    // parent from the current active span (build.runner, restored by engine.ts
    // via Sentry.withActiveSpan).
    //
    // For tool spans, we use Sentry.withActiveSpan(agentSpan, ...) to temporarily
    // make the agent span active so tool spans become its children.
    const agentSpan = Sentry.startInactiveSpan({
      op: 'gen_ai.invoke_agent',
      name: 'invoke_agent hatchway-builder',
      attributes: {
        'gen_ai.operation.name': 'invoke_agent',
        'gen_ai.agent.name': 'hatchway-builder',
        'gen_ai.request.model': modelId,
        'gen_ai.request.messages': JSON.stringify([{ role: 'user', content: finalPrompt.substring(0, 1000) }]),
        'gen_ai.request.available_tools': JSON.stringify(
          ['Bash', 'Read', 'Write', 'Edit', 'Glob', 'Grep', 'Task', 'TodoWrite', 'WebFetch']
            .map(name => ({ name, type: 'function' }))
        ),
      },
    });

    try {
      // Stream messages directly from the SDK
      for await (const sdkMessage of query({ prompt: finalPrompt, options })) {
        messageCount++;

        // Transform SDK message to our internal format
        const transformed = transformSDKMessage(sdkMessage);

        if (transformed) {
          // Track stats and emit gen_ai.execute_tool spans for tool calls
          if (transformed.type === 'assistant' && transformed.message?.content) {
            for (const block of transformed.message.content) {
              if (block.type === 'tool_use') {
                toolCallCount++;
                debugLog(`[runner] [native-sdk] 🔧 Tool call: ${block.name}\n`);

                // Emit a gen_ai.execute_tool span as a child of gen_ai.invoke_agent.
                // withActiveSpan temporarily makes agentSpan the active span so
                // the startSpan inside creates a proper child.
                Sentry.withActiveSpan(agentSpan, () => {
                  Sentry.startSpan(
                    {
                      op: 'gen_ai.execute_tool',
                      name: `execute_tool ${block.name}`,
                      attributes: {
                        'gen_ai.tool.name': block.name,
                        'gen_ai.tool.call_id': block.id,
                        'gen_ai.tool.input': JSON.stringify(block.input).substring(0, 1000),
                        'gen_ai.request.model': modelId,
                      },
                    },
                    () => {
                      // Span created and ended — marks the tool invocation point
                    }
                  );
                });
              } else if (block.type === 'text') {
                textBlockCount++;
              }
            }
          }

          yield transformed;
        }

        // Capture SDK init message — this is the authoritative source for skill discovery
        if (sdkMessage.type === 'system' && sdkMessage.subtype === 'init') {
          const initMsg = sdkMessage as {
            skills?: string[];
            tools?: string[];
            plugins?: { name: string; path: string }[];
            slash_commands?: string[];
            model?: string;
          };
          const discoveredSkills = initMsg.skills ?? [];
          const loadedPlugins = initMsg.plugins ?? [];
          const toolCount = (initMsg.tools ?? []).length;

          if (process.env.SILENT_MODE !== '1') {
            process.stderr.write(`[native-sdk] SDK init — skills: [${discoveredSkills.join(', ')}] (${discoveredSkills.length})\n`);
            process.stderr.write(`[native-sdk] SDK init — plugins: ${JSON.stringify(loadedPlugins)}\n`);
            process.stderr.write(`[native-sdk] SDK init — tools: ${toolCount} loaded\n`);
          }

          // Set discovered skills on the agent span
          if (agentSpan) {
            agentSpan.setAttribute('gen_ai.agent.skills', discoveredSkills.join(', '));
            agentSpan.setAttribute('gen_ai.agent.skill_count', discoveredSkills.length);
          }

          if (discoveredSkills.length > 0) {
            Sentry.logger.info('SDK initialized with skills', {
              skillCount: String(discoveredSkills.length),
              skills: discoveredSkills.join(', '),
              pluginCount: String(loadedPlugins.length),
              plugins: loadedPlugins.map(p => p.name).join(', '),
              toolCount: String(toolCount),
              model: initMsg.model ?? modelId,
              workingDirectory,
            });
          } else {
            Sentry.logger.warn('SDK initialized but no skills discovered', {
              pluginCount: String(loadedPlugins.length),
              plugins: JSON.stringify(loadedPlugins),
              toolCount: String(toolCount),
              model: initMsg.model ?? modelId,
              workingDirectory,
              platformPluginDir: platformPluginDir ?? 'null',
            });
          }
        }

        // Capture tool_use_summary messages — these indicate skill content loading
        if (sdkMessage.type === 'tool_use_summary') {
          const summaryMsg = sdkMessage as { summary?: string; preceding_tool_use_ids?: string[] };
          if (process.env.SILENT_MODE !== '1') {
            process.stderr.write(`[native-sdk] Tool use summary: ${summaryMsg.summary}\n`);
          }
        }

        // Capture result messages — record token usage and cost on the agent span
        if (sdkMessage.type === 'result') {
          const resultMsg = sdkMessage as {
            subtype?: string;
            result?: string;
            num_turns?: number;
            total_cost_usd?: number;
            usage?: {
              input_tokens?: number;
              output_tokens?: number;
              cache_read_input_tokens?: number;
              cache_creation_input_tokens?: number;
            };
            duration_ms?: number;
            duration_api_ms?: number;
          };

          if (agentSpan) {
            // Standard gen_ai token usage attributes (Sentry AI Agent Monitoring spec)
            agentSpan.setAttribute('gen_ai.usage.input_tokens', resultMsg.usage?.input_tokens ?? 0);
            agentSpan.setAttribute('gen_ai.usage.output_tokens', resultMsg.usage?.output_tokens ?? 0);
            agentSpan.setAttribute('gen_ai.usage.total_tokens',
              (resultMsg.usage?.input_tokens ?? 0) + (resultMsg.usage?.output_tokens ?? 0));
            if (resultMsg.usage?.cache_read_input_tokens) {
              agentSpan.setAttribute('gen_ai.usage.input_tokens.cached', resultMsg.usage.cache_read_input_tokens);
            }
            if (resultMsg.usage?.cache_creation_input_tokens) {
              agentSpan.setAttribute('gen_ai.usage.input_tokens.cache_write', resultMsg.usage.cache_creation_input_tokens);
            }

            // Response text (truncated for span safety)
            if (resultMsg.result) {
              agentSpan.setAttribute('gen_ai.response.text', JSON.stringify(resultMsg.result.substring(0, 1000)));
            }

            // Custom (non-spec) attributes for operational insight
            agentSpan.setAttribute('hatchway.cost_usd', resultMsg.total_cost_usd ?? 0);
            agentSpan.setAttribute('hatchway.num_turns', resultMsg.num_turns ?? 0);
            agentSpan.setAttribute('hatchway.num_tool_calls', toolCallCount);
            agentSpan.setAttribute('hatchway.result', resultMsg.subtype ?? 'unknown');
            agentSpan.setAttribute('hatchway.duration_ms', resultMsg.duration_ms ?? 0);
            agentSpan.setAttribute('hatchway.duration_api_ms', resultMsg.duration_api_ms ?? 0);
          }

          if (resultMsg.subtype === 'success') {
            debugLog(`[runner] [native-sdk] ✅ Query complete - ${resultMsg.num_turns} turns, $${resultMsg.total_cost_usd?.toFixed(4)} USD\n`);
          } else {
            debugLog(`[runner] [native-sdk] ⚠️  Query ended with: ${resultMsg.subtype}\n`);
          }
        }
      }

      debugLog(`[runner] [native-sdk] 📊 Stream complete - ${messageCount} messages, ${toolCallCount} tool calls, ${textBlockCount} text blocks\n`);
    } catch (error) {
      debugLog(`[runner] [native-sdk] ❌ Error: ${error instanceof Error ? error.message : String(error)}\n`);
      if (agentSpan) {
        agentSpan.setStatus({ code: 2, message: error instanceof Error ? error.message : String(error) });
      }
      Sentry.captureException(error);
      throw error;
    } finally {
      // End the agent span regardless of success/failure
      agentSpan?.end();
    }
  };
}

export type { TransformedMessage, MessagePart };
