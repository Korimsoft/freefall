import JSDOMEnvironment from '@jest/environment-jsdom-abstract';
import * as jsdom from 'jsdom';

// jest-environment-jsdom still pins jsdom 26, which pulls in the deprecated whatwg-encoding;
// the abstract environment runs the tests on the jsdom version installed here instead.
export default class JsdomEnvironment extends JSDOMEnvironment {
    constructor(config, context) {
        super(config, context, jsdom);
    }
}
