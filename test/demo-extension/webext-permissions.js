// Mock to fake a user-granted permission
export function queryAdditionalPermissions() {
	return {
		origins: ['https://dynamic-ephiframe.vercel.app/*'],
		permissions: [],
	};
}
