export function streamOpenAIToAnthropic(openaiStream: ReadableStream, model: string): ReadableStream {
  const messageId = "msg_" + Date.now();

  const enqueueSSE = (controller: ReadableStreamDefaultController, eventType: string, data: any) => {
    const sseMessage = `event: ${eventType}\ndata: ${JSON.stringify(data)}\n\n`;
    controller.enqueue(new TextEncoder().encode(sseMessage));
  };

  return new ReadableStream({
    async start(controller) {
      // Send message_start event
      const messageStart = {
        type: "message_start",
        message: {
          id: messageId,
          type: "message",
          role: "assistant",
          content: [],
          model,
          stop_reason: null,
          stop_sequence: null,
          usage: { input_tokens: 0, output_tokens: 0 },
        },
      };
      enqueueSSE(controller, "message_start", messageStart);

      let contentBlockIndex = 0;
      let hasAnyBlock = false;
      let hasStartedTextBlock = false;
      let isToolUse = false;
      let currentToolCallId: string | null = null;
      let toolCallJsonMap = new Map<string, string>();
      let streamUsage: { input_tokens: number; output_tokens: number } | null = null;

      const reader = openaiStream.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            // Process any remaining data in buffer
            if (buffer.trim()) {
              const lines = buffer.split('\n');
              for (const line of lines) {
                if (line.trim() && line.startsWith('data: ')) {
                  const data = line.slice(6).trim();
                  if (data === '[DONE]') continue;

                  try {
                    const parsed = JSON.parse(data);
                    processStreamChunk(parsed);
                  } catch (e) {
                    // Parse error
                  }
                }
              }
            }
            break;
          }

          // Decode chunk and add to buffer
          const chunk = decoder.decode(value, { stream: true });
          buffer += chunk;

          // Process complete lines from buffer
          const lines = buffer.split('\n');
          // Keep the last potentially incomplete line in buffer
          buffer = lines.pop() || '';

          // Process complete lines in order
          for (const line of lines) {
            if (line.trim() && line.startsWith('data: ')) {
              const data = line.slice(6).trim();
              if (data === '[DONE]') continue;

              try {
                const parsed = JSON.parse(data);
                processStreamChunk(parsed);
              } catch (e) {
                // Parse error
                continue;
              }
            }
          }
        }
      } finally {
        reader.releaseLock();
      }

      function processStreamChunk(parsed: any) {
        // Capture usage from the chunk if available
        if (parsed.usage) {
          streamUsage = {
            input_tokens: parsed.usage.prompt_tokens || 0,
            output_tokens: parsed.usage.completion_tokens || 0,
          };
        }

        const delta = parsed.choices?.[0]?.delta;
        if (delta) {
          processStreamDelta(delta);
        }
      }

      function closeCurrentBlock() {
        if (hasAnyBlock) {
          enqueueSSE(controller, "content_block_stop", {
            type: "content_block_stop",
            index: contentBlockIndex,
          });
          contentBlockIndex++;
        }
        hasAnyBlock = true;
      }

      function processStreamDelta(delta: any) {

        // Handle tool calls
        if (delta.tool_calls?.length > 0) {
          for (const toolCall of delta.tool_calls) {
            const toolCallId = toolCall.id;

            if (toolCallId && toolCallId !== currentToolCallId) {
              closeCurrentBlock();

              isToolUse = true;
              hasStartedTextBlock = false;
              currentToolCallId = toolCallId;
              toolCallJsonMap.set(toolCallId, "");

              const toolBlock = {
                type: "tool_use",
                id: toolCallId,
                name: toolCall.function?.name,
                input: {},
              };

              enqueueSSE(controller, "content_block_start", {
                type: "content_block_start",
                index: contentBlockIndex,
                content_block: toolBlock,
              });
            }

            if (toolCall.function?.arguments && currentToolCallId) {
              const currentJson = toolCallJsonMap.get(currentToolCallId) || "";
              toolCallJsonMap.set(currentToolCallId, currentJson + toolCall.function.arguments);

              enqueueSSE(controller, "content_block_delta", {
                type: "content_block_delta",
                index: contentBlockIndex,
                delta: {
                  type: "input_json_delta",
                  partial_json: toolCall.function.arguments,
                },
              });
            }
          }
        } else if (delta.content) {
          if (isToolUse) {
            closeCurrentBlock();
            isToolUse = false;
            currentToolCallId = null;
          }

          if (!hasStartedTextBlock) {
            if (!hasAnyBlock) {
              hasAnyBlock = true;
            }
            enqueueSSE(controller, "content_block_start", {
              type: "content_block_start",
              index: contentBlockIndex,
              content_block: {
                type: "text",
                text: "",
              },
            });
            hasStartedTextBlock = true;
          }

          enqueueSSE(controller, "content_block_delta", {
            type: "content_block_delta",
            index: contentBlockIndex,
            delta: {
              type: "text_delta",
              text: delta.content,
            },
          });
        }
      }

      // Close last content block
      if (hasAnyBlock) {
        enqueueSSE(controller, "content_block_stop", {
          type: "content_block_stop",
          index: contentBlockIndex,
        });
      }

      // Send message_delta and message_stop
      enqueueSSE(controller, "message_delta", {
        type: "message_delta",
        delta: {
          stop_reason: isToolUse ? "tool_use" : "end_turn",
          stop_sequence: null,
        },
        usage: streamUsage || { input_tokens: 0, output_tokens: 0 },
      });

      enqueueSSE(controller, "message_stop", {
        type: "message_stop",
      });

      controller.close();
    },
  });
}
