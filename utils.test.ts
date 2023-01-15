import {chrome} from 'jest-chrome';
import {it, vi, expect} from 'vitest';
import {getAdditionalPermissions} from 'webext-additional-permissions';
import {isContentScriptRegistered} from './utils';

vi.mock('webext-additional-permissions');

const coreManifest: chrome.runtime.Manifest = {
	name: 'required',
	manifest_version: 2,
	version: '0.0.0',
	content_scripts: [],
	permissions: [],
};

const getAdditionalPermissionsMock = vi.mocked(getAdditionalPermissions);

// The two tests marked with concurrent will be run in parallel
it('suite', async () => {
	chrome.runtime.getManifest.mockImplementation(() => coreManifest);
	getAdditionalPermissionsMock.mockImplementation(async x => ({origins: [], permissions: []}));
	// Chrome.permissions.getAll.mockImplementation(
	// 	callback => {
	// 		callback({origins: []});
	// 	});

	await isContentScriptRegistered('https://google.com');
	expect(chrome.runtime.getManifest).toHaveBeenCalled();
	expect(getAdditionalPermissions).toHaveBeenCalled();
});
