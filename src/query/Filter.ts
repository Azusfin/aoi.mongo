import { Match } from "./Match"
import { Length } from "./Length"
import { BoolFilter } from "./Bool"
import { DateFilter } from "./Date"
import { BigFilter } from "./BigInt"
import { NumFilter } from "./Number"
import { StrFilter } from "./String"
import { ArrayFilter } from "./Array"
import { RegexFilter } from "./RegExp"
import { Filter as MongoFilter } from "mongodb"
import { IncrementalString } from "../IncString"
import { Document, DataTypes, Types, Helpers } from "../Types"

/** Filter for querying */
export class Filter<T extends Types> {
    /** The key filter */
    get key(): StrFilter<T> {
        const expr = {}
        return new StrFilter("$key", { $expr: expr }, expr)
    }

    /** The data filter */
   get data(): ArbitraryFilter<T, T> {
       const expr = {}
       return new ArbitraryFilter(
        new IncrementalString(),
        "$data",
        { $expr: expr },
        expr
    )
   }
}

/** Arbitrary filter for data */
export class ArbitraryFilter<T extends Types, TData extends Types> {
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

    /** Filter if the data is nullish */
    get nullish(): Match<T> {
        const match = new Match(this.filter)

        this.expr.$or = [
            {
                $eq: [{
                    $type: this.path
                }, "missing"]
            },
            {
                $eq: [this.path, null]
            },
            {
                $eq: [`${this.path}.type`, DataTypes.Null]
            }
        ]

        return match
    }

    /** Filter of boolean type */
    bool(): DataTypes.Bool extends Helpers.DataTypeOf<TData> ? BoolFilter<T> : never
    bool(): BoolFilter<T> {
        const expr = {}
        const filter = new BoolFilter(`${this.path}.bool`, this.filter, expr)

        this.resolveValue(expr, DataTypes.Bool)

        return filter
    }

    /** Filter of number type */
    number(): DataTypes.Number extends Helpers.DataTypeOf<TData> ? NumFilter<T> : never
    number(): NumFilter<T> {
        const expr = {}
        const filter = new NumFilter(`${this.path}.num`, this.filter, expr)

        this.resolveValue(expr, DataTypes.Number)

        return filter
    }

    /** Filter of bigint type */
    bigint(): DataTypes.BigInt extends Helpers.DataTypeOf<TData> ? BigFilter<T> : never
    bigint(): BigFilter<T> {
        const expr = {}
        const filter = new BigFilter(`${this.path}.big`, this.filter, expr)

        this.resolveValue(expr, DataTypes.BigInt)

        return filter
    }

    /** Filter of string type */
    string(): DataTypes.String extends Helpers.DataTypeOf<TData> ? StrFilter<T> : never
    string(): StrFilter<T> {
        const expr = {}
        const filter = new StrFilter(`${this.path}.str`, this.filter, expr)

        this.resolveValue(expr, DataTypes.String)

        return filter
    }

    /** Filter of date type */
    date(): DataTypes.Date extends Helpers.DataTypeOf<TData> ? DateFilter<T> : never
    date(): DateFilter<T> {
        const expr = {}
        const filter = new DateFilter(this.str, `${this.path}.date`, this.filter, expr)

        this.resolveValue(expr, DataTypes.Date)

        return filter
    }

    /** Filter of regexp type */
    regexp(): DataTypes.RegExp extends Helpers.DataTypeOf<TData> ? RegexFilter<T> : never
    regexp(): RegexFilter<T> {
        const expr = {}
        const filter = new RegexFilter(`${this.path}.regex`, this.filter, expr)

        this.resolveValue(expr, DataTypes.RegExp)

        return filter
    }

    /** Filter of binary data length */
    byteLength(): DataTypes.Bytes extends Helpers.DataTypeOf<TData> ? Length<T> : never
    byteLength(): Length<T> {
        const expr = {}
        const path = this.resolveReference(expr, DataTypes.Bytes)

        return new Length("$binarySize", `${path}.buf`, this.filter, expr)
    }

    /** Filter of array type */
    array(): DataTypes.Array extends Helpers.DataTypeOf<TData> ? TData extends unknown[] ? ArrayFilter<T, TData> : ArrayFilter<T, unknown[]> : never
    array(): ArrayFilter<T, unknown[]> {
        const expr = {}
        const path = this.resolveReference(expr, DataTypes.Array)

        return new ArrayFilter(this.str, `${path}.arr`, this.filter, expr)
    }

    /** Filter of set type */
    set(): DataTypes.Set extends Helpers.DataTypeOf<TData> ? TData extends Set<infer E> ? ArrayFilter<T, E[]> : ArrayFilter<T, unknown[]> : never
    set(): ArrayFilter<T, unknown[]> {
        const expr = {}
        const path = this.resolveReference(expr, DataTypes.Array)

        return new ArrayFilter(this.str, `${path}.set`, this.filter, expr)
    }

    /** Filter of map value type */
    mapGet(key: string): DataTypes.Map extends Helpers.DataTypeOf<TData> ? TData extends Map<string, infer V> ? ArbitraryFilter<T, V> : ArbitraryFilter<T, unknown> : never
    mapGet(key: string): ArbitraryFilter<T, unknown> {
        if (key.startsWith("$") || key.includes(".") || key.includes("\x00")) throw new Error(`key can't start with $, include dot (.), or include null character`)

        const expr: Record<string, unknown> = {}
        const path = this.resolveReference(expr, DataTypes.Map)
        const propExpr = {}

        const variable = this.str.str
        this.str.increment()

        expr.$let = {
            vars: {
                [variable]: `${path}.map.${key}`
            },
            in: propExpr
        }

        return new ArbitraryFilter(this.str, `$$${variable}`, this.filter, propExpr)
    }

    /** Filter of object property type */
    objGet<K extends keyof TData>(key: K): DataTypes.Object extends Helpers.DataTypeOf<TData> ? ArbitraryFilter<T, TData[K]> : never
    objGet(key: string): ArbitraryFilter<T, unknown> {
        if (key.startsWith("$") || key.includes(".") || key.includes("\x00")) throw new Error(`key can't start with $, include dot (.), or include null character`)

        const expr: Record<string, unknown> = {}
        const path = this.resolveReference(expr, DataTypes.Object)
        const propExpr = {}

        const variable = this.str.str
        this.str.increment()

        expr.$let = {
            vars: {
                [variable]: `${path}.obj.${key}`
            },
            in: propExpr
        }

        return new ArbitraryFilter(this.str, `$$${variable}`, this.filter, propExpr)
    }

    /** Filter if data type is equal */
    typeOf(type: DataTypes, resolveRef = false): Match<T> {
        const match = new Match(this.filter)

        if (resolveRef) {
            const variable = this.str.str

            this.expr.$cond = [
                {
                    $or: [
                        {
                            $eq: [`${this.path}.type`, { $literal: type }]
                        },
                        {
                            $eq: [`${this.path}.type`, DataTypes.Reference]
                        }
                    ]
                },
                {
                    $let: {
                        vars: {
                            [variable]: {
                                $cond: [
                                    {
                                        $eq: [`${this.path}.type`, DataTypes.Reference]
                                    },
                                    {
                                        $arrayElemAt: ["$refs", `${this.path}.ref`]
                                    },
                                    this.path
                                ]
                            }
                        },
                        in: {
                            $eq: [`$$${variable}.type`, {
                                $literal: type
                            }]
                        }
                    }
                },
                false
            ]
        } else {
            this.expr.$eq = [`${this.path}.type`, { $literal: type }]
        }

        return match
    }

    /** Clone the arbitrary filter */
    clone(): ArbitraryFilter<T, TData> {
        const expr = {}
        const filter = this.deepClone(expr, this.filter)

        return new ArbitraryFilter(this.str, this.path, filter, expr)
    }

    /** Resolve value and ensure the type */
    protected resolveValue(expr: Record<string, unknown>, type: DataTypes): void {
        this.expr.$cond = [
            {
                $eq: [`${this.path}.type`, type]
            },
            expr,
            false
        ]
    }

    /** Resolve reference and ensure the type */
    protected resolveReference(expr: Record<string, unknown>, type: DataTypes): string {
        const newPath = this.str.str

        this.str.increment()
        this.expr.$cond = [
            {
                $eq: [`${this.path}.type`, DataTypes.Reference]
            },
            {
                $let: {
                    vars: {
                        [newPath]: {
                            $arrayElemAt: ["$refs", `${this.path}.ref`]
                        }
                    },
                    in: {
                        $cond: [
                            {
                                $eq: [`$$${newPath}.type`, type]
                            },
                            expr,
                            false
                        ]
                    }
                }
            },
            false
        ]

        return `$$${newPath}`
    }

    /** Deep clone object */
    protected deepClone(expr: Record<string, unknown>, obj: object): object {
        const keys = Object.keys(obj)
        const newObj: object = {}

        for (let i = 0; i < keys.length; i++) {
            const key = keys[i]
            const prop = obj[key]

            if (
                typeof prop === "object" &&
                prop !== null
            ) {
                if (prop === this.expr) newObj[key] = expr
                else newObj[key] = this.deepClone(expr, prop)
            } else newObj[key] = prop
        }

        return newObj
    }
}
