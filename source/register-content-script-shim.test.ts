import {
	describe, it, expect, vi, beforeEach,
} from 'vitest';

describe('registerContentScript context binding', () => {
	beforeEach(() => {
		vi.resetModules();
	});

	it('should call chrome.scripting.registerContentScripts with the correct `this` context', async () => {
		const mockRegister = vi.fn();

		// Setup the global mock before importing the shim
		// @ts-expect-error Mocking global objects
		globalThis.chrome = {
			scripting: {
				registerContentScripts: mockRegister,
				unregisterContentScripts: vi.fn(),
			},
		};

		const {registerContentScript} = await import('./register-content-script-shim.js');

		await registerContentScript({matches: ['*://*.example.com/*'], js: ['script.js']});

		expect(mockRegister).toHaveBeenCalled();
		expect(mockRegister.mock.instances[0]).toBe(globalThis.chrome.scripting);
	});
});
