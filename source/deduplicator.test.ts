import {test, describe, afterEach, expect} from 'vitest';
import {excludeDuplicateFiles} from './deduplicator.js';

const warnMock = jest.spyOn(console, 'warn').mockImplementation(() => undefined);

afterEach(() => {
	warnMock.mockClear();
});

describe('excludeDuplicateFiles', () => {
	test('safe', () => {
		expect(excludeDuplicateFiles([
			{
				js: ['first.js'],
				matches: ['https://virgilio.it/*'],
			},
			{
				js: ['first.js', 'second.js'],
				matches: ['https://example.com/*'],
			},
		])).toMatchSnapshot('it should remove duplicate scripts');
		expect(warnMock).not.toHaveBeenCalled();

		expect(excludeDuplicateFiles([
			{
				css: ['first.css'],
				matches: ['https://virgilio.it/*'],
			},
			{
				css: ['first.css', 'second.css'],
				matches: ['https://example.com/*'],
			},
		])).toMatchSnapshot('it should remove duplicate stylesheets');
		expect(warnMock).not.toHaveBeenCalled();

		expect(excludeDuplicateFiles([
			{
				js: ['alpha.js'],
				css: ['first.css'],
				matches: ['https://virgilio.it/*'],
			},
			{
				css: ['first.css', 'second.css'],
				js: ['alpha.js'],
				matches: ['https://example.com/*'],
			},
		])).toMatchSnapshot('it should remove duplicate scripts and stylesheets');
		expect(warnMock).not.toHaveBeenCalled();

		expect(excludeDuplicateFiles([
			{
				js: ['alpha.js'],
				css: ['first.css'],
				matches: ['https://virgilio.it/*'],
			},
			{
				css: ['first.css'],
				js: ['alpha.js'],
				matches: ['https://example.com/*'],
			},
		])).toMatchSnapshot('it should drop the whole block if if empty');
		expect(warnMock).not.toHaveBeenCalled();
	});
	test('warning', () => {
		expect(excludeDuplicateFiles([
			{
				js: ['first.js'],
				matches: ['https://virgilio.it/*'],
				exclude_matches: ['https://*/admin/*'],
			},
			{
				js: ['first.js'],
				exclude_matches: ['https://*/admin/*'],
				matches: ['https://*.example.com/*'],
			},
		])).toMatchSnapshot('it should not warn when a differentiator is the same');
		expect(warnMock).not.toHaveBeenCalled();

		expect(excludeDuplicateFiles([
			{
				css: ['first.css'],
				matches: ['https://virgilio.it/*'],
			},
			{
				css: ['first.css', 'second.css'],
				run_at: 'document_start',
				matches: ['https://example.com/*'],
			},
		])).toMatchSnapshot('it should warn when a differentiator is different');
		expect(warnMock).toMatchSnapshot();
		warnMock.mockClear();

		expect(excludeDuplicateFiles([
			{
				js: ['first.js', 'second.js'],
				matches: ['https://virgilio.it/*'],
				run_at: 'document_end',
			},
			{
				js: ['first.js', 'second.js'],
				run_at: 'document_start',
				matches: ['https://example.com/*'],
			},
		])).toMatchSnapshot('it should warn when a differentiator is different');
		expect(warnMock).toMatchSnapshot();
		warnMock.mockClear();

		expect(excludeDuplicateFiles([
			{
				css: ['first.css'],
				matches: ['https://virgilio.it/*'],
				all_frames: true,
			},
			{
				css: ['first.css', 'second.css'],
				matches: ['https://example.com/*'],
			},
		])).toMatchSnapshot('it should warn when a differentiator is different');
		expect(warnMock).toMatchSnapshot();
		warnMock.mockClear();
	});
});
