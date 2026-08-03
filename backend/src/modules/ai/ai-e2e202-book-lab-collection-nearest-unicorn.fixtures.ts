/**
 * e2e-bug.202 — book_lab_collection_nearest must abort when the user names a
 * nonexistent lab panel (no soft compound success / inventable handoff).
 */

export type E2E202PanelCase = {
  id: string;
  prompt: string;
  expectTestName: string | null;
  expectFillerServiceNameCleared?: boolean;
};

export const E2E202_NAMED_PANEL_CASES: readonly E2E202PanelCase[] = [
  {
    id: 'unicorn-panel',
    prompt: 'Book lab draw earliest slot for unicorn-panel-xyzzy',
    expectTestName: 'unicorn-panel-xyzzy',
    expectFillerServiceNameCleared: true,
  },
  {
    id: 'bogus-panel-hyphen',
    prompt: 'Book lab draw earliest slot for nonexistent-lab-panel-xyzzy',
    expectTestName: 'nonexistent-lab-panel-xyzzy',
  },
  {
    id: 'lipid-panel-named',
    prompt: 'Book lab draw earliest slot for lipid panel',
    expectTestName: 'lipid panel',
  },
  {
    id: 'cbc-named',
    prompt: 'Book lab draw earliest slot for CBC',
    expectTestName: 'CBC',
  },
  {
    id: 'unnamed-earliest',
    prompt: 'Book lab draw earliest slot',
    expectTestName: null,
    expectFillerServiceNameCleared: true,
  },
  {
    id: 'soonest-opening-not-panel',
    prompt: 'Schedule my blood draw for the soonest opening',
    expectTestName: null,
  },
];

export const E2E202_UNRESOLVED_ABORT =
  /couldn't find a lab panel or pending collection request matching/i;
