import { Filter as MongoFilter } from "mongodb"
import { Document, Types } from "../Types"
import { Length } from "./Length"
import { Match } from "./Match"

/** A filter which work with strings */
export class StrFilter<T extends Types> {
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

    /** The string length filter */
    get length(): Length<T> {
        return new Length("$strLenCP", this.path, this.filter, this.expr)
    }

    /** Filter if string is equal */
    equal(str: string): Match<T> {
        return this.compare("$eq", str)
    }

    /** Filter if string is not equal */
    notEqual(str: string): Match<T> {
        return this.compare("$ne", str)
    }

    /** Filter if string match with the regex */
    match(regex: RegExp): Match<T> {
        const match = new Match(this.filter)

        const options: string[] = []

        if (regex.ignoreCase) options.push("i")
        if (regex.multiline) options.push("m")
        if (regex.dotAll) options.push("s")

        this.expr.$regexMatch = {
            input: this.path,
            regex: {
                $literal: regex.source
            },
            options: {
                $literal: options.join("")
            }
        }

        return match
    }

    /** Filter if the comparison returns true */
    compare(
        operator: "$eq" | "$ne",
        str: string
    ): Match<T> {
        const match = new Match(this.filter)

        this.expr[operator] = [this.path, {
            $literal: str
        }]

        return match
    }
}
