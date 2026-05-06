interface MessageCreateParamsBase {
  model: string;
  messages: any[];
  system?: any;
  temperature?: number;
  tools?: any[];
  stream?: boolean;
}


/**
 * Validates OpenAI format messages to ensure complete tool_calls/tool message pairing.
 * Requires tool messages to immediately follow assistant messages with tool_calls.
 * Enforces strict immediate following sequence between tool_calls and tool messages.
 */
function validateOpenAIToolCalls(messages: any[]): any[] {
  const validatedMessages: any[] = [];
  
  for (let i = 0; i < messages.length; i++) {
    const currentMessage = { ...messages[i] };
    
    // Process assistant messages with tool_calls
    if (currentMessage.role === "assistant" && currentMessage.tool_calls) {
      const validToolCalls: any[] = [];
      const removedToolCallIds: string[] = [];
      
      // Collect all immediately following tool messages
      const immediateToolMessages: any[] = [];
      let j = i + 1;
      while (j < messages.length && messages[j].role === "tool") {
        immediateToolMessages.push(messages[j]);
        j++;
      }
      
      // For each tool_call, check if there's an immediately following tool message
      currentMessage.tool_calls.forEach((toolCall: any) => {
        const hasImmediateToolMessage = immediateToolMessages.some(toolMsg => 
          toolMsg.tool_call_id === toolCall.id
        );
        
        if (hasImmediateToolMessage) {
          validToolCalls.push(toolCall);
        } else {
          removedToolCallIds.push(toolCall.id);
        }
      });
      
      // Update the assistant message
      if (validToolCalls.length > 0) {
        currentMessage.tool_calls = validToolCalls;
      } else {
        delete currentMessage.tool_calls;
      }
      
      
      // Only include message if it has content or valid tool_calls
      if (currentMessage.content || currentMessage.tool_calls) {
        validatedMessages.push(currentMessage);
      }
    }
    
    // Process tool messages
    else if (currentMessage.role === "tool") {
      let hasImmediateToolCall = false;
      
      // Check if the immediately preceding assistant message has matching tool_call
      if (i > 0) {
        const prevMessage = messages[i - 1];
        if (prevMessage.role === "assistant" && prevMessage.tool_calls) {
          hasImmediateToolCall = prevMessage.tool_calls.some((toolCall: any) => 
            toolCall.id === currentMessage.tool_call_id
          );
        } else if (prevMessage.role === "tool") {
          // Check for assistant message before the sequence of tool messages
          for (let k = i - 1; k >= 0; k--) {
            if (messages[k].role === "tool") continue;
            if (messages[k].role === "assistant" && messages[k].tool_calls) {
              hasImmediateToolCall = messages[k].tool_calls.some((toolCall: any) => 
                toolCall.id === currentMessage.tool_call_id
              );
            }
            break;
          }
        }
      }
      
      if (hasImmediateToolCall) {
        validatedMessages.push(currentMessage);
      }
    }
    
    // For all other message types, include as-is
    else {
      validatedMessages.push(currentMessage);
    }
  }
  
  return validatedMessages;
}

// Model configuration - set from extension
interface ModelConfig {
  haikuModel: string;
  sonnetModel: string;
  opusModel: string;
}

let modelConfig: ModelConfig | null = null;

export function setModelConfig(config: ModelConfig): void {
  modelConfig = config;
  console.log('[Router] Model config updated:', config);
}

export function mapModel(anthropicModel: string): string {
  console.log('[Router] Mapping model:', anthropicModel);

  // If model already contains '/', it's already a provider model ID - return as-is
  if (anthropicModel.includes('/')) {
    console.log(`[Router] Model already has provider prefix, passing through: ${anthropicModel}`);
    return anthropicModel;
  }

  if (!modelConfig) {
    console.log('[Router] No model config set, returning as-is');
    return anthropicModel;
  }

  if (anthropicModel.includes('haiku') && modelConfig.haikuModel) {
    console.log(`[Router] Mapping haiku -> ${modelConfig.haikuModel}`);
    return modelConfig.haikuModel;
  } else if (anthropicModel.includes('sonnet') && modelConfig.sonnetModel) {
    console.log(`[Router] Mapping sonnet -> ${modelConfig.sonnetModel}`);
    return modelConfig.sonnetModel;
  } else if (anthropicModel.includes('opus') && modelConfig.opusModel) {
    console.log(`[Router] Mapping opus -> ${modelConfig.opusModel}`);
    return modelConfig.opusModel;
  }

  console.log(`[Router] No mapping found for model: ${anthropicModel}, passing through`);
  return anthropicModel;
}

export function formatAnthropicToOpenAI(body: MessageCreateParamsBase): any {
  const { model, messages, system = [], temperature, tools, stream } = body;

  const openAIMessages = Array.isArray(messages)
    ? messages.flatMap((anthropicMessage) => {
        const openAiMessagesFromThisAnthropicMessage: any[] = [];

        if (!Array.isArray(anthropicMessage.content)) {
          if (typeof anthropicMessage.content === "string") {
            openAiMessagesFromThisAnthropicMessage.push({
              role: anthropicMessage.role,
              content: anthropicMessage.content,
            });
          }
          return openAiMessagesFromThisAnthropicMessage;
        }

        if (anthropicMessage.role === "assistant") {
          const assistantMessage: any = {
            role: "assistant",
            content: null,
          };
          let textContent = "";
          const toolCalls: any[] = [];

          anthropicMessage.content.forEach((contentPart: any) => {
            if (contentPart.type === "text") {
              textContent += (typeof contentPart.text === "string"
                ? contentPart.text
                : JSON.stringify(contentPart.text)) + "\n";
            } else if (contentPart.type === "tool_use") {
              toolCalls.push({
                id: contentPart.id,
                type: "function",
                function: {
                  name: contentPart.name,
                  arguments: JSON.stringify(contentPart.input),
                },
              });
            }
          });

          const trimmedTextContent = textContent.trim();
          if (trimmedTextContent.length > 0) {
            assistantMessage.content = trimmedTextContent;
          }
          if (toolCalls.length > 0) {
            assistantMessage.tool_calls = toolCalls;
          }
          if (assistantMessage.content || (assistantMessage.tool_calls && assistantMessage.tool_calls.length > 0)) {
            openAiMessagesFromThisAnthropicMessage.push(assistantMessage);
          }
        } else if (anthropicMessage.role === "user") {
          let userTextMessageContent = "";
          const subsequentToolMessages: any[] = [];

          anthropicMessage.content.forEach((contentPart: any) => {
            if (contentPart.type === "text") {
              userTextMessageContent += (typeof contentPart.text === "string"
                ? contentPart.text
                : JSON.stringify(contentPart.text)) + "\n";
            } else if (contentPart.type === "tool_result") {
              subsequentToolMessages.push({
                role: "tool",
                tool_call_id: contentPart.tool_use_id,
                content: typeof contentPart.content === "string"
                  ? contentPart.content
                  : JSON.stringify(contentPart.content),
              });
            }
          });

          const trimmedUserText = userTextMessageContent.trim();
          if (trimmedUserText.length > 0) {
            openAiMessagesFromThisAnthropicMessage.push({
              role: "user",
              content: trimmedUserText,
            });
          }
          openAiMessagesFromThisAnthropicMessage.push(...subsequentToolMessages);
        }
        return openAiMessagesFromThisAnthropicMessage;
      })
    : [];

  const systemMessages = Array.isArray(system)
    ? system.map((item) => ({
        role: "system",
        content: typeof item === "string" ? item : item.text
      }))
    : typeof system === "string" && system.length > 0
      ? [{ role: "system", content: system }]
      : [];

  const data: any = {
    model: mapModel(model),
    messages: [...systemMessages, ...openAIMessages],
    temperature,
    stream,
  };

  // Request usage stats in streaming responses
  if (stream) {
    data.stream_options = { include_usage: true };
  }

  if (tools) {
    data.tools = tools.map((item: any) => ({
      type: "function",
      function: {
        name: item.name,
        description: item.description,
        parameters: item.input_schema,
      },
    }));
  }

  // Validate OpenAI messages to ensure complete tool_calls/tool message pairing
  data.messages = [...systemMessages, ...validateOpenAIToolCalls(openAIMessages)];

  return data;
}