# Usage

```js
// creating store:
// returned store is a normal JS object
// Unlink solid-js/store, it's not a proxy
const [store, setStore] = createStore({
  name: "Solid Store",
});

const Component = () => {
  // To get reactive version of the store created above, call storeRef
  // rStore is a reactive proxy similar to solid-js/store that returns
  // the underlying value when a field is called
  const rStore = storeRef(store);

  createEffect(() => {
    // fields can be called to get underlying value
    console.log("Name of the store:", rStore.name());
  });

  setTimeout(() => {
    store.name = "Store won't be updated";
  }, 500);

  setTimeout(() => {
    // store can be updated only by calling setStore
    setStore("name", "New Solid Store");
  }, 1000);

  // No need to add "()" in JSX
  return <div>Name: {rStore.name}</div>;
};
```
