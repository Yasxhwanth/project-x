import { searchCreatorsWithAi } from '../services/aiCreatorSearch.js';
import { getCreatorMemory } from '../services/creatorMemoryService.js';
import { validateNegotiationGuardrails } from '../agents/agentGuardrails.js';
import { analyzeVideoWithVideoDB } from '../services/videoDbService.js';
import { executePaymentAuthorization } from '../agents/paymentAgent.js';
import { createEscalationTicket } from '../engine/orchestrator.js';
import { runDb } from '../database/sqliteDb.js';
import { v4 as uuidv4 } from 'uuid';

/**
 * 🛠️ AI Agent Tools Registry & Function Calling Engine (agentToolsRegistry.js)
 * 
 * Provides OpenAI / Gemini compatible function definitions and deterministic execution.
 */

// 1. Tool Schemas (OpenAI & Gemini Function Declarations)
export const AGENT_TOOL_SCHEMAS = [
  {
    name: 'search_creators_qualitative',
    description: 'Searches for influencers based on niche, platform, budget, and qualitative bio/engagement criteria.',
    parameters: {
      type: 'OBJECT',
      properties: {
        query: { type: 'STRING', description: 'Search term or niche e.g. "wireless earbuds tech review"' },
        maxBudget: { type: 'NUMBER', description: 'Maximum budget ceiling per creator in INR (₹)' },
        platform: { type: 'STRING', description: 'Target platform: INSTAGRAM or YOUTUBE' }
      },
      required: ['query']
    }
  },
  {
    name: 'query_creator_memory',
    description: 'Retrieves historical relationship memory, past agreed rates, and response metrics for a creator to eliminate cold starts.',
    parameters: {
      type: 'OBJECT',
      properties: {
        creatorHandle: { type: 'STRING', description: 'Creator Instagram or YouTube handle e.g. "@fittuber"' }
      },
      required: ['creatorHandle']
    }
  },
  {
    name: 'evaluate_counter_offer',
    description: 'Audits creator requested rate against guardrail policies, TDS taxes, and budget ceilings.',
    parameters: {
      type: 'OBJECT',
      properties: {
        requestedRate: { type: 'NUMBER', description: 'Requested fee in INR (₹)' },
        maxBudgetCap: { type: 'NUMBER', description: 'Maximum allowed campaign cap per creator in INR (₹)' },
        dealId: { type: 'STRING', description: 'Active deal identifier' },
        creatorName: { type: 'STRING', description: 'Creator full name' }
      },
      required: ['requestedRate', 'maxBudgetCap', 'dealId']
    }
  },
  {
    name: 'trigger_videodb_audit',
    description: 'Initiates multimodal VideoDB AI video verification for speech-to-text transcript matching, logo bounding boxes, and compliance score calculation.',
    parameters: {
      type: 'OBJECT',
      properties: {
        dealId: { type: 'STRING', description: 'Deal identifier' },
        videoUrl: { type: 'STRING', description: 'Submitted Instagram Reel or YouTube Shorts video URL' }
      },
      required: ['dealId', 'videoUrl']
    }
  },
  {
    name: 'disburse_upi_payout',
    description: 'Calculates Section 194J 10% TDS tax withholding and dispatches net UPI instant payout.',
    parameters: {
      type: 'OBJECT',
      properties: {
        dealId: { type: 'STRING', description: 'Deal identifier' },
        grossPrice: { type: 'NUMBER', description: 'Gross agreed campaign price in INR (₹)' },
        upiId: { type: 'STRING', description: 'Creator UPI VPA handle e.g. "fittuber@upi"' }
      },
      required: ['dealId', 'grossPrice', 'upiId']
    }
  },
  {
    name: 'create_human_escalation',
    description: 'Escalates policy violations, budget breaches, or safety risks to human brand managers in Agent Control Plane.',
    parameters: {
      type: 'OBJECT',
      properties: {
        dealId: { type: 'STRING', description: 'Deal identifier' },
        title: { type: 'STRING', description: 'Escalation ticket title' },
        description: { type: 'STRING', description: 'Detailed reason for human intervention' },
        riskLevel: { type: 'STRING', description: 'LOW, MEDIUM, HIGH, or CRITICAL' }
      },
      required: ['dealId', 'title', 'description']
    }
  }
];

/**
 * Deterministic Tool Execution Handler
 */
export async function executeAgentTool({ toolName, args, context = {} }) {
  const runId = 'tool_' + uuidv4().substring(0, 8);
  console.log(`🛠️ [Tool Engine] Executing AI tool "${toolName}" with args:`, JSON.stringify(args));

  let result = null;
  let success = true;
  let errorMessage = null;

  try {
    switch (toolName) {
      case 'search_creators_qualitative': {
        result = await searchCreatorsWithAi({
          query: args.query,
          organizationId: context.organizationId,
          maxBudget: args.maxBudget || 50000
        });
        break;
      }

      case 'query_creator_memory': {
        result = await getCreatorMemory(args.creatorHandle);
        break;
      }

      case 'evaluate_counter_offer': {
        result = validateNegotiationGuardrails({
          requestedRate: args.requestedRate,
          maxBudgetCap: args.maxBudgetCap,
          creatorName: args.creatorName || 'Creator',
          dealId: args.dealId
        });
        break;
      }

      case 'trigger_videodb_audit': {
        result = await analyzeVideoWithVideoDB({
          videoUrl: args.videoUrl,
          campaign: context.campaign || { brandName: 'boAt', productName: 'Airdopes Pro' },
          deal: { id: args.dealId }
        });
        break;
      }

      case 'disburse_upi_payout': {
        result = await executePaymentAuthorization({
          dealId: args.dealId,
          grossPrice: args.grossPrice,
          upiId: args.upiId,
          actorAgent: context.actorAgent || 'Tool Execution Engine'
        });
        break;
      }

      case 'create_human_escalation': {
        result = await createEscalationTicket({
          dealId: args.dealId,
          campaignId: context.campaignId,
          agentName: context.actorAgent || 'AI Agent Tool',
          riskLevel: args.riskLevel || 'HIGH',
          title: args.title,
          description: args.description,
          policyViolated: 'Guardrail.PolicyBreach',
          proposedAction: 'Escalated for 1-click human confirmation'
        });
        break;
      }

      default:
        throw new Error(`Tool "${toolName}" not found in AI Agent Tools Registry`);
    }
  } catch (err) {
    success = false;
    errorMessage = err.message;
    console.error(`❌ [Tool Engine] Tool "${toolName}" failed:`, err);
  }

  // Record tool execution audit run in SQLite
  try {
    await runDb(`
      INSERT INTO agent_runs (id, agent_name, campaign_id, deal_id, input_json, tools_used, actions_taken, result, confidence)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      runId, context.actorAgent || 'AI Tool Engine', context.campaignId || null, args.dealId || null,
      JSON.stringify(args), toolName, `Executed tool: ${toolName}`,
      success ? 'SUCCESS' : `FAILED: ${errorMessage}`, success ? 1.0 : 0.0
    ]);
  } catch (dbErr) {
    console.error('[Tool Engine] Audit log save error:', dbErr.message);
  }

  return {
    toolName,
    runId,
    success,
    result,
    error: errorMessage
  };
}
