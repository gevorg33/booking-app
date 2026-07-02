import { rescueConsumerAdoptionIntent } from './ai-consumer-adoption.util.js';
import {
  EXPLAIN_HOME_SCREEN_WIDGET_PROMPTS,
  EXPLAIN_HOME_SCREEN_WIDGET_BOUNDARY_PROMPTS,
  EXPLAIN_HOME_SCREEN_WIDGET_RESCUE_SCENARIOS,
  CUSTOMER_EXPLAIN_HOME_SCREEN_WIDGET_CLASSIFIER_RULES,
} from './ai-explain-home-screen-widget.fixtures.js';
import { EXPLAIN_HOME_SCREEN_WIDGET_MULTILINGUAL_SCENARIOS } from './ai-explain-home-screen-widget-multilingual.fixtures.js';
import {
  assembleHomeScreenWidgetSummary,
  buildAddToHomeScreenLines,
  buildExplainHomeScreenWidgetNavigate,
  buildQuickRebookWidgetLines,
  buildWhatShowsLines,
  isExplainHomeScreenWidgetIntent,
  isExplainHomeScreenWidgetPrompt,
  parseExplainHomeScreenWidgetFromPrompt,
  rescueExplainHomeScreenWidgetIntent,
  resolveConsumerHomeScreenWidgetExplainContext,
  resolveExplainHomeScreenWidgetAspect,
} from './ai-explain-home-screen-widget.util.js';
import { isRebookLastAppointmentPrompt } from './ai-rebook-last-appointment.util.js';
import { AI_COMMAND_EVAL_EXPLAIN_HOME_SCREEN_WIDGET_CASES } from './eval/ai-command-eval.cases.js';

describe('ai-explain-home-screen-widget.util (ai-cmd-customer-4.13.6)', () => {
  it('exports classifier rules for explain_home_screen_widget', () => {
    expect(CUSTOMER_EXPLAIN_HOME_SCREEN_WIDGET_CLASSIFIER_RULES).toContain(
      'explain_home_screen_widget',
    );
  });

  it.each(
    EXPLAIN_HOME_SCREEN_WIDGET_PROMPTS.map((row) => [row.id, row] as const),
  )('detects explain_home_screen_widget for $id', (_id, row) => {
    expect(isExplainHomeScreenWidgetPrompt(row.prompt)).toBe(true);
    expect(
      rescueExplainHomeScreenWidgetIntent(row.prompt, 'unknown')?.action,
    ).toBe('explain_home_screen_widget');
    expect(rescueConsumerAdoptionIntent(row.prompt, 'unknown')?.action).toBe(
      'explain_home_screen_widget',
    );
  });

  it.each(
    EXPLAIN_HOME_SCREEN_WIDGET_MULTILINGUAL_SCENARIOS.map(
      (row) => [row.id, row] as const,
    ),
  )('detects multilingual explain_home_screen_widget for $id', (_id, row) => {
    expect(isExplainHomeScreenWidgetPrompt(row.prompt)).toBe(true);
  });

  it.each(
    EXPLAIN_HOME_SCREEN_WIDGET_BOUNDARY_PROMPTS.map(
      (row) => [row.id, row] as const,
    ),
  )('rejects boundary prompt $id', (_id, row) => {
    expect(isExplainHomeScreenWidgetPrompt(row.prompt)).toBe(false);
  });

  it.each(EXPLAIN_HOME_SCREEN_WIDGET_RESCUE_SCENARIOS)(
    'rescues explain_home_screen_widget for $id',
    ({ prompt, misclassifiedAction }) => {
      expect(
        rescueExplainHomeScreenWidgetIntent(prompt, misclassifiedAction)
          ?.action,
      ).toBe('explain_home_screen_widget');
    },
  );

  it('resolves aspects and context', () => {
    expect(
      resolveExplainHomeScreenWidgetAspect(
        'Add next appointment to home screen',
      ),
    ).toBe('add_to_home_screen');
    const ctx = resolveConsumerHomeScreenWidgetExplainContext({
      nativePlatform: 'ios',
      widgetHasNextAppointment: true,
      widgetNextServiceName: 'Haircut',
    });
    expect(ctx.widgetSupported).toBe(true);
    expect(ctx.hasNextAppointment).toBe(true);
    expect(ctx.nextServiceName).toBe('Haircut');
  });

  it('builds summaries for widget states', () => {
    const signedOut = assembleHomeScreenWidgetSummary('signed_out_state', {
      widgetSupported: true,
      platform: 'ios',
      widgetAuthed: false,
      hasNextAppointment: false,
      hasQuickRebook: false,
      nextServiceName: null,
      nextSubtitle: null,
    });
    expect(signedOut).toContain('signed out');
    expect(
      buildWhatShowsLines({
        widgetSupported: true,
        platform: 'android',
        widgetAuthed: true,
        hasNextAppointment: true,
        hasQuickRebook: false,
        nextServiceName: 'Color',
        nextSubtitle: 'Jun 15 · 2pm with Jane',
      })[2],
    ).toContain('Jane');
    expect(buildQuickRebookWidgetLines()[0]).toContain('Book again');
    expect(
      buildAddToHomeScreenLines({
        widgetSupported: false,
        platform: 'web',
        widgetAuthed: null,
        hasNextAppointment: false,
        hasQuickRebook: false,
        nextServiceName: null,
        nextSubtitle: null,
      })[0],
    ).toContain('native');
  });

  it('parses prompt and recognizes intent id', () => {
    expect(
      parseExplainHomeScreenWidgetFromPrompt('What does the widget show?')
        ?.aspect,
    ).toBe('what_shows');
    expect(isExplainHomeScreenWidgetIntent('explain_home_screen_widget')).toBe(
      true,
    );
  });

  it('returns null when action already matches', () => {
    expect(
      rescueExplainHomeScreenWidgetIntent(
        'Add next appointment to home screen',
        'explain_home_screen_widget',
      ),
    ).toBeNull();
  });

  it('detects heuristic prompts not in fixtures', () => {
    expect(
      isExplainHomeScreenWidgetPrompt(
        'Ավելացնել հաջորդ հանդիպումը հիմնական էկրանին',
      ),
    ).toBe(true);
    expect(isExplainHomeScreenWidgetPrompt('Что показывает виджет?')).toBe(
      true,
    );
  });

  it('does not steal rebook mutate prompts', () => {
    expect(isRebookLastAppointmentPrompt('Rebook my last appointment')).toBe(
      true,
    );
    expect(isExplainHomeScreenWidgetPrompt('Rebook my last appointment')).toBe(
      false,
    );
    expect(
      isExplainHomeScreenWidgetPrompt('What does Book again on the widget do?'),
    ).toBe(true);
  });

  it('builds navigate for add widget aspect', () => {
    expect(buildExplainHomeScreenWidgetNavigate('add_to_home_screen')).toEqual({
      path: 'account',
      query: {},
    });
    expect(buildExplainHomeScreenWidgetNavigate('quick_rebook')).toBeNull();
  });

  it('rejects empty prompt and support widget', () => {
    expect(isExplainHomeScreenWidgetPrompt('')).toBe(false);
    expect(
      isExplainHomeScreenWidgetPrompt('Open the support chat widget'),
    ).toBe(false);
  });

  it('registers eval cases', () => {
    expect(
      AI_COMMAND_EVAL_EXPLAIN_HOME_SCREEN_WIDGET_CASES.length,
    ).toBeGreaterThan(0);
  });

  it('covers platform-specific add widget and appointment branches', () => {
    expect(
      buildAddToHomeScreenLines({
        widgetSupported: true,
        platform: 'ios',
        widgetAuthed: true,
        hasNextAppointment: false,
        hasQuickRebook: false,
        nextServiceName: null,
        nextSubtitle: null,
      })[1],
    ).toContain('iPhone');
    expect(
      buildAddToHomeScreenLines({
        widgetSupported: true,
        platform: 'android',
        widgetAuthed: true,
        hasNextAppointment: false,
        hasQuickRebook: false,
        nextServiceName: null,
        nextSubtitle: null,
      })[1],
    ).toContain('Android');
    expect(
      assembleHomeScreenWidgetSummary('next_appointment', {
        widgetSupported: true,
        platform: 'ios',
        widgetAuthed: true,
        hasNextAppointment: false,
        hasQuickRebook: false,
        nextServiceName: null,
        nextSubtitle: null,
      }),
    ).toContain('No upcoming');
    expect(
      assembleHomeScreenWidgetSummary('what_shows', {
        widgetSupported: true,
        platform: 'ios',
        widgetAuthed: true,
        hasNextAppointment: false,
        hasQuickRebook: true,
        nextServiceName: null,
        nextSubtitle: null,
      }),
    ).toContain('quick rebook');
    expect(
      assembleHomeScreenWidgetSummary('how_it_works', {
        widgetSupported: false,
        platform: 'web',
        widgetAuthed: null,
        hasNextAppointment: false,
        hasQuickRebook: false,
        nextServiceName: null,
        nextSubtitle: null,
      }),
    ).toContain('native app');
    expect(buildExplainHomeScreenWidgetNavigate('what_shows')).toEqual({
      path: 'account',
      query: {},
    });
    expect(
      resolveExplainHomeScreenWidgetAspect('Add widget to home screen'),
    ).toBe('add_to_home_screen');
    expect(
      resolveExplainHomeScreenWidgetAspect('Why does the widget say sign in?'),
    ).toBe('signed_out_state');
    expect(
      buildWhatShowsLines({
        widgetSupported: true,
        platform: 'ios',
        widgetAuthed: true,
        hasNextAppointment: true,
        hasQuickRebook: false,
        nextServiceName: 'Manicure',
        nextSubtitle: null,
      })[2],
    ).toContain('Manicure');
    expect(
      resolveConsumerHomeScreenWidgetExplainContext({
        sessionCustomerId: 'cust-1',
      }).widgetAuthed,
    ).toBe(true);
    expect(
      assembleHomeScreenWidgetSummary('next_appointment', {
        widgetSupported: true,
        platform: 'android',
        widgetAuthed: true,
        hasNextAppointment: true,
        hasQuickRebook: false,
        nextServiceName: 'Facial',
        nextSubtitle: null,
      }),
    ).toContain('Facial');
  });
});
