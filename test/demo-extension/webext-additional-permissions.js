// Mock to fake a user-granted permission
export function getAdditionalPermissions() {
	return {
		origins: [
			'https://iframe-test-page-n786423ca-fregante.vercel.app/*',
		],
		permissions: [],
	};
}
