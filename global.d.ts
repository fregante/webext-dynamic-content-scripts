declare namespace chrome.scripting {
	function registerContentScripts(options: Array<globalThis.browser.contentScripts.RegisteredContentScriptOptions & {id: string}>): Promise<void>;
	function unregisterContentScripts(list: string[]): Promise<void>;
}
