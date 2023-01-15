import {describe, it, vi, expect} from 'vitest';
import {getAdditionalPermissions} from 'webext-additional-permissions';
import {isContentScriptRegistered} from './utils';

vi.mock('webext-additional-permissions');

// The two tests marked with concurrent will be run in parallel
it('suite', async () => {
	const manifest = {
		name: 'my chrome extension',
		manifest_version: 2,
		version: '1.0.0',
		content_scripts: [],
	};

	getAdditionalPermissions.mockImplementation(x => ({origins: []}));

	chrome.runtime.getManifest.mockImplementation(() => manifest);
	// Chrome.permissions.getAll.mockImplementation(
	// 	callback => {
	// 		callback({origins: []});
	// 	});

	await isContentScriptRegistered('https://google.com');
	expect(chrome.runtime.getManifest).toHaveBeenCalled();
	expect(getAdditionalPermissions).toHaveBeenCalled();
});
