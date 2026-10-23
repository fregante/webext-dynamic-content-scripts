import {chrome} from 'jest-chrome';
import {
	describe,
	it,
	vi,
	beforeEach,
	expect,
} from 'vitest';
import {injectContentScript} from 'webext-content-scripts';
import queryTabsByUrl from 'webext-tools/query-tabs-by-url.js';
import {injectToExistingTabs} from './inject-to-existing-tabs.js';

vi.mock('webext-content-scripts');
vi.mock('webext-tools/query-tabs-by-url.js');

type ManifestContentScript = NonNullable<chrome.runtime.ManifestV3['content_scripts']>[number];

const origins = ['https://granted.example.com/*'];
const executeScript = vi.fn();

beforeEach(() => {
	vi.mocked(queryTabsByUrl).mockResolvedValue([1, 2]);
	vi.mocked(injectContentScript).mockClear();
	executeScript.mockReset();
	// @ts-expect-error Missing types in `jest-chrome`
	chrome.scripting.executeScript = executeScript;
});

describe('injectToExistingTabs', () => {
	it('should inject isolated scripts via `webext-content-scripts`', async () => {
		const scripts = [{js: ['script.js'], matches: ['https://example.com/*']}];
		await injectToExistingTabs(origins, scripts);

		expect(injectContentScript).toHaveBeenCalledWith([1, 2], scripts, {ignoreTargetErrors: true});
		expect(executeScript).not.toHaveBeenCalled();
	});

	it('should inject `MAIN` world scripts in the main world and only their CSS via `webext-content-scripts`', async () => {
		await injectToExistingTabs(origins, [{
			js: ['page.js'],
			css: ['page.css'],
			all_frames: true,
			world: 'MAIN',
			matches: ['https://example.com/*'],
		}]);

		expect(injectContentScript).toHaveBeenCalledWith(
			[1, 2],
			[{
				css: ['page.css'],
				all_frames: true,
				world: 'MAIN',
				matches: ['https://example.com/*'],
			}],
			{ignoreTargetErrors: true},
		);
		expect(executeScript).toHaveBeenCalledTimes(2);
		expect(executeScript).toHaveBeenCalledWith({
			target: {tabId: 1, allFrames: true},
			files: ['page.js'],
			world: 'MAIN',
		});
	});

	it('should ignore errors for closed tabs but not others', async () => {
		executeScript.mockRejectedValueOnce(new Error('No tab with id: 1.'));
		const script: ManifestContentScript = {
			js: ['page.js'],
			world: 'MAIN',
			matches: ['https://example.com/*'],
		};
		await expect(injectToExistingTabs(origins, [script])).resolves.toBeUndefined();

		executeScript.mockRejectedValueOnce(new Error('Nope'));
		await expect(injectToExistingTabs(origins, [script])).rejects.toThrow('Nope');
	});
});
