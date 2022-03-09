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
    DeleteOptions,
    ClientSession
} from "mongodb"

/** A wrapper class for querying */
export class Query<T extends Types> {
    protected readonly mongo: Mongo<T>
    protected readonly filter: Filter<Document<T>>
    protected readonly session?: ClientSession

    constructor(mongo: Mongo<T>, match: Match<T>, session?: ClientSession) {
        this.mongo = mongo
        this.filter = match.filter
        this.session = session
    }

    /** Find one matched document */
    async findOne(options?: FindOptions): Promise<Doc<T> | null> {
        options ??= {}
        options.session = this.session

        const doc = await this.mongo.collection.findOne(this.filter, options)
        return doc ? transform(doc) : null
    }

    /** Find all matched document */
    async findMulti(options?: FindOptions): Promise<Cursor<T>> {
        options ??= {}
        options.session = this.session

        const cursor = await this.mongo.collection.find(this.filter, options)
        return new Cursor(cursor)
    }

    /** Update one matched document */
    updateOne(value: T, options?: UpdateOptions): Promise<UpdateResult> {
        options ??= {}
        options.session = this.session
        options.upsert = false

        const refs = []
        const data = generate(value, refs)
        const filter: UpdateFilter<Document<T>> = { $set: { data, refs } }

        return this.mongo.collection.updateOne(this.filter, filter, options)
    }

    /** Update all matched document */
    updateMulti(value: T, options?: UpdateOptions): Promise<UpdateResult> {
        options ??= {}
        options.session = this.session
        options.upsert = false

        const refs = []
        const data = generate(value, refs)
        const filter: UpdateFilter<Document<T>> = { $set: { data, refs } }

        return this.mongo.collection.updateMany(this.filter, filter, options) as Promise<UpdateResult>
    }

    /** Rename a matched document to another key */
    rename(key: string, options?: UpdateOptions): Promise<UpdateResult> {
        options ??= {}
        options.session = this.session
        options.upsert = false

        const filter: UpdateFilter<Document<T>> = { $set: { key } }

        return this.mongo.collection.updateOne(this.filter, filter, options)
    }

    /** Delete one matched document */
    deleteOne(options?: DeleteOptions): Promise<DeleteResult> {
        options ??= {}
        options.session = this.session

        return this.mongo.collection.deleteOne(this.filter, options)
    }

    /** Delete all matched document */
    deleteMulti(options?: DeleteOptions): Promise<DeleteResult> {
        options ??= {}
        options.session = this.session

        return this.mongo.collection.deleteMany(this.filter, options)
    }
}
