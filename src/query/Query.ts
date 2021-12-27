import { Match } from "./Match"
import { Mongo } from "../Mongo"
import { Cursor } from "../Cursor"
import { generate } from "../Generator"
import { transform } from "../Transformer"
import { Document, Doc, Types } from "../Types"
import {
    Filter,
    FindOptions,
    UpdateResult,
    UpdateFilter,
    DeleteResult,
    UpdateOptions,
    DeleteOptions
} from "mongodb"

/** A wrapper class for querying */
export class Query<T extends Types> {
    protected readonly mongo: Mongo<T>
    protected readonly filter: Filter<Document<T>>

    constructor(mongo: Mongo<T>, match: Match<T>) {
        this.mongo = mongo
        this.filter = match.filter
    }

    /** Find one matched document */
    async findOne(options?: FindOptions): Promise<Doc<T> | null> {
        const doc = await this.mongo.collection.findOne(this.filter, options)
        return doc ? transform(doc) : null
    }

    /** Find all matched document */
    async findMulti(options?: FindOptions): Promise<Cursor<T>> {
        const cursor = await this.mongo.collection.find(this.filter, options)
        return new Cursor(cursor)
    }

    /** Update one matched document */
    updateOne(value: T, options?: UpdateOptions): Promise<UpdateResult> {
        const refs = []
        const data = generate(value, refs)
        const filter: UpdateFilter<Document<T>> = { $set: { data, refs } }

        if (options) options.upsert = false

        if (options) return this.mongo.collection.updateOne(this.filter, filter, options)
        return this.mongo.collection.updateOne(this.filter, filter)
    }

    /** Update all matched document */
    updateMulti(value: T, options?: UpdateOptions): Promise<UpdateResult> {
        const refs = []
        const data = generate(value, refs)
        const filter: UpdateFilter<Document<T>> = { $set: { data, refs } }

        if (options) options.upsert = false

        if (options) return this.mongo.collection.updateMany(this.filter, filter, options) as Promise<UpdateResult>
        return this.mongo.collection.updateMany(this.filter, filter) as Promise<UpdateResult>
    }

    /** Rename a matched document to another key */
    rename(key: string, options?: UpdateOptions): Promise<UpdateResult> {
        const filter: UpdateFilter<Document<T>> = { $set: { key } }

        if (options) options.upsert = false

        if (options) return this.mongo.collection.updateOne(this.filter, filter, options)
        return this.mongo.collection.updateOne(this.filter, filter)
    }

    /** Delete one matched document */
    deleteOne(options?: DeleteOptions): Promise<DeleteResult> {
        if (options) return this.mongo.collection.deleteOne(this.filter, options)
        return this.mongo.collection.deleteOne(this.filter)
    }

    /** Delete all matched document */
    deleteMulti(options?: DeleteOptions): Promise<DeleteResult> {
        if (options) return this.mongo.collection.deleteMany(this.filter, options)
        return this.mongo.collection.deleteMany(this.filter)
    }
}
