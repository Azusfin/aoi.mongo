import { Filter as MongoFilter } from "mongodb"
import { Document, Types } from "../Types"
import { Match } from "./Match"

/** A filter which work with regexes */
export class RegexFilter<T extends Types> {
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

    /** Filter if regex is equal */
    equal(regex: RegExp): Match<T> {
        return this.compare("$eq", regex)
    }

    /** Filter if regexis not equal */
    notEqual(regex: RegExp): Match<T> {
        return this.compare("$ne", regex)
    }

    /** Filter if the comparison return true */
    compare(
        operator: "$eq" | "$ne",
        regex: RegExp
    ): Match<T> {
        const match = new Match(this.filter)

        this.expr[operator] = [this.path, {
            $literal: regex
        }]

        return match
    }
}
