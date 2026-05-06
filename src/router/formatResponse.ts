export function formatOpenAIToAnthropic(completion: any, model: string): any {
  const messageId = "msg_" + Date.now();
  const message = completion.choices[0].message;

  const content: any[] = [];
  if (message.content) {
    content.push({ text: message.content, type: "text" });
  }
  if (message.tool_calls) {
    for (const item of message.tool_calls) {
      content.push({
        type: 'tool_use',
        id: item.id,
        name: item.function?.name,
        input: item.function?.arguments ? JSON.parse(item.function.arguments) : {},
      });
    }
  }

  const hasToolUse = message.tool_calls && message.tool_calls.length > 0;
  const usage = completion.usage || {};

  const result = {
    id: messageId,
    type: "message",
    role: "assistant",
    content: content,
    stop_reason: hasToolUse ? "tool_use" : "end_turn",
    stop_sequence: null,
    model,
    usage: {
      input_tokens: usage.prompt_tokens || 0,
      output_tokens: usage.completion_tokens || 0,
    },
  };
  return result;
}