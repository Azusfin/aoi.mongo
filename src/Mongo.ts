import { Cursor } from "./Cursor"
import { generate } from "./Generator"
import { Filter, Query, Match } from "./query"
import { Doc, Document, Types } from "./Types"
import {
    Db,
    DbOptions,
    Collection,
    MongoClient,
    UpdateResult,
    DeleteResult,
    IndexDirection,
    CollectionOptions,
    CreateIndexesOptions
} from "mongodb"

/** The options that must be passed to mongo instance */
export interface MongoOptions {
    /** The mongo client used */
    client: MongoClient
    /** The database used */
    dbName: string
    /** The collection used */
    collectionName: string
    /** The options for the db */
    dbOptions?: DbOptions
    /** The options for the collection */
    collectionOptions?: CollectionOptions
}

/** The mongo instance constructor */
export class Mongo<T extends Types> {
    /** The mongo client used */
    readonly client: MongoClient
    /** The database instance used */
    readonly db: Db
    /** The collection instance used */
    readonly collection: Collection<Document<T>>

    /**
     * @param options The options for the mongo instance
     */
    constructor(options: MongoOptions) {
        if (typeof options !== "object" || options === null) throw new TypeError("options must be a non-null object")
        if (typeof options.client !== "object" || options === null) throw new TypeError("client option must be a non-null object")
        if (typeof options.dbName !== "string") throw new TypeError("dbName option must be a valid string")
        if (typeof options.collectionName !== "string") throw new TypeError("collectionName option must be a valid string")

        this.client = options.client
        this.db = this.client.db(options.dbName, options.dbOptions)
        this.collection = this.db.collection(options.collectionName, options.collectionOptions)

        void this.index({ key: 1 }, { unique: true })
    }

    /**
     * Set a data into the collection
     * @param key The data key
     * @param value The data value
     */
    async set(key: string, value: T): Promise<UpdateResult> {
        const refs = []
        const data = generate(value, refs)
        const res = await this.collection.updateOne({ key }, {
            $setOnInsert: { key },
            $set: { data, refs }
        }, { upsert: true })

        return res
    }

    /**
     * Get a document from the collection
     * @param key The document key
     */
    async get(key: string): Promise<Doc<T> | null> {
        return this.query(
            this.filter()
            .key
            .equal(key)
        ).findOne()
    }

    /**
     * Delete a document from the collection
     * @param key The document key
     */
    async delete(key: string): Promise<DeleteResult> {
        return this.query(
            this.filter()
            .key
            .equal(key)
        ).deleteOne()
    }

    /**
     * Find and match all document key with the matcher in the collection
     * @param matcher The matcher in regex
     */
    async match(matcher: RegExp): Promise<Cursor<T>> {
        return this.query(
            this.filter()
            .key
            .match(matcher)
        ).findMulti()
    }

    /**
     * Get all document in the collection
     */
    async all(): Promise<Cursor<T>> {
        const cursor = await this.collection.find({})

        return new Cursor(cursor)
    }

    /** Create an index in the ocllection */
    async index(indexSpec: {
        key?: IndexDirection,
        data?: IndexDirection | {
            [K in keyof T]: IndexDirection
        }
    }, options?: CreateIndexesOptions): Promise<void> {
        const spec: Record<string, IndexDirection> = {}

        if (typeof indexSpec.key !== "undefined") spec.key = indexSpec.key
        if (typeof indexSpec.data !== "undefined") {
            if (typeof indexSpec.data === "object") {
                const keys = Object.keys(indexSpec.data)
                for (let i = 0; i < keys.length; i++) {
                    const key = keys[i]
                    if (!key.startsWith("$") && !key.includes(".") && !key.includes("\x00")) {
                        spec[`refs.0.${key}`] = indexSpec.data[key]
                    }
                }
            } else spec.data = indexSpec.data
        }

        if (options) await this.collection.createIndex(spec, options)
        else await this.collection.createIndex(spec)
    }

    /** Create a query object */
    query(match: Match<T>): Query<T> {
        return new Query(this, match)
    }

    /** Shortcut for creating filter */
    filter(): Filter<T> {
        return new Filter()
    }
}
