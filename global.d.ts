import CS = browser.contentScripts;

type ManifestContentScripts = NonNullable<chrome.runtime.Manifest['content_scripts']>;
type ChromeContentScript = Omit<browser.contentScripts.RegisteredContentScriptOptions, 'css' | 'js'> & Pick<ManifestContentScripts[number], 'css' | 'js'>;

declare namespace chrome.scripting {
	function registerContentScripts(
		options: Array<ChromeContentScript & {id: string}>
	): Promise<void>;
	function unregisterContentScripts(list: string[]): Promise<void>;
}
