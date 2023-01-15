import chrome from 'sinon-chrome';

global.chrome = chrome;

jest.mock('webext-additional-permissions');
