import { Long } from "mongodb"
import { Doc, Document, DataTypes, Data, Types } from "./Types"

/**
 * The class to represent transformer error
 */
export class TransformerError extends Error {
    constructor(message: string) {
        super(message)
        this.name = "AoiMongoError"
    }
}

/**
 * Transform the document into higher-level document
 * @param document The document to transform from
 */
export function transform<T extends Types>(document: Document<T>): Doc<T> {
    if (typeof document !== "object" || document === null) throw new TransformerError("Document must be a non-null object")
    if (document.key === void 0) throw new TransformerError("key must exist in the document")
    if (document.data === void 0) throw new TransformerError(`data must exist in the document while transforming '${document.key}'`)
    if (document.refs === void 0) throw new TransformerError(`refs must exist in the document while transforming '${document.key}'`)

    try {
        return {
            key: document.key,
            value: transformData(document.data, document.refs, new Map())
        }
    } catch (err) {
        throw new TransformerError(`${err.message} while transforming '${document.key}'`)
    }
}

/**
 * Transform the data into an unknown value
 * @param data The data to transform from
 */
export function transformData<T extends Types>(
    data: Data<T>,
    refs: Data<unknown>[],
    refStack: Map<number, object>,
    index?: number
): T

export function transformData(
    data: {
        type: DataTypes
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
    },
    refs: Data<unknown>[],
    refStack: Map<number, object>,
    index?: number
): unknown {
    switch (data?.type) {
        case DataTypes.Null:
            return null
        case DataTypes.Bool:
            if (data.bool === void 0) throw new TransformerError("bool must exist in the data")
            return data.bool
        case DataTypes.Number:
            if (data.num === void 0) throw new TransformerError("num must exist in the data")
            return data.num
        case DataTypes.BigInt:
            if (data.big === void 0) throw new TransformerError("big must exist in the data")
            return data.big.toBigInt()
        case DataTypes.String:
            if (data.str === void 0) throw new TransformerError("str must exist in the data")
            return data.str
        case DataTypes.Date:
            if (data.date === void 0) throw new TransformerError("date must exist in the data")
            return data.date
        case DataTypes.RegExp:
            if (data.regex === void 0) throw new TransformerError("regex must exist in the data")
            return data.regex
        case DataTypes.Bytes:
            {
                if (typeof index !== "number" || isNaN(index)) throw new TransformerError("index must be a valid number")
                if (data.buf === void 0) throw new TransformerError("buf must exist in the data")

                const buf = data.buf

                refStack.set(index, buf)
                return buf
            }
        case DataTypes.Array:
            {
                if (typeof index !== "number" || isNaN(index)) throw new TransformerError("index must be a valid number")
                if (data.arr === void 0) throw new TransformerError("arr must exist in the data")

                const arr: unknown[] = []
                refStack.set(index, arr)

                for (let i = 0; i < data.arr.length; i++) {
                    const val = data.arr[i]

                    try {
                        arr.push(transformData(val, refs, refStack))
                    } catch (err) {
                        throw forwardError(err, `arr ${i}`)
                    }
                }

                return arr
            }
        case DataTypes.Set:
            {
                if (typeof index !== "number" || isNaN(index)) throw new TransformerError("index must be a valid number")
                if (data.set === void 0) throw new TransformerError("set must exist in the data")

                const set: Set<unknown> = new Set()
                refStack.set(index, set)

                for (let i = 0; i < data.set.length; i++) {
                    const val = data.set[i]

                    try {
                        set.add(transformData(val, refs, refStack))
                    } catch (err) {
                        throw forwardError(err, `set ${i}`)
                    }
                }

                return set
            }
        case DataTypes.Map:
            {
                if (typeof index !== "number" || isNaN(index)) throw new TransformerError("index must be a valid number")
                if (data.map === void 0) throw new TransformerError("map must exist in the data")

                const map: Map<string, unknown> = new Map()
                refStack.set(index, map)

                const keys = Object.keys(data.map)
                for (let i = 0; i < keys.length; i++) {
                    const key = keys[i]
                    const val = data.map[key]

                    try {
                        map.set(key, transformData(val, refs, refStack))
                    } catch (err) {
                        throw forwardError(err, `map '${key}'`)
                    }
                }

                return map
            }
        case DataTypes.Object:
            {
                if (typeof index !== "number" || isNaN(index)) throw new TransformerError("index must be a valid number")
                if (data.obj === void 0) throw new TransformerError("obj must exist in the data")

                const obj: Record<string, unknown> = {}
                refStack.set(index, obj)

                const keys = Object.keys(data.obj)
                for (let i = 0; i < keys.length; i++) {
                    const key = keys[i]
                    const val = data.obj[key]

                    try {
                        obj[key] = transformData(val, refs, refStack)
                    } catch (err) {
                        throw forwardError(err, `obj '${key}'`)
                    }
                }

                return obj
            }
        case DataTypes.Reference:
            if (data.ref === void 0) throw new TransformerError("ref must exist in the data")
            if (refStack.has(data.ref)) return refStack.get(data.ref)
            return transformData(refs[data.ref], refs, refStack, data.ref)
    }
}

function forwardError(err: TransformerError, at: string): TransformerError {
    const split = err.message.split("at")
    const msg = split.shift()!.trim()
    const higherAt = split.length ? split.join("at").trim() : null

    const message = `${msg} ${
        higherAt
            ? `at ${at} -> ${higherAt}`
            : `at ${at}`
    }`

    return new TransformerError(message)
}
