import { Filter as MongoFilter } from "mongodb"
import { Document, Types } from "../Types"
import { Match } from "./Match"

/** A filter which work with numbers */
export class NumFilter<T extends Types> {
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

    /** Filter if number is equal */
    equal(num: number): Match<T> {
        return this.compare("$eq", num)
    }

    /** Filter if number is not equal */
    notEqual(num: number): Match<T> {
        return this.compare("$ne", num)
    }

    /** Filter if number is greater than */
    greaterThan(num: number): Match<T> {
        return this.compare("$gt", num)
    }

    /** Filter if number is greater than or equal */
    greaterThanEqual(num: number): Match<T> {
        return this.compare("$gte", num)
    }

    /** Filter if number is less than */
    lessThan(num: number): Match<T> {
        return this.compare("$lt", num)
    }

    /** Filter if number is less than or equal */
    lessThanEqual(num: number): Match<T> {
        return this.compare("$lte", num)
    }

    /** Filter if the comparison return true */
    compare(
        operator: "$eq" | "$ne" | "$gt" | "$gte" | "$lt" | "$lte",
        num: number
    ): Match<T> {
        const match = new Match(this.filter)

        this.expr[operator] = [this.path, {
            $literal: num
        }]

        return match
    }
}
