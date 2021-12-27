import { Long, Filter as MongoFilter } from "mongodb"
import { Document, Types } from "../Types"
import { Match } from "./Match"

/** A filter which work with bigints */
export class BigFilter<T extends Types> {
    protected readonly path: string
    protected readonly expr: Record<string, unknown>
    protected readonly filter: MongoFilter<Document<T>>

    constructor(
        path: string,
        filter: MongoFilter<Document<T>>,
        expr: Record<string, unknown>
    ) {
        this.path = path
        this.filter = filter
        this.expr = expr
    }

    /** Filter if bigint is equal */
    equal(big: bigint): Match<T> {
        return this.compare("$eq", big)
    }

    /** Filter if bigint is not equal */
    notEqual(big: bigint): Match<T> {
        return this.compare("$ne", big)
    }

    /** Filter if bigint is greater than */
    greaterThan(big: bigint): Match<T> {
        return this.compare("$gt", big)
    }

    /** Filter if bigint is greater than or equal */
    greaterThanEqual(big: bigint): Match<T> {
        return this.compare("$gte", big)
    }

    /** Filter if bigint is less than */
    lessThan(big: bigint): Match<T> {
        return this.compare("$lt", big)
    }

    /** Filter if bigint is less than or equal */
    lessThanEqual(big: bigint): Match<T> {
        return this.compare("$lte", big)
    }

    /** Filter if the comparison return true */
    compare(
        operator: "$eq" | "$ne" | "$gt" | "$gte" | "$lt" | "$lte",
        big: bigint
    ): Match<T> {
        const match = new Match(this.filter)

        this.expr[operator] = [this.path, {
            $literal: Long.fromBigInt(big)
        }]

        return match
    }
}
