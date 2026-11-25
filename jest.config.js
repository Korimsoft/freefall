'use strict';

module.exports = {
    testEnvironment: 'jsdom',
    roots: ['<rootDir>/app/src'],
    transform: {
        '^.+\\.ts$': 'ts-jest',
    },
    // The sources import each other as './ball.js', the name the browser loads.
    moduleNameMapper: {
        '^(\\.{1,2}/.*)\\.js$': '$1',
    },
};
