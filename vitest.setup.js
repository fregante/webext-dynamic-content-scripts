import {chrome} from 'jest-chrome';
import {vi} from 'vitest';

globalThis.jest = vi;
globalThis.chrome = chrome;
