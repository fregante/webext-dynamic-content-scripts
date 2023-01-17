import registerContentScriptPonyfill from 'content-scripts-register-polyfill/ponyfill.js';

export const chromeRegister = globalThis.chrome?.scripting?.registerContentScripts;
export const firefoxRegister = globalThis.browser?.contentScripts?.register;

export async function registerContentScript(
	contentScript: ChromeContentScript,
): Promise<browser.contentScripts.RegisteredContentScript> {
	if (chromeRegister) {
		const id = 'webext-dynamic-content-script-' + JSON.stringify(contentScript);
		try {
			await chromeRegister([{
				id,
				...contentScript,
			}]);
		} catch (error) {
			if (!(error as Error)?.message.startsWith('Duplicate script ID')) {
				throw error;
			}
		}

		return {
			unregister: async () => chrome.scripting.unregisterContentScripts([id]),
		};
	}

	const firefoxContentScript = {
		...contentScript,
		js: contentScript.js?.map(file => ({file})),
		css: contentScript.css?.map(file => ({file})),
	};

	if (firefoxRegister) {
		return firefoxRegister(firefoxContentScript);
	}

	return registerContentScriptPonyfill(firefoxContentScript);
}
