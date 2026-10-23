import {injectContentScript} from 'webext-content-scripts';
import queryTabsByUrl from 'webext-tools/query-tabs-by-url.js';

type ManifestContentScript = NonNullable<chrome.runtime.ManifestV3['content_scripts']>[number];

// eslint-disable-next-line require-unicode-regexp -- The `v` flag requires a newer TS target
const targetErrors = /^No frame with id \d+ in tab \d+.$|^No tab with id: \d+.$|^The tab was closed.$|^The frame was removed.$/;

// `webext-content-scripts` does not support `world` yet
async function injectMainWorldScript(tabIds: number[], {js, all_frames: allFrames}: ManifestContentScript) {
	if (js === undefined || js.length === 0) {
		return;
	}

	await Promise.all(tabIds.map(async tabId => {
		try {
			await chrome.scripting.executeScript({
				target: {tabId, allFrames},
				files: js,
				world: 'MAIN',
			});
		} catch (error) {
			if (!targetErrors.test((error as Error)?.message)) {
				throw error;
			}
		}
	}));
}

export async function injectToExistingTabs(
	origins: string[],
	scripts: ManifestContentScript[],
) {
	const excludeMatches = scripts.flatMap(script => script.matches ?? []);
	const tabIds = await queryTabsByUrl(origins, excludeMatches);

	await Promise.all([
		// CSS is not affected by `world`, so `MAIN` scripts only skip their JS here
		injectContentScript(
			tabIds,
			scripts.map(({js, ...script}) => script.world === 'MAIN' ? script : {...script, js}),
			{ignoreTargetErrors: true},
		),
		...scripts
			.filter(script => script.world === 'MAIN')
			.map(async script => injectMainWorldScript(tabIds, script)),
	]);
}
