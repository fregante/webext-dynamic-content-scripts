// https://github.com/fregante/webext-dynamic-content-scripts
(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
	typeof define === 'function' && define.amd ? define(['exports'], factory) :
	(global = global || self, factory(global.DCS = {}));
}(this, function (exports) { 'use strict';

	function interopDefault(ex) {
		return ex && typeof ex === 'object' && 'default' in ex ? ex['default'] : ex;
	}

	function createCommonjsModule(fn, module) {
		return module = { exports: {} }, fn(module, module.exports), module.exports;
	}

	var webextContentScriptPing = createCommonjsModule(function (module) {
	// https://github.com/fregante/webext-content-script-ping

	/**
	 * Ping responder
	 */
	document.__webextContentScriptLoaded = true;

	/**
	 * Pinger
	 */
	function pingContentScript(tab) {
		return new Promise((resolve, reject) => {
			chrome.tabs.executeScript(tab.id || tab, {
				code: 'document.__webextContentScriptLoaded',
				runAt: 'document_start'
			}, hasScriptAlready => {
				if (chrome.runtime.lastError) {
					reject(chrome.runtime.lastError);
				} else {
					resolve(Boolean(hasScriptAlready[0]));
				}
			});
		});
	}

	if (typeof module === 'object') {
		module.exports = pingContentScript;
	}
	});

	var pingContentScript = interopDefault(webextContentScriptPing);

	async function p(fn, ...args) {
		return new Promise((resolve, reject) => fn(...args, r => {
			if (chrome.runtime.lastError) {
				reject(chrome.runtime.lastError);
			} else {
				resolve(r);
			}
		}));
	}

	function getUrl(tab) {
		return new Promise(resolve => {
			chrome.tabs.executeScript(tab.id || tab, {
				code: 'location.href',
				runAt: 'document_start'
			}, urls => {
				if (chrome.runtime.lastError) {
					resolve();
				} else {
					resolve(urls[0]);
				}
			});
		});
	}

	async function addToTab(tab, contentScripts = chrome.runtime.getManifest().content_scripts) {
		if (typeof tab !== 'object' && typeof tab !== 'number') {
			throw new TypeError('Specify a Tab or tabId');
		}

		if (!Array.isArray(contentScripts)) {
			// Single script object, make it an array
			contentScripts = [contentScripts];
		}

		const tabId = tab.id || tab;
		if (!await pingContentScript(tabId)) {
			const injections = [];
			for (const group of contentScripts) {
				const allFrames = group.all_frames;
				const runAt = group.run_at;
				for (const file of group.css || []) {
					injections.push(p(chrome.tabs.insertCSS, tabId, {
						file,
						allFrames,
						runAt
					}));
				}

				for (const file of group.js || []) {
					injections.push(p(chrome.tabs.executeScript, tabId, {
						file,
						allFrames,
						runAt
					}));
				}
			}

			return Promise.all(injections);
		}
	}

	function getRegexFromGlobs(scripts) {
		const regexStrings = [];
		for (const {matches} of scripts) {
			if (!matches) {
				continue;
			}

			for (const glob of matches) {
				const regexString = glob
					.replace(/^.*:\/\/([^/]+)\/.*/, '$1') // From `https://*.google.com/foo*bar` to `*.google.com`
					.replace(/\./g, '\\.') // Escape dots
					.replace(/\*/g, '.+'); // Converts `*` to `.+`
				regexStrings.push(regexString);
			}
		}

		// If `regexStrings` is empty, it won't match anything
		return new RegExp('^' + regexStrings.join('$|^') + '$');
	}

	function addToFutureTabs(scripts = chrome.runtime.getManifest().content_scripts) {
		const hostsInScripts = getRegexFromGlobs(scripts);

		chrome.tabs.onUpdated.addListener(async (tabId, {status}) => {
			if (status !== 'loading') {
				return;
			}

			// If we no URL, we have no permissions
			const url = await getUrl(tabId);
			if (!url) {
				return;
			}

			// If the host is already defined in manifest.json, the script was already injected
			const parsedUrl = new URL(url);
			if (hostsInScripts.test(parsedUrl.host)) {
				return;
			}

			const isOriginPermitted = await p(chrome.permissions.contains, {
				origins: [parsedUrl.origin + '/*']
			});
			if (isOriginPermitted) {
				addToTab(tabId, scripts);
			}
		});
	}

	var index = {
		addToTab,
		addToFutureTabs
	};

	exports.addToTab = addToTab;
	exports.addToFutureTabs = addToFutureTabs;
	exports.default = index;

	Object.defineProperty(exports, '__esModule', { value: true });

}));
