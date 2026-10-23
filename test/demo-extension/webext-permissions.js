// Mock to fake a user-granted permission
export function queryPermissionsDiff() {
	return {
		added: {
			origins: ['https://dynamic-ephiframe.vercel.app/*'],
		},
	};
}
