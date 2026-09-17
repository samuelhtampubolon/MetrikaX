/**
 * Testing Library only cleans up automatically when Vitest globals are enabled. Globals are off in
 * this workspace, so the teardown is explicit and every test starts from an empty document.
 */
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

afterEach(() => {
  cleanup();
});
