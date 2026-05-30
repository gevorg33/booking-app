import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { END, START, StateGraph, Annotation, messagesStateReducer } from '@langchain/langgraph';
import { ChatOpenAI } from '@langchain/openai';
import {
  AIMessage,
  BaseMessage,
  HumanMessage,
  SystemMessage,
  ToolMessage,
  isAIMessage,
} from '@langchain/core/messages';
import type { StructuredToolInterface } from '@langchain/core/tools';
import { Business } from '../../../modules/business/entities/business.entity.js';
import { OpenAiIntegrationService } from '../../../modules/integrations/openai/openai-integration.service.js';
import { DEFAULT_OPENAI_MODEL } from '../../../modules/integrations/openai/openai.types.js';
import { BookingToolRegistryService } from '../tools/booking-tool-registry.service.js';
import type { BookingToolRunContext } from '../tools/booking-tool.types.js';
import type { AgentPlanStep } from '../../agent/interfaces/agent.interfaces.js';
import type { Employee } from '../../../modules/employee/entities/employee.entity.js';
import type { Service } from '../../../modules/service/entities/service.entity.js';

export interface ReactAgentRunInput {
  businessId: string;
  prompt: string;
  userId?: string;
  timeZone: string;
  employees: Employee[];
  services: Service[];
}

export interface ReactAgentRunOutput {
  messages: BaseMessage[];
  proposals: AgentPlanStep[];
  error?: string;
}

const ReactAgentState = Annotation.Root({
  messages: Annotation<BaseMessage[]>({
    reducer: messagesStateReducer,
    default: () => [],
  }),
  proposals: Annotation<BookingToolRunContext['proposals']>({
    reducer: (_prev, next) => next,
    default: () => [],
  }),
  toolContext: Annotation<Record<string, unknown>>({
    reducer: (prev, next) => ({ ...prev, ...next }),
    default: () => ({}),
  }),
  iterations: Annotation<number>({ reducer: (_p, n) => n, default: () => 0 }),
});

type ReactAgentGraphState = typeof ReactAgentState.State;

@Injectable()
export class ReactBookingAgentService {
  private readonly logger = new Logger(ReactBookingAgentService.name);
  private readonly maxIterations = 15;

  constructor(
    private readonly config: ConfigService,
    private readonly toolRegistry: BookingToolRegistryService,
    private readonly openAiIntegration: OpenAiIntegrationService,
    @InjectRepository(Business) private readonly businessRepo: Repository<Business>,
  ) {}

  async run(input: ReactAgentRunInput): Promise<ReactAgentRunOutput> {
    const apiKey = await this.resolveApiKey(input.businessId);
    if (!apiKey) {
      return { messages: [], proposals: [], error: 'OpenAI is not configured for ReAct agent.' };
    }

    const modelName =
      this.config.get<string>('OPENAI_MODEL')?.trim() || DEFAULT_OPENAI_MODEL;

    const runCtx: BookingToolRunContext = {
      businessId: input.businessId,
      userId: input.userId,
      timeZone: input.timeZone,
      toolContext: { businessId: input.businessId },
      stepCounter: 0,
      proposals: [],
      lastStepByAction: {},
      employees: input.employees.map((e) => ({
        id: e.id,
        name: e.name,
        serviceIds: e.serviceIds ?? [],
      })),
      services: input.services.map((s) => ({ id: s.id, name: s.name })),
    };

    const tools = this.toolRegistry.createTools(runCtx);
    const toolMap = new Map(tools.map((t) => [t.name, t]));

    const llm = new ChatOpenAI({
      apiKey,
      model: modelName,
      temperature: 0.15,
    }).bindTools(tools);

    const graph = this.buildGraph(llm, toolMap, runCtx);

    const systemPrompt = this.buildSystemPrompt(input);

    const finalState = (await graph.invoke(
      {
        messages: [new SystemMessage(systemPrompt), new HumanMessage(input.prompt)],
        proposals: [],
        toolContext: runCtx.toolContext,
        iterations: 0,
      },
      { recursionLimit: this.maxIterations * 2 + 4 },
    )) as ReactAgentGraphState;

    runCtx.proposals = finalState.proposals.length
      ? finalState.proposals
      : runCtx.proposals;

    return {
      messages: finalState.messages,
      proposals: runCtx.proposals,
    };
  }

  private buildGraph(
    llm: ReturnType<ChatOpenAI['bindTools']>,
    toolMap: Map<string, StructuredToolInterface>,
    runCtx: BookingToolRunContext,
  ) {
    const callModel = async (state: ReactAgentGraphState) => {
      if (state.iterations >= this.maxIterations) {
        return {
          messages: [
            new AIMessage(
              'I reached the maximum number of tool steps. Here is what I found so far — please refine your request if you need more.',
            ),
          ],
          iterations: state.iterations,
        };
      }

      const response = await llm.invoke(state.messages);
      return {
        messages: [response],
        iterations: state.iterations + 1,
        proposals: [...runCtx.proposals],
        toolContext: runCtx.toolContext,
      };
    };

    const callTools = async (state: ReactAgentGraphState) => {
      const last = state.messages.at(-1);
      if (!last || !isAIMessage(last) || !last.tool_calls?.length) {
        return { messages: [] };
      }

      const toolMessages: ToolMessage[] = [];

      for (const call of last.tool_calls) {
        const t = toolMap.get(call.name);
        let content: string;
        try {
          if (!t) {
            content = JSON.stringify({ error: `Unknown tool: ${call.name}` });
          } else {
            const args =
              typeof call.args === 'string' ? JSON.parse(call.args) : (call.args ?? {});
            content = String(await t.invoke(args));
          }
        } catch (err: any) {
          content = JSON.stringify({ error: err?.message ?? 'Tool failed' });
        }

        toolMessages.push(
          new ToolMessage({
            content,
            tool_call_id: call.id ?? call.name,
            name: call.name,
          }),
        );
      }

      return {
        messages: toolMessages,
        proposals: [...runCtx.proposals],
        toolContext: runCtx.toolContext,
      };
    };

    const shouldContinue = (state: ReactAgentGraphState): 'tools' | typeof END => {
      if (state.iterations >= this.maxIterations) return END;
      const last = state.messages.at(-1);
      if (last && isAIMessage(last) && last.tool_calls?.length) {
        return 'tools';
      }
      return END;
    };

    return new StateGraph(ReactAgentState)
      .addNode('agent', callModel)
      .addNode('tools', callTools)
      .addEdge(START, 'agent')
      .addConditionalEdges('agent', shouldContinue)
      .addEdge('tools', 'agent')
      .compile();
  }

  private buildSystemPrompt(input: ReactAgentRunInput): string {
    const employeeList = input.employees
      .map((e) => `${e.name} (id: ${e.id})`)
      .join(', ');
    const serviceList = input.services.map((s) => s.name).join(', ');

    return `You are Orchestrix — an AI operations agent for a salon/spa booking platform.

You have READ tools (safe, immediate) and PROPOSE tools (build approval plans — never claim you executed mutations).

## Strategy
1. READ first: list_appointments, fetch_current_schedule, detect_conflicts before any propose_*.
2. Use bulk tools when the user wants multiple items: propose_create_bookings_bulk, propose_clear_schedules_bulk, propose_create_services_bulk, propose_reschedule_bookings_bulk.
3. Use propose_compound_workflow for multi-command requests ("cancel X then clear schedule then hide") — one tool, chained steps.
4. Use propose_bulk_smart_cancel when user wants cancel + notify + waitlist recovery together.
5. Set chainPrevious=true on propose steps that must run AFTER a prior step in the same plan (e.g. hide after cancel).
6. For conditional booking ("book Gevorg at 9, else Mary, else whoever is free"), use check_slot_availability to verify each option OR propose_book_with_fallback in one step.
7. For "move/reschedule to nearest free time on {day}", use find_first_available_slot (not check_slot_availability), then propose_reschedule_booking with the returned ISO start time.
8. Stop calling tools once you have enough data to answer OR have submitted all proposals.

## Tool groups
- **Bookings:** list_appointments, check_slot_availability, find_first_available_slot, propose_create_booking(s), propose_book_with_fallback, propose_cancel_bookings, propose_bulk_smart_cancel, propose_reschedule_booking(s), propose_hide/unhide, propose_notify_customers, propose_execute_reassignment
- **Schedule:** fetch_current_schedule, propose_clear_schedule(s), propose_apply_schedule, propose_create_direct_schedule(s), propose_block_schedule, propose_fill_schedule_gaps
- **Analytics:** analyze_utilization, identify_schedule_gaps, generate_optimization_recommendations, detect_conflicts, analyze_resolution_options
- **Recovery:** find_freed_slots → find_rebooking_candidates → propose_rebooking
- **Catalog:** propose_create_service(s), propose_assign_employee_services
- **Compound:** propose_compound_workflow (any chained manager workflow, max 10 steps)

Context:
- Timezone: ${input.timeZone}
- Employees: ${employeeList || 'none'}
- Services: ${serviceList || 'none'}
- Dates: YYYY-MM-DD in tool args`;
  }

  private async resolveApiKey(businessId: string): Promise<string | null> {
    const business = await this.businessRepo.findOne({ where: { id: businessId } });
    if (!business) return null;
    const runtime = this.openAiIntegration.resolveRuntimeConfig(business.settings);
    return runtime?.apiKey ?? null;
  }
}
