# aoi.mongo

> A mongodb wrapper for aoi.js

[![NPM Version](https://img.shields.io/npm/v/aoi.mongo.svg?maxAge=3600)](https://www.npmjs.com/package/aoi.mongo)
[![NPM Downloads](https://img.shields.io/npm/dt/aoi.mongo.svg?maxAge=3600)](https://www.npmjs.com/package/aoi.mongo)

## Documentation

https://azusfin.github.io/aoi.mongo

## Notes

- Need mongodb server 3.6+
- Object and map keys will be ignored if met atleast one of these condition:
    1. Starts with '$'
    2. Includes '.'
    3. Includes null character

## Examples

- [Setup](#setup)
- [Set Data](#set-data)
- [Get Data](#get-data)
- [Delete Data](#delete-data)
- [Custom Query](#custom-query)
- [Cursor](#cursor)

### Setup

```js
const { Mongo } = require("aoi.mongo")
const { MongoClient } = require("mongodb")

;(async () => {

const mongoClient = new MongoClient(process.env.MONGO_URL, { keepAlive: true })
const client = await mongoClient.connect()
const mongo = new Mongo({
    client,
    dbName: "aoi",
    collectionName: "main"
})

// ...

})()
```

### Set Data

```js
// Set foo to "bar" (string)
await mongo.set("foo", "bar")

// Set fizz to { fizz: "buzz" } (object)
await mongo.set("fizz", { fizz: "buzz" })
```

### Get Data

```js
const fooBar = await mongo.get("foo")
const fooKey = fooBar.key // "foo"
const barValue = foobar.value // "bar"

const fizzBuzz = await mongo.get("fizz")
const fizzKey = fizzBuzz.key // "fizz"
const buzzValue = fizzBuzz.value // { fizz: "buzz" }
```

### Delete Data

```js
await mongo.delete("fizz")
const fizzBuzz = await mongo.get("fizz") // null
```

### Custom Query

```js
// Find a document with "bar" as the value
const fooBar = await mongo.query(
    mongo.filter()
        .data
        .string()
        .equal("bar")
).findOne() // { key: "foo", value: "bar" }

// Rename foo to fizz
await mongo.query(
    mongo.filter()
        .key
        .equal("foo")
).rename("fizz")
const fizzBar = await mongo.get("fizz") // { key: "fizz", value: "bar" }

// Update value from bar to buzz
await mongo.query(
    mongo.filter()
        .data
        .string()
        .equal("bar")
).updateOne("buzz")
const fizzBuzz = await mongo.get("fizz") // { key: "fizz", value: "buzz" }
```

### Cursor

```js
// Some method return a cursor, one of them is Mongo.all()

const cursor = await mongo.all()
const data = []

for await (const doc of cursor) {
    data.push(doc)
}

// [{ key: "fizz", value: "buzz" }]
```

### Transaction
```js
/**
 * Transaction is added on aoi.mongo v0.2
 * The methods are available within "Transaction" class
 */

// Example:

const { Mongo, Transaction } = require("aoi.mongo")
const { MongoClient } = require("mongodb")

;(async () => {

const mongoClient = new MongoClient(process.env.MONGO_URL, { keepAlive: true })
const client = await mongoClient.connect()
const mongo = new Mongo({
    client,
    dbName: "aoi",
    collectionName: "main"
})

const transaction = new Transaction(mongo)

await Transaction.startTransaction(client)

try {
    // transaction.set(...)
    // transaction.get(...)
    // trasnaction.query(...)
    // ...

    await Transaction.commitTransaction(client)
} catch {
    await Transaction.abortTransaction(client)
}

})()
```
