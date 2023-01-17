// Core functionality
import '.';
import {type ContentScript} from 'webext-content-scripts/types';
import {injectContentScript} from 'webext-content-scripts';
import {type ActiveTab, onActiveTab} from './active-tab.js';
import {isContentScriptRegistered} from './utils.js';

const scripts = chrome.runtime.getManifest().content_scripts as ContentScript;

async function injectToTab({id, origin}: ActiveTab): Promise<void> {
	if (id && !(await isContentScriptRegistered(origin))) {
		// Warning: This might cause duplicate injections on frames of activeTabs with different origins. Some details in:
		// https://github.com/fregante/webext-dynamic-content-scripts/pull/44
		// https://github.com/pixiebrix/pixiebrix-extension/issues/4983
		void injectContentScript(id, scripts);
	}
}

onActiveTab(injectToTab);
