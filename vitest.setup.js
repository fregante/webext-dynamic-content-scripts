import {vi} from 'vitest';

global.jest = vi;

Object.assign(global, require('jest-chrome'))
