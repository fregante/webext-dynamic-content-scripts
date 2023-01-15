import chrome from 'sinon-chrome';

import {describe, it, expect, test, jest} from '@jest/globals';

jest.mock('webext-additional-permissions', () => {});
// Const {getAdditionalPermissions} = await import('webext-additional-permissions');

describe('core', () => {
	it('should load page', async () => {
		const manifest = {
			name: 'my chrome extension',
			manifest_version: 2,
			version: '1.0.0',
		};

		await import('../index.js');
		expect(getAdditionalPermissions).toHaveBeenCalled();
	});
});
