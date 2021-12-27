import { Long, Document as MongoDocument } from "mongodb"

/** The list of data types in aoi.mongo */
export const enum DataTypes {
    Null,
    Bool,
    Number,
    BigInt,
    String,
    Date,
    RegExp,
    Bytes,
    Array,
    Set,
    Map,
    Object,
    Reference
}

/** The document interface */
export interface Doc<T extends Types> {
    key: string
    value: T
}

/** The generated document that will be passed to mongodb */
export interface Document<T extends Types> extends MongoDocument {
    key: string
    data: Data<T>
    refs: Data<unknown>[]
}

/** The data interface */
export type Data<T extends Types> = {
    type: Helpers.DataTypeOf<T>
} & Helpers.RequiredOf<Helpers.DataTypeOf<T>, T>

/** The supported types in aoi.mongo */
export type Types =
    | undefined
    | boolean
    | number
    | bigint
    | string
    | null
    | Date
    | RegExp
    | Uint8Array
    | unknown[]
    | Set<unknown>
    | Map<string, unknown>
    | {}
    | unknown

export namespace Helpers {
    export type Primitive = undefined | boolean | number | bigint | string

    export type DataTypeOf<T extends Types> =
        T extends Primitive
        ? DataTypePrimitive<T>
        : DataTypeNonPrimitive<T>

    export type DataTypePrimitive<T extends Primitive> =
        T extends undefined
        ? DataTypes.Null
        : T extends boolean
        ? DataTypes.Bool
        : T extends number
        ? DataTypes.Number
        : T extends bigint
        ? DataTypes.BigInt
        : DataTypes.String

    export type DataTypeNonPrimitive<T extends Types> =
        T extends Date
        ? DataTypes.Date
        : T extends RegExp
        ? DataTypes.RegExp
        : T extends Uint8Array
        ? DataTypes.Bytes | DataTypes.Reference
        : T extends unknown[]
        ? DataTypes.Array | DataTypes.Reference
        : T extends Set<unknown>
        ? DataTypes.Set | DataTypes.Reference
        : T extends Map<string, unknown>
        ? DataTypes.Map | DataTypes.Reference
        : T extends object
        ? DataTypes.Object | DataTypes.Reference
        : (
            | DataTypes.Null
            | DataTypes.Bool
            | DataTypes.Number
            | DataTypes.BigInt
            | DataTypes.String
            | DataTypes.Date
            | DataTypes.RegExp
            | DataTypes.Reference
            | DataTypes.Bytes
            | DataTypes.Array
            | DataTypes.Set
            | DataTypes.Map
            | DataTypes.Object
        )

    export type RequiredOf<T extends DataTypes, TData extends Types> =
        T extends DataTypes.Null
        ? {}
        : T extends DataTypes.Bool
        ? { bool: boolean }
        : T extends DataTypes.Number
        ? { num: number }
        : T extends DataTypes.BigInt
        ? { big: Long }
        : T extends DataTypes.String
        ? { str: string }
        : T extends DataTypes.Date
        ? { date: Date }
        : T extends DataTypes.RegExp
        ? { regex: RegExp }
        : T extends DataTypes.Bytes
        ? { buf: Uint8Array } | { ref: number }
        : T extends DataTypes.Array
        ? {
            arr: (
                TData extends (infer E)[]
                ? Data<E>[]
                : never[]
            )
        } | { ref: number }
        : T extends DataTypes.Set
        ? {
            set: (
                TData extends Set<infer E>
                ? Data<E>[]
                : never[]
            )
        } | { ref: number }
        : T extends DataTypes.Map
        ? {
            map: (
                TData extends Map<string, infer V>
                ? Record<string, Data<V>>
                : Record<string, never>
            )
        } | { ref: number }
        : T extends DataTypes.Object
        ? {
            obj: (
                TData extends {} ? {
                    [K in keyof TData]: TData[K]
                } : Record<string, never>
            )
        } | { ref: number }
        : {
            bool?: boolean
            num?: number
            big?: Long
            str?: string
            date?: Date
            regex?: RegExp
            buf?: Uint8Array
            arr?: Data<unknown>[]
            set?: Data<unknown>[]
            map?: Record<string, Data<unknown>>
            obj?: Record<string, Data<unknown>>
            ref?: number
        }
}

/**
 * Utility function to get the type of value
 * @param value The value to get the type from
 * @param refs The map to detect references
 */
export function getType<T extends Types>(
    value: T,
    refStack: WeakMap<object, number>
): Helpers.DataTypeOf<T>

export function getType(
    value: unknown,
    refStack: WeakMap<object, number>
): DataTypes {
    switch (typeof value) {
        case "undefined":
            return DataTypes.Null
        case "boolean":
            return DataTypes.Bool
        case "number":
            return DataTypes.Number
        case "bigint":
            return DataTypes.BigInt
        case "string":
            return DataTypes.String
        case "object":
            {
                if (value === null) return DataTypes.Null
                else if (value instanceof Date) return DataTypes.Date
                else if (value instanceof RegExp) return DataTypes.RegExp
                else if (refStack.has(value)) return DataTypes.Reference
                else if (value instanceof Uint8Array) return DataTypes.Bytes
                else if (Array.isArray(value)) return DataTypes.Array
                else if (value instanceof Set) return DataTypes.Set
                else if (value instanceof Map) return DataTypes.Map
                else return DataTypes.Object
            }
        default:
            throw new TypeError(`Type '${typeof value}' is not supported`)
    }
}
