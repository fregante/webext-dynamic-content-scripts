import CS = browser.contentScripts;

declare namespace chrome.scripting {
	function registerContentScripts(
		options: Array<
		CS.RegisteredContentScriptOptions & {
			id: string;
		}
		>
	): Promise<void>;
	function unregisterContentScripts(list: string[]): Promise<void>;
}
