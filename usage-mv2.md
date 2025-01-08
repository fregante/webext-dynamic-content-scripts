# webext-dynamic-content-scripts on Manifest v2

_For Manifest v3, refer to the [Usage section on the main readme](readme.md)._

MV2 support for Chrome ended in v11. It should still work in Safari and Firefox and any MV2 browser that supports the `chrome.scripting.registerContentScripts` API.

Include `webext-dynamic-content-scripts` as a background script and add `optional_permissions` to allow new permissions to be added. The scripts defined in `content_scripts` will be added on the new domains (`matches` will be replaced)

```json
// example manifest.json
{
	"optional_permissions": ["*://*/*"],
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
