type ManifestContentScript = NonNullable<chrome.runtime.Manifest['content_scripts']>[0];

// Not all keys are supported by the polyfill to begin with
// matchAboutBlank: https://github.com/fregante/content-scripts-register-polyfill/issues/2
// *Globs: https://github.com/fregante/content-scripts-register-polyfill/issues/35
function getDifferentiators(c: ManifestContentScript): string {
	return JSON.stringify([c.all_frames, c.exclude_matches, c.run_at]);
}

/**
Exclude same-file injections from a manifest `content_script` array due to a change in the polyfill.
https://github.com/fregante/webext-dynamic-content-scripts/issues/62
*/
export function excludeDuplicateFiles(
	contentScripts: ManifestContentScript[],
	{warn = true} = {},
): ManifestContentScript[] {
	const uniques = new Map<string, string>();
	const filterWarnAndAdd = (files: string[] | undefined, context: ManifestContentScript) => {
		if (!files) {
			return [];
		}

		return files.filter(file => {
			// If a content script has the same options, then it's 100% duplicate and safe to remove.
			// If it doesn't have the same options, then removing it can cause issues.
			const differentiators = getDifferentiators(context);

			// Exclude files from current script if they were already injected by another script
			if (uniques.has(file)) {
				// Warn the user in case this removal changes the behavior from what's expected
				if (warn && differentiators !== uniques.get(file)) {
					console.warn(`Duplicate file in the manifest content_scripts: ${file} \nMore info: https://github.com/fregante/webext-dynamic-content-scripts/issues/62`);
				}

				return false;
			}

			uniques.set(file, differentiators);
			return true;
		});
	};

	return contentScripts.flatMap(contentScript => {
		// To avoid confusion, drop the `matches` array since it's not used by `webext-dynamic-content-scripts`
		const {matches, ...cleanContentScript} = contentScript;

		const result = ({
			...cleanContentScript,
			js: filterWarnAndAdd(contentScript.js, contentScript),
			css: filterWarnAndAdd(contentScript.css, contentScript),
		});

		// Drop entire block if complete duplicate (the `matches` array could be different, but that doesn't matter in `webext-dynamic-content-scripts`)
		return result.css.length + result.js.length === 0 ? [] : result;
	});
}
