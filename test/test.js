/* globals page */
/* Keep file in sync with https://github.com/fregante/content-scripts-register-polyfill/blob/main/test/test.js */

import {describe, beforeAll, it} from '@jest/globals';
import puppeteer from 'expect-puppeteer';

// https://github.com/smooth-code/jest-puppeteer/commit/bcd0415#r76081519
const expect = puppeteer.default;

async function expectToNotMatchElement(window, selector) {
	try {
		await expect(window).toMatchElement(selector);
		throw new Error(`Unexpected "${selector}" element found`);
	} catch (error) {
		if (!error.message.startsWith(`Element ${selector} not found`)) {
			throw error.message;
		}
	}
}

// TODO: Test CSS injection

// "Static" will test the manifest-based injection
// "Dynamic" is the URL we're injecting. The "additional permission" is faked via a mock
const pages = [
	['static', 'https://iframe-test-page.vercel.app/'],
	['dynamic', 'https://iframe-test-page-n786423ca-fregante.vercel.app/'],
];

const nestedPages = [
	['static', './Framed-page'],
	['dynamic', 'https://iframe-test-page-n786423ca-fregante.vercel.app'],
];

describe.each(pages)('%s: tab', (title, url) => {
	beforeAll(async () => {
		await page.goto(url);
	});

	it('should load page', async () => {
		await expect(page).toMatch('Parent page');
	});

	it('should load the content script, once', async () => {
		await expect(page).toMatchElement('.web-ext');
		await expectToNotMatchElement(page, '.web-ext + .web-ext');
	});

	it('should load the content script after a reload, once', async () => {
		await page.reload();
		await expect(page).toMatchElement('.web-ext');
		await expectToNotMatchElement(page, '.web-ext + .web-ext');
	});
});

let iframe;
describe.each(pages)('%s: iframe', (title, url) => {
	beforeAll(async () => {
		await page.goto(url);
		const elementHandle = await page.waitForSelector('iframe');
		iframe = await elementHandle.contentFrame();
	});
	it('should load iframe page', async () => {
		await expect(iframe).toMatch('Framed page');
	});

	it('should load the content script, once', async () => {
		await expect(iframe).toMatchElement('.web-ext');
		await expectToNotMatchElement(iframe, '.web-ext + .web-ext');
	});

	it('should load the content script after a reload, once', async () => {
		await iframe.goto(iframe.url());
		await expect(iframe).toMatchElement('.web-ext');
		await expectToNotMatchElement(iframe, '.web-ext + .web-ext');
	});
});

let iframeOfExcludedParent;
describe.each(nestedPages)('%s: excludeMatches', (title, url) => {
	beforeAll(async () => {
		await page.goto('https://fregante.github.io/pixiebrix-testing-ground/Parent-page?iframe=' + encodeURIComponent(url));
		const elementHandle = await page.waitForSelector('iframe');
		iframeOfExcludedParent = await elementHandle.contentFrame();
	});

	it('should load page and iframe', async () => {
		await expect(page).toMatchElement('title', {text: 'Parent page'});
		// TODO: We need another page like `pixiebrix-testing-ground`, on a different domain, to customize the title
		// await expect(iframeOfExcludedParent).toMatchElement('title', {text: 'Framed page'});
	});

	it('should load the content script only in iframe, once', async () => {
		await expectToNotMatchElement(page, '.web-ext');
		await expect(iframeOfExcludedParent).toMatchElement('.web-ext');
		await expectToNotMatchElement(iframeOfExcludedParent, '.web-ext + .web-ext');
	});
});

// Uncomment to hold the browser open a little longer
// import {jest} from '@jest/globals';
// jest.setTimeout(10000000);
// describe('hold', () => {
// 	it('should wait forever', async () => {
// 		await new Promise(resolve => setTimeout(resolve, 1000000))
// 	})
// });
