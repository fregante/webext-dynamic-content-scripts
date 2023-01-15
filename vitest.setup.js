import {chrome} from 'jest-chrome';
import {vi} from 'vitest';

// For `jest-chrome` https://github.com/vitest-dev/vitest/issues/2667
globalThis.jest = vi;

globalThis.chrome = chrome;
