import { Filter as MongoFilter } from "mongodb"
import { Document, Types } from "../Types"
import { Match } from "./Match"

/** A filter which work with data length */
export class Length<T extends Types> {
    protected readonly path: string
    protected readonly operator: string
    protected readonly expr: Record<string, unknown>
    protected readonly filter: MongoFilter<Document<T>>

    constructor(
        operator: string,
        path: string,
        filter: MongoFilter<Document<T>>,
        expr: Record<string, unknown>
    ) {
        this.operator = operator
        this.path = path
        this.filter = filter
        this.expr = expr
    }

    /** Filter if length is equal */
    equal(length: number): Match<T> {
        return this.compare("$eq", length)
    }

    /** Filter if length is not equal */
    notEqual(length: number): Match<T> {
        return this.compare("$ne", length)
    }

    /** Filter if length is greater than */
    greaterThan(length: number): Match<T> {
        return this.compare("$gt", length)
    }

    /** Filter if length is greater than or equal */
    greaterThanEqual(length: number): Match<T> {
        return this.compare("$gte", length)
    }

    /** Filter if length is less than */
    lessThan(length: number): Match<T> {
        return this.compare("$lt", length)
    }

    /** Filter if length is less than or equal */
    lessThanEqual(length: number): Match<T> {
        return this.compare("$lte", length)
    }

    /** Filter if the comparison return true */
    compare(
        operator: "$eq" | "$ne" | "$gt" | "$gte" | "$lt" | "$lte",
        length: number
    ): Match<T> {
        const match = new Match(this.filter)

        this.expr[operator] = [
            {
                [this.operator]: this.path
            },
            {
                $literal: length
            }
        ]

        return match
    }
}
