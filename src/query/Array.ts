import { IncrementalString } from "../IncString"
import { Filter as MongoFilter } from "mongodb"
import { Document, Types } from "../Types"
import { ArbitraryFilter } from "./Filter"
import { Length } from "./Length"

/** A filter which work with arrays */
export class ArrayFilter<T extends Types, TData extends unknown[]> {
    protected readonly path: string
    protected readonly str: IncrementalString
    protected readonly expr: Record<string, unknown>
    protected readonly filter: MongoFilter<Document<T>>

    constructor(
        str: IncrementalString,
        path: string,
        filter: MongoFilter<Document<T>>,
        expr: Record<string, unknown>
    ) {
        this.str = str
        this.path = path
        this.filter = filter
        this.expr = expr
    }

    /** The array length filter */
    get length(): Length<T> {
        return new Length("$size", this.path, this.filter, this.expr)
    }

    /** Filter for the first element of array */
    first(): TData extends [infer E, ...unknown[]] ? ArbitraryFilter<T, E> : TData extends (infer E)[] ? ArbitraryFilter<T, E> : never
    first(): ArbitraryFilter<T, unknown> {
        const variable = this.str.str

        this.str.increment()

        const expr = {}
        const filter = new ArbitraryFilter(this.str, `$$${variable}`, this.filter, expr)

        this.expr.$let = {
            vars: {
                [variable]: {
                    $first: this.path
                }
            },
            in: expr
        }

        return filter
    }

    /** Filter for the last element of array */
    last(): TData extends [...unknown[], infer E] ? ArbitraryFilter<T, E> : TData extends (infer E)[] ? ArbitraryFilter<T, E> : never
    last(): ArbitraryFilter<T, unknown> {
        const variable = this.str.str

        this.str.increment()

        const expr = {}
        const filter = new ArbitraryFilter(this.str, `$$${variable}`, this.filter, expr)

        this.expr.$let = {
            vars: {
                [variable]: {
                    $last: this.path
                }
            },
            in: expr
        }

        return filter
    }

    /** Filter for the specific element of array */
    at<P extends Exclude<Partial<TData>["length"], TData["length"]> & number>(index: P | number): ArbitraryFilter<T, TData[P]>
    at(index: number): ArbitraryFilter<T, unknown> {
        const variable = this.str.str

        this.str.increment()

        const expr = {}
        const filter = new ArbitraryFilter(this.str, `$$${variable}`, this.filter, expr)

        this.expr.$let = {
            vars: {
                [variable]: {
                    $arrayElemAt: [this.path, { $literal: index }]
                }
            },
            in: expr
        }

        return filter
    }
}
