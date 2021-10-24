import { batch, createSignal } from "solid-js";
const $STORE = Symbol("_solid_store_");
const $PREV = Symbol("_prev_");
const $GET = Symbol("_get_signal_");
const $SET = Symbol("_set_signal_");
// since function is the target of the proxy,
// name and length can't be changed. so, use symbol
// for those fields
const $NAME = Symbol("_name_");
const $LENGTH = Symbol("_length_");
const STORE_REFS = new Map();
function createStore(init) {
    const root = Symbol("_store_root_");
    // TODO: clone init?
    const store = Object.defineProperties(init, {
        [$STORE]: {
            value: root,
            writable: false,
            enumerable: true,
        },
    });
    STORE_REFS.set(root, trap(init));
    return [store, storeUpdater(root)];
}
const trap = (prev) => {
    let target = Object.defineProperty(function () { }, $PREV, {
        value: prev,
        writable: true,
        enumerable: true, // TODO
    });
    return new Proxy(target, {
        get(target, p) {
            if (p === $PREV || p === $GET || p === $SET) {
                return target[p];
            }
            let tp = p === "name" ? $NAME : p === "length" ? $LENGTH : p;
            let t = target[tp];
            if (!t && (tp === $NAME || p === $LENGTH || typeof p === "string")) {
                const data = target[$PREV]?.[p];
                t = trap(data);
                target[tp] = t;
            }
            return t;
        },
        apply(target) {
            if (!target[$GET]) {
                const [get, set] = createSignal(target[$PREV]);
                target[$GET] = get;
                target[$SET] = set;
            }
            return target[$GET]();
        },
        // TODO: trap set so that storeRef can't be assigned
        // setStore should be called to trigger the reactive update
    });
};
function storeRef(store) {
    const root = store[$STORE];
    if (!root) {
        throw new Error(`"useStore" can only be used with stores. Using with:` +
            JSON.stringify(store));
    }
    return STORE_REFS.get(root);
}
function storeUpdater(root) {
    return (...path) => {
        batch(() => {
            const value = path.pop();
            const rootRef = STORE_REFS.get(root);
            let ref = rootRef;
            path.forEach((p) => {
                ref = ref[p];
            });
            const prev = ref[$PREV];
            if (prev === value) {
                return;
            }
            compareAndNotify(ref, value);
            let r = rootRef, n = value;
            for (let i = 0; i < path.length; i++) {
                r = r[path[i]];
                r[$SET]?.(n);
                n = n[path[i]];
            }
        });
    };
}
const compareAndNotify = (ref, value) => {
    const prev = ref[$PREV];
    if (prev === value) {
        return;
    }
    if (typeof value === "object" || typeof prev === "object") {
        const newKeys = Object.keys(value || {});
        const removedFields = new Set([...Object.keys(prev || {})]);
        for (let i = 0; i < newKeys.length; i++) {
            const k = newKeys[i];
            let v = value[k];
            const refK = ref[k];
            removedFields.delete(k);
            // TODO: figure out how to "cache" array items properly
            compareAndNotify(refK, v);
        }
        [...removedFields].forEach((k) => {
            compareAndNotify(ref[k], undefined);
        });
        if (prev?.length !== value?.length) {
            ref[$LENGTH][$SET]?.(value.length);
        }
    }
    ref[$SET]?.(value);
    ref[$PREV] = value;
};
export { createStore, storeRef };
