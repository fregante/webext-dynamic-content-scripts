// Core functionality
import '.';
import {type ContentScript} from 'webext-content-scripts/types';
import {injectContentScript} from 'webext-content-scripts';
import {type ActiveTab, onActiveTab} from './active-tab.js';
import {isContentScriptRegistered} from './utils.js';

const scripts = chrome.runtime.getManifest().content_scripts as ContentScript;

async function injectToTab({id, origin}: ActiveTab): Promise<void> {
	if (id && await isContentScriptRegistered(origin)) {
		// Warning: This will still cause duplicate injection on frames of activeTabs with origins that have "registered" content scripts.
		// Example:
		// 1. manifest injects on google.com
		// 2. user enables activeTab on example.com
		// 3. the tab has a Google Maps frame that already has native content scripts
		// 4. this line will inject the content script on both frame 0 and the Google Maps frame
		void injectContentScript(id, scripts);
	}
}

onActiveTab(injectToTab);
