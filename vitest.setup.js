import {chrome} from 'jest-chrome';
import {vi} from 'vitest';

// For `jest-chrome` https://github.com/vitest-dev/vitest/issues/2667
globalThis.jest = vi;

globalThis.chrome = chrome;
globalThis.location = {origin: 'chrome://abc/'};
<<<<<<< HEAD
Object.freeze(location);
=======
Object.freeze(globalThis.location);
>>>>>>> origin/main

globalThis.chrome.scripting = {
	registerContentScripts: vi.fn(),
	unregisterContentScripts: vi.fn(),
};
