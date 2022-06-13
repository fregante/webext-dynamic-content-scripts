# webext-dynamic-content-scripts on Manifest v2

_For Manifest v3, refer to the [Usage section on the main readme](readme.md)._

Include `webext-dynamic-content-scripts` as a background script and add `optional_permissions` to allow new permissions to be added. The scripts defined in `content_scripts` will be added on the new domains (`matches` will be replaced)

```json
// example manifest.json
{
	"optional_permissions": [
		"*://*/*"
	],
	"background": {
		"scripts": [
			"webext-dynamic-content-scripts.js",
			"background.js"
		]
	},
	"content_scripts": [
		{
			"matches": ["https://github.com/*"],
			"css": ["content.css"],
			"js": ["content.js"]
		}
	]
}
```

## Permissions for Chrome Manifest v2

This section does not apply to Firefox users.

In order to use `all_frames: true` you should the add [`webNavigation` permission](https://developer.chrome.com/docs/extensions/reference/webNavigation/). Without it, `all_frames: true` won’t work:

- when the iframe is not on the same domain as the top frame
- when the iframe reloads or navigates to another page
- when the iframe is not ready when `runAt` is configured to run (`runAt: 'start'` is unlikely to work)

If available, the `webNavigation` API will be automatically used in every situation for better performance.
