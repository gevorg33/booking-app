import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import {
  AgentType,
  AgentContext,
  AgentResult,
} from './interfaces/agent.interfaces.js';

export interface AgentHandler {
  type: AgentType;
  handle(context: AgentContext, intent: string): Promise<AgentResult>;
}

@Injectable()
export class AgentRegistryService {
  private readonly logger = new Logger(AgentRegistryService.name);
  private agents = new Map<AgentType, AgentHandler>();

  register(handler: AgentHandler): void {
    this.agents.set(handler.type, handler);
    this.logger.log(`Registered agent: ${handler.type}`);
  }

  get(type: AgentType): AgentHandler {
    const agent = this.agents.get(type);
    if (!agent) {
      throw new NotFoundException(`Agent not found: ${type}`);
    }
    return agent;
  }

  getAll(): AgentType[] {
    return Array.from(this.agents.keys());
  }

  has(type: AgentType): boolean {
    return this.agents.has(type);
  }
}
