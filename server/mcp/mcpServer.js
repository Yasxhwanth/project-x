import { AGENT_TOOL_SCHEMAS, executeAgentTool } from '../tools/agentToolsRegistry.js';

/**
 * 🔌 Model Context Protocol (MCP) Server Module for Project X
 * 
 * Implements standard MCP (Model Context Protocol) JSON-RPC 2.0 specification over SSE & HTTP.
 * Allows external MCP clients (Claude Desktop, Cursor, Antigravity, LangChain) to connect to Project X.
 */

// Convert OpenAI/Gemini schemas to standard Anthropic/MCP Tool Schema
export function getMcpToolsList() {
  return AGENT_TOOL_SCHEMAS.map(tool => ({
    name: tool.name,
    description: tool.description,
    inputSchema: {
      type: 'object',
      properties: tool.parameters.properties,
      required: tool.parameters.required || []
    }
  }));
}

/**
 * Handle MCP JSON-RPC 2.0 requests
 */
export async function handleMcpRpcRequest(rpcPayload, context = {}) {
  const { jsonrpc, id, method, params } = rpcPayload || {};

  if (jsonrpc !== '2.0') {
    return {
      jsonrpc: '2.0',
      id: id || null,
      error: { code: -32600, message: 'Invalid Request: jsonrpc must be "2.0"' }
    };
  }

  try {
    switch (method) {
      case 'initialize':
        return {
          jsonrpc: '2.0',
          id,
          result: {
            protocolVersion: '2024-11-05',
            capabilities: { tools: {} },
            serverInfo: {
              name: 'project-x-mcp-server',
              version: '1.0.0'
            }
          }
        };

      case 'tools/list':
        return {
          jsonrpc: '2.0',
          id,
          result: {
            tools: getMcpToolsList()
          }
        };

      case 'tools/call': {
        const { name, arguments: args } = params || {};
        if (!name) {
          return {
            jsonrpc: '2.0',
            id,
            error: { code: -32602, message: 'Invalid params: tool "name" is required' }
          };
        }

        const toolResult = await executeAgentTool({
          toolName: name,
          args: args || {},
          context: { actorAgent: 'MCP External Client', ...context }
        });

        return {
          jsonrpc: '2.0',
          id,
          result: {
            content: [
              {
                type: 'text',
                text: JSON.stringify(toolResult.result || { success: toolResult.success, error: toolResult.error }, null, 2)
              }
            ],
            isError: !toolResult.success
          }
        };
      }

      default:
        return {
          jsonrpc: '2.0',
          id,
          error: { code: -32601, message: `Method not found: ${method}` }
        };
    }
  } catch (err) {
    return {
      jsonrpc: '2.0',
      id,
      error: { code: -32603, message: 'Internal MCP server error: ' + err.message }
    };
  }
}
