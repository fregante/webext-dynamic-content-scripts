/// <reference types="firefox-webext-browser" />

/**
 * Same as `addToTab`, but it will automatically listen to new tabs and inject the scripts as needed.
 *
 * @param contentScripts {string[]} An array of content scripts.
 */
export function addToFutureTabs(contentScripts?: string[]): Promise<void>;

/**
 * This is an advanced version of `chrome.tabs.executeScript`/`chrome.tabs.insertCSS`:
 * 	- It accepts a mixed JS/CSS object just like in `manifest.json`.
 *
 * @param tab {browser.tabs.Tab|number} Tab or tab ID to add the content scripts to.
 * @param contentScripts {string[]} An array of content scripts.
 *
 * @example
 * 	DCS.addToTab(tab, {
 * 		run_at: 'document_start',
 * 		all_frames: true,
 * 		css: [
 * 			'content.css'
 * 		],
 * 		js: [
 * 			'webext-dynamic-content-scripts.js',
 * 			'jquery.slim.min.js',
 * 			'browser-polyfill.min.js',
 * 			'content.js'
 * 		]
 * 		// Not supported: all matches and globs properties
 * 	});
 */
export function addToTab(tab: browser.tabs.Tab|number, contentScripts?: string[]): Promise<void>;
