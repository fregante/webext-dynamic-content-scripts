// Mock to fake a user-granted permission
export function getAdditionalPermissions() {
	return {
		origins: ['https://dynamic-ephiframe.vercel.app/*', 'https://*.vercel.app/*'],
		permissions: [],
	};
}
