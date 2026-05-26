import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WorkflowCompilerService } from './compiler/workflow-compiler.service.js';
import { WorkflowExecutorService } from './executor/workflow-executor.service.js';
import { WorkflowExecution } from './workflow-execution.entity.js';
import { EventStoreModule } from '../../events/store/event-store.module.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([WorkflowExecution]),
    EventStoreModule,
  ],
  providers: [WorkflowCompilerService, WorkflowExecutorService],
  exports: [WorkflowCompilerService, WorkflowExecutorService],
})
export class WorkflowModule {}
