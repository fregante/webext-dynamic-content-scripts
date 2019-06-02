/// <reference types="firefox-webext-browser" />

/**
 * Same as `addToTab`, but it will automatically listen to new tabs and inject the scripts if they're allowed.
 *
 * @param contentScripts The content scripts to inject, follows the same format as in manifest.json
 */
export function addToFutureTabs(contentScripts?: ContentScript | ContentScript[]): void;

/**
 * This is an advanced version of `chrome.tabs.executeScript`/`chrome.tabs.insertCSS`:
 * 	- It accepts a mixed JS/CSS object just like in `manifest.json`.
 *
 * @param tab Tab or tab ID to add the content scripts to. If missing or wrong, the returned promise will reject
 * @param contentScripts The content scripts to inject, follows the same format as in manifest.json
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
export function addToTab(tab: browser.tabs.Tab | number, contentScripts?: ContentScript | ContentScript[]): Promise<void>;
