// A module imported again (as the game tests do) must not define the tag a second time;
// the class comes from the registry so `instanceof` works in every copy of the module.
export function defineOnce<T extends CustomElementConstructor>(tag: string, element: T): T {
    if (!customElements.get(tag)) {
        customElements.define(tag, element);
    }
    return customElements.get(tag) as T;
}
