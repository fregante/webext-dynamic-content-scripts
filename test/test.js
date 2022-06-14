/* globals page */
/* Keep file in sync with https://github.com/fregante/content-scripts-register-polyfill/blob/main/test/test.js */

import {describe, beforeAll, it} from '@jest/globals';
import puppeteer from 'expect-puppeteer';

// https://github.com/smooth-code/jest-puppeteer/commit/bcd0415#r76081519
const expect = puppeteer.default;

async function expectToNotMatchElement(window, selector) {
	try {
		await expect(window).toMatchElement(selector);
		throw new Error(`Expected ${selector} element found`);
	} catch (error) {
		if (!error.message.startsWith(`Element ${selector} not found`)) {
			throw error.message;
		}
	}
}

// TODO: Test CSS injection

describe('tab', () => {
	beforeAll(async () => {
		await page.goto('https://iframe-test-page.vercel.app/');
	});

	it('should load page', async () => {
		await expect(page).toMatch('Parent page');
	});

	it('should load static content script, once', async () => {
		await expect(page).toMatchElement('.static');
		await expectToNotMatchElement(page, '.static + .static');
	});

	it('should load static content script after a reload, once', async () => {
		await page.reload();
		await expect(page).toMatchElement('.static');
		await expectToNotMatchElement(page, '.static + .static');
	});
});

let iframe;
describe('iframe', () => {
	beforeAll(async () => {
		await page.goto('https://iframe-test-page.vercel.app/');
		const elementHandle = await page.waitForSelector('iframe');
		iframe = await elementHandle.contentFrame();
	});
	it('should load iframe page', async () => {
		await expect(iframe).toMatch('Framed page');
	});

	it('should load static content script, once', async () => {
		await expect(iframe).toMatchElement('.static');
		await expectToNotMatchElement(iframe, '.static + .static');
	});

	it('should load static content script after a reload, once', async () => {
		await iframe.goto(iframe.url());
		await expect(iframe).toMatchElement('.static');
		await expectToNotMatchElement(iframe, '.static + .static');
	});
});

let iframeOfExcludedParent;
describe('excludeMatches', () => {
	beforeAll(async () => {
		await page.goto('https://fregante.github.io/pixiebrix-testing-ground/Parent-page?iframe=./Framed-page');
		const elementHandle = await page.waitForSelector('iframe');
		iframeOfExcludedParent = await elementHandle.contentFrame();
	});

	it('should load page and iframe', async () => {
		await expect(page).toMatchElement('title', {text: 'Parent page'});
		await expect(iframeOfExcludedParent).toMatchElement('title', {text: 'Framed page'});
	});

	it('should load static content script only in iframe, once', async () => {
		await expectToNotMatchElement(page, '.static');
		await expect(iframeOfExcludedParent).toMatchElement('.static');
		await expectToNotMatchElement(iframeOfExcludedParent, '.static + .static');
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
