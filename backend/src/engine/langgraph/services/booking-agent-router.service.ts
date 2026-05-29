import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AgentType } from '../../agent/interfaces/agent.interfaces.js';

export type AgentSurface = 'dashboard' | 'provider_mobile' | 'public_booking';

const AGENT_GRAPH_TYPES = new Set<AgentType>([
  AgentType.CANCELLATION_RECOVERY,
  AgentType.CONFLICT_RESOLUTION,
  AgentType.SCHEDULING_OPTIMIZATION,
]);

@Injectable()
export class BookingAgentRouterService {
  constructor(private readonly config: ConfigService) {}

  /** Master switch — enables LangGraph command orchestration + agent subgraphs. */
  isLangGraphEnabled(): boolean {
    return (
      this.config.get<string>('LANGGRAPH_ENABLED') === 'true' ||
      this.config.get<string>('LANGGRAPH_COMMANDS') === 'true' ||
      this.config.get<string>('LANGGRAPH_AGENTS') === 'true' ||
      this.config.get<string>('LANGGRAPH_CANCELLATION_RECOVERY') === 'true'
    );
  }

  useCommandGraph(): boolean {
    return (
      this.config.get<string>('LANGGRAPH_ENABLED') === 'true' ||
      this.config.get<string>('LANGGRAPH_COMMANDS') === 'true'
    );
  }

  useCompoundGraph(): boolean {
    return this.useCommandGraph();
  }

  /** ReAct tool-calling agent for orchestration / ambiguous prompts. */
  useReactAgent(): boolean {
    return (
      this.config.get<string>('LANGGRAPH_REACT_AGENT') === 'true' ||
      this.config.get<string>('LANGGRAPH_ENABLED') === 'true'
    );
  }

  useLangGraph(agentType: AgentType): boolean {
    if (!AGENT_GRAPH_TYPES.has(agentType)) return false;
    return (
      this.config.get<string>('LANGGRAPH_ENABLED') === 'true' ||
      this.config.get<string>('LANGGRAPH_AGENTS') === 'true' ||
      (agentType === AgentType.CANCELLATION_RECOVERY &&
        this.config.get<string>('LANGGRAPH_CANCELLATION_RECOVERY') === 'true')
    );
  }

  resolveSurface(_agentType: AgentType, hint?: AgentSurface): AgentSurface {
    return hint ?? 'dashboard';
  }
}
