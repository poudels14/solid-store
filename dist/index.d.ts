declare const $STORE: unique symbol;
declare const $PREV: unique symbol;
declare const $GET: unique symbol;
declare const $SET: unique symbol;
declare type StoreRef = Record<keyof any, any> & {
    [$PREV]?: any;
    [$GET]?: () => any;
    [$SET]?: (v: any) => void;
};
declare type RootStore<T> = {
    [$STORE]: Symbol;
} & StoreRef & T;
declare type Store<T> = T & StoreRef;
declare type StoreSignal<T> = StoreRef & (() => Store<T>);
declare type StoreSetter<T> = ((field: string, value: Store<T>) => void) | ((value: Store<T>) => void);
declare function createStore<T>(init: T): [RootStore<T>, StoreSetter<T>];
declare function storeRef<T>(store: Store<unknown>): any;
export { createStore, storeRef };
export type { Store, StoreSignal };
