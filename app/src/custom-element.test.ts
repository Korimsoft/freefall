import { defineOnce } from './custom-element';

describe('defineOnce', () => {
    it('registers the element under its tag', () => {
        class FirstElement extends HTMLElement {}

        const defined = defineOnce('first-test-element', FirstElement);

        expect(defined).toBe(FirstElement);
        expect(document.createElement('first-test-element')).toBeInstanceOf(FirstElement);
    });

    it('keeps the first element when the tag is defined again', () => {
        // A copy of a module imported again brings its own copy of the class.
        class OriginalElement extends HTMLElement {}
        class CopiedElement extends HTMLElement {}
        defineOnce('again-test-element', OriginalElement);

        const defined = defineOnce('again-test-element', CopiedElement);

        expect(defined).toBe(OriginalElement);
        expect(document.createElement('again-test-element')).toBeInstanceOf(OriginalElement);
    });
});
