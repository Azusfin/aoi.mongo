import { Filter as MongoFilter } from "mongodb"
import { Document, Types } from "../Types"
import { Match } from "./Match"

/** A filter which work with booleans */
export class BoolFilter<T extends Types> {
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

    /** Filter if the boolean is truthy */
    get truthy(): Match<T> {
        return this.compare(true)
    }

    /** Filter if the boolean is falsy */
    get falsy(): Match<T> {
        return this.compare(false)
    }

    /** Filter if the comparison returns true */
    compare(
        bool: boolean
    ): Match<T> {
        const match = new Match(this.filter)

        this.expr.$eq = [this.path, {
            $literal: bool
        }]

        return match
    }
}
