@function can-define.types.default default
@parent can-define.behaviors

Returns the default value for instances of the defined type.  The default value is defined on demand, when the property
is read for the first time.

@signature `default()`

A function can be provided that returns the default value used for this property, like:

```js
prop: {
  default: function(){ return []; }
}
```


If the default value should be an object of some type, it should be specified as the return value of a function (the above call signature) so that all instances of this map don't point to the same object.  For example, if the property `value` above had not returned an empty array but instead just specified an array using the next call signature below, all instances of that map would point to the same array (because JavaScript passes objects by reference).

@return {*} The default value.  This will be passed through setter and type.

@signature `default`

Any value can be provided as the default value used for this property, like:

```
prop: {
  default: 'foo'
}
```

@param {*} defaultVal The default value, which will be passed through setter and type.

@body

## Use

The following defaults `age` to `0` and `address` to an object:

```js
// A default age of `0`:
var Person = DefineMap.extend({
  age: {
    default: 0
  },
  address: {
    default: function(){
      return {city: "Chicago", state: "IL"};
    };
  }
});
```

## Alternates

There is a third way to provide a default value, which is explained in the [can-define.types.defaultConstructor] docs page. `default` lowercased is for providing default values for a property type, while `Default` uppercased is for providing a constructor function, which will be invoked with `new` to create a default value for each instance of this map.