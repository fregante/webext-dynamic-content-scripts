/// <reference types="firefox-webext-browser" />

declare module 'webext-dynamic-content-scripts' {

	export function addToFutureTabs(scripts?: string[]): void;

	export function addToTab(tab: browser.tabs.Tab|number, contentScripts?: string[]): void;
}
