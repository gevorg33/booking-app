import { describe, expect, it } from '@jest/globals';
import {
  isAgentOpsIntent,
  isListAgentTasksPrompt,
  isRebookAllFromAgentTaskPrompt,
  isUndoLatestAgentTaskPrompt,
  rescueAgentOpsIntent,
  extractAgentTaskIdFromPrompt,
} from './ai-agent-ops.util.js';

describe('ai-agent-ops.util (ai-cmd-dashboard-6.1)', () => {
  describe('isAgentOpsIntent', () => {
    it('recognizes all 3 agent-ops intents', () => {
      expect(isAgentOpsIntent('list_agent_tasks')).toBe(true);
      expect(isAgentOpsIntent('rebook_all_from_agent_task')).toBe(true);
      expect(isAgentOpsIntent('undo_latest_agent_task')).toBe(true);
      expect(isAgentOpsIntent('cancel_bookings')).toBe(false);
    });
  });

  describe('isListAgentTasksPrompt', () => {
    it('matches list/pending task prompts', () => {
      expect(isListAgentTasksPrompt('show agent tasks')).toBe(true);
      expect(isListAgentTasksPrompt('any pending tasks?')).toBe(true);
      expect(isListAgentTasksPrompt('what is in the task queue')).toBe(true);
    });

    it('does not match rebook/undo prompts', () => {
      expect(isListAgentTasksPrompt('rebook all from this task')).toBe(false);
      expect(isListAgentTasksPrompt('undo the last agent task')).toBe(false);
    });
  });

  describe('isRebookAllFromAgentTaskPrompt', () => {
    it('matches rebook-all phrasing', () => {
      expect(isRebookAllFromAgentTaskPrompt('rebook all from task abc123')).toBe(
        true,
      );
      expect(isRebookAllFromAgentTaskPrompt('rebook everyone from this task')).toBe(
        true,
      );
    });

    it('does not match a single rebooking', () => {
      expect(isRebookAllFromAgentTaskPrompt('rebook Jane for tomorrow')).toBe(
        false,
      );
    });
  });

  describe('isUndoLatestAgentTaskPrompt', () => {
    it('matches undo/revert phrasing', () => {
      expect(isUndoLatestAgentTaskPrompt('undo the last agent action')).toBe(
        true,
      );
      expect(isUndoLatestAgentTaskPrompt('undo latest task')).toBe(true);
      expect(isUndoLatestAgentTaskPrompt('revert the last agent action')).toBe(
        true,
      );
    });

    it('does not match unrelated undo phrasing', () => {
      expect(isUndoLatestAgentTaskPrompt('undo my last message')).toBe(false);
    });
  });

  describe('extractAgentTaskIdFromPrompt', () => {
    it('extracts a task id from prompt text', () => {
      expect(
        extractAgentTaskIdFromPrompt('preview task abc12345-def6'),
      ).toBe('abc12345-def6');
    });

    it('returns null when no id present', () => {
      expect(extractAgentTaskIdFromPrompt('show agent tasks')).toBeNull();
    });
  });

  describe('rescueAgentOpsIntent', () => {
    it('returns null when the action is already an agent-ops intent', () => {
      expect(rescueAgentOpsIntent('anything', 'list_agent_tasks')).toBeNull();
    });

    it('rescues rebook-all phrasing from unknown', () => {
      expect(
        rescueAgentOpsIntent('rebook all from task abc123', 'unknown'),
      ).toEqual({
        action: 'rebook_all_from_agent_task',
        rescueReason: 'rebook_all',
      });
    });

    it('rescues undo-latest phrasing from unknown', () => {
      expect(
        rescueAgentOpsIntent('undo the last agent action', 'unknown'),
      ).toEqual({ action: 'undo_latest_agent_task', rescueReason: 'undo_latest' });
    });

    it('rescues list-tasks phrasing from unknown', () => {
      expect(rescueAgentOpsIntent('show pending agent tasks', 'unknown')).toEqual(
        { action: 'list_agent_tasks', rescueReason: 'list_tasks' },
      );
    });

    it('e2e-bug.152 — exact pending AI agent tasks phrasing', () => {
      expect(isListAgentTasksPrompt('Show me pending AI agent tasks')).toBe(
        true,
      );
      expect(
        rescueAgentOpsIntent('Show me pending AI agent tasks', 'unknown'),
      ).toEqual({ action: 'list_agent_tasks', rescueReason: 'list_tasks' });
      expect(
        rescueAgentOpsIntent(
          'Show me pending AI agent tasks',
          'list_clinic_tasks',
        ),
      ).toEqual({ action: 'list_agent_tasks', rescueReason: 'list_tasks' });
    });

    it('returns null for unrelated prompts', () => {
      expect(rescueAgentOpsIntent('cancel all appointments today', 'unknown')).toBeNull();
    });
  });
});
