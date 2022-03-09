const assert = require("assert/strict")
const mongodb = require("mongodb")
const aoimongo = require("..")
const config = require("./config.json")

;(async function() {
    const mongoClient = new mongodb.MongoClient(config.url)
    const client = await mongoClient.connect()
    const mongo = new aoimongo.Mongo({
        client,
        dbName: "aoi",
        collectionName: "main"
    })

    const a = {
        n: 999,
        s: "aaa"
    }

    const b = {
        n: 91313,
        s: "bbb"
    }

    const c = {
        n: 1355,
        s: "ccc",
        d: new Date()
    }

    const d = {
        n: 13135,
        s: "ddd",
        d: new Date()
    }

    const e = {
        n: 42613,
        s: "eee"
    }

    const f = {
        n: 64146,
        s: "fff"
    }

    const g = {
        n: 624791,
        s: "ggg",
        d: new Date()
    }

    const h = {
        n: 5135135,
        s: "hhh",
        d: new Date()
    }

    const transaction = new aoimongo.Transaction(mongo)

    describe("aoi.mongo", function() {
        it("Delete All", async function() {
            const cursor = await mongo.all()
            const res = await mongo.deleteAll()
            assert.equal(res.deletedCount, await cursor.cursor.count())
        })

        describe("Set", function() {
            it("a", async function() {
                const res = await mongo.set("a", a)
                assert.equal(res.upsertedCount, 1)
            })

            it("b", async function() {
                const res = await mongo.set("b", b)
                assert.equal(res.upsertedCount, 1)
            })

            it("c", async function() {
                const res = await mongo.set("c", c)
                assert.equal(res.upsertedCount, 1)
            })

            it("d", async function() {
                const res = await mongo.set("d", d)
                assert.equal(res.upsertedCount, 1)
            })

            it("e", async function() {
                const res = await mongo.set("e", e)
                assert.equal(res.upsertedCount, 1)
            })

            it("f", async function() {
                const res = await mongo.set("f", f)
                assert.equal(res.upsertedCount, 1)
            })

            it("g", async function() {
                const res = await mongo.set("g", g)
                assert.equal(res.upsertedCount, 1)
            })
        })

        describe("Get", function() {
            it("a", async function() {
                const doc = await mongo.get("a")
                assert.deepEqual(doc, {
                    key: "a",
                    value: a
                })
            })

            it("?.s=='fff'", async function() {
                const doc = await mongo.query(
                    mongo.filter()
                        .data
                        .objGet("s")
                        .string()
                        .equal("fff")
                ).findOne()
                assert.deepEqual(doc, {
                    key: "f",
                    value: f
                })
            })

            it("?.d.year>=2021", async function() {
                const cursor = await mongo.query(
                    mongo.filter()
                        .data
                        .objGet("d")
                        .date()
                        .year
                        .greaterThanEqual(2021)
                ).findMulti()
                const documents = []
                for await (const doc of cursor) documents.push(doc)
                assert.deepEqual(documents, [{
                    key: "c",
                    value: c
                }, {
                    key: "d",
                    value: d
                }, {
                    key: "g",
                    value: g
                }])
            })
        })

        describe("Update", function() {
            it("e -> e.s=='eeeee'", async function() {
                const res = await mongo.set("e", {
                    n: 42613,
                    s: "eeeee"
                })
                assert.equal(res.modifiedCount, 1)
            })
        })

        describe("Rename", function() {
            it("f -> ff", async function() {
                const res = await mongo.query(
                    mongo.filter()
                        .key.equal("f")
                ).rename("ff")
                assert.equal(res.modifiedCount, 1)
            })
        })

        describe("Delete", function() {
            it("b", async function() {
                const res = await mongo.delete("b")
                assert.equal(res.deletedCount, 1)
            })

            it("a or e or ff", async function() {
                const res = await mongo.query(
                    mongo.filter()
                        .key.equal("a")
                        .or(mongo.filter().key.equal("e"))
                        .or(mongo.filter().key.equal("ff"))
                ).deleteMulti()
                assert.equal(res.deletedCount, 3)
            })

            it("?.d.year>=2021", async function() {
                const res = await mongo.query(
                    mongo.filter()
                        .data
                        .objGet("d")
                        .date()
                        .year
                        .greaterThanEqual(2021)
                ).deleteMulti()
                assert.equal(res.deletedCount, 3)
            })
        })

        describe("With Transaction", function() {
            it("Start", function() {
                return aoimongo.Transaction.startTransaction(client)
            })

            it("Set", async function() {
                const res = await transaction.set("h", h)
                assert.equal(res.upsertedCount, 1)
            })

            it("Get", async function() {
                const doc = await transaction.get("h")
                assert.deepEqual(doc, { key: "h", value: h })
            })

            it("Delete", async function() {
                const res = await transaction.delete("h")
                assert.equal(res.deletedCount, 1)
            })

            it("Commit", function() {
                return aoimongo.Transaction.commitTransaction(client)
            })

            it("Start Again", function() {
                return aoimongo.Transaction.startTransaction(client)
            })

            it("Set Again", async function() {
                const res = await transaction.set("h", h)
                assert.equal(res.upsertedCount, 1)
            })

            it("Get Again", async function() {
                const doc = await transaction.get("h")
                assert.deepEqual(doc, { key: "h", value: h })
            })

            it("Delete Again", async function() {
                const res = await transaction.delete("h")
                assert.equal(res.deletedCount, 1)
            })

            it("Abort", function() {
                return aoimongo.Transaction.abortTransaction(client)
            })
        })
    })

    run()
})()
