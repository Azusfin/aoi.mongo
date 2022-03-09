import { ClientSession, CreateIndexesOptions, DeleteResult, IndexDirection, MongoClient, TransactionOptions, UpdateResult } from "mongodb"
import { Cursor, Doc, Mongo, Types } from "."
import { Mutex } from "./Mutex"
import { Match, Filter, Query } from "./query"

const transactions = new WeakMap<MongoClient, TransactionLocker>()

interface TransactionLocker {
    session?: ClientSession
    mutex: Mutex
}

/** A wrapper of mongo class for transaction */
export class Transaction<T extends Types> {
    /** Start transaction for a mongo client */
    public static async startTransaction(client: MongoClient, options?: TransactionOptions): Promise<void> {
        const locker = transactions.get(client) ?? { mutex: new Mutex() }

        if (locker.session) throw new TransactionError("Transaction already started")

        await locker.mutex.lock()

        locker.session = client.startSession()

        await locker.session.startTransaction(options)

        transactions.set(client, locker)
    }

    /** Commit transaction for a mongo client */
    public static async commitTransaction(client: MongoClient): Promise<void> {
        const locker = transactions.get(client)

        if (!locker?.session) throw new TransactionError("Transaction is not started")

        await locker.session.commitTransaction()
        await endTransaction(client)
    }

    /** Abort transaction for a mongo client */
    public static async abortTransaction(client: MongoClient): Promise<void> {
        const locker = transactions.get(client)

        if (!locker?.session) throw new TransactionError("Transaction is not started")

        await locker.session.abortTransaction()
        await endTransaction(client)
    }

    /** The mongo instance to wrap */
    public readonly mongo: Mongo<T>

    constructor(mongo: Mongo<T>) {
        this.mongo = mongo
    }

    get session(): ClientSession {
        const locker = transactions.get(this.mongo.client)
        if (!locker?.session) throw new TransactionError("Transaction is not started")
        return locker.session
    }

    /**
     * Set a data into the collection
     * @param key The data key
     * @param value The data value
     */
    set(key: string, value: T): Promise<UpdateResult> {
        return this.mongo.set(key, value, this.session)
    }

    /**
     * Get a document from the collection
     * @param key The document key
     */
    get(key: string): Promise<Doc<T> | null> {
        return this.mongo.get(key, this.session)
    }

    /**
     * Delete a document from the collection
     * @param key The document key
     */
    delete(key: string): Promise<DeleteResult> {
        return this.mongo.delete(key, this.session)
    }

    /**
     * Find and match all document key with the matcher in the collection
     * @param matcher The matcher in regex
     */
    match(matcher: RegExp): Promise<Cursor<T>> {
        return this.mongo.match(matcher, this.session)
    }

    /**
     * Get all document in the collection
     */
    all(): Promise<Cursor<T>> {
        return this.mongo.all(this.session)
    }

    /**
     * Delete all document in the collection
     */
    deleteAll(): Promise<DeleteResult> {
        return this.mongo.deleteAll(this.session)
    }

    /** Create an index in the ocllection */
    index(indexSpec: {
        key?: IndexDirection,
        data?: IndexDirection | {
            [K in keyof T]: IndexDirection
        }
    }, options?: CreateIndexesOptions): Promise<void> {
        options ??= {}
        options.session = this.session

        return this.mongo.index(indexSpec, options)
    }

    /** Create a query object */
    query(match: Match<T>): Query<T> {
        return new Query(this.mongo, match, this.session)
    }

    /** Shortcut for creating filter */
    filter(): Filter<T> {
        return new Filter()
    }
}

async function endTransaction(client: MongoClient): Promise<void> {
    const locker = transactions.get(client)!

    await locker.session!.endSession()

    locker.session = undefined
    locker.mutex.unlock()
}

/**
 * The class to represent transaction error
 */
export class TransactionError extends Error {
    constructor(message: string) {
        super(message)
        this.name = "AoiMongoError"
    }
}
