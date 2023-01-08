// Core functionality
import '.';
import {type ContentScript} from 'webext-content-scripts/types';
import {injectContentScript} from 'webext-content-scripts';
import {type ActiveTab, onActiveTab} from './active-tab';

function injectToTab(tab: ActiveTab): void {
	if (tab.id) {
		void injectContentScript(tab.id, chrome.runtime.getManifest().content_scripts as ContentScript);
	}
}

onActiveTab(injectToTab);
