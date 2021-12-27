import { Long } from "mongodb"
import { DataTypes, Data, Types, getType } from "./Types"

/**
 * The class to represent generator error
 */
export class GeneratorError extends Error {
    constructor(message: string) {
        super(message)
        this.name = "AoiMongoError"
    }
}

/**
 * Generate the key-value pair into document
 * @param key The key as the unique
 * @param value The value to generate
 */
export function generate<T extends Types>(value: T, refs: Data<Types>[]): Data<T> {
    return generateData(value, refs, new WeakMap())
}

/**
 * Generate value into data
 * @param value The value to generate from
 * @param refs The map to detect references
 */
export function generateData<T extends Types>(
    value: T,
    refs: Data<unknown>[],
    refStack: WeakMap<object, number>
): Data<T>

export function generateData(
    value: unknown,
    refs: Data<unknown>[],
    refStack: WeakMap<object, number>
): Data<unknown> {
    const type = getType(value, refStack)
    switch (type) {
        case DataTypes.Null:
            return {
                type
            }
        case DataTypes.Bool:
            return {
                type,
                bool: value as boolean
            }
        case DataTypes.Number:
            return {
                type,
                num: value as number
            }
        case DataTypes.BigInt:
            return {
                type,
                big: Long.fromBigInt(value as bigint)
            }
        case DataTypes.String:
            return {
                type,
                str: value as string
            }
        case DataTypes.Date:
            return {
                type,
                date: value as Date
            }
        case DataTypes.RegExp:
            return {
                type,
                regex: value as RegExp
            }
        case DataTypes.Reference:
            return {
                type,
                ref: refStack.get(value as object)!
            }
        case DataTypes.Bytes:
            {
                const buf = value as Uint8Array
                const index = refs.length

                refStack.set(buf, index)
                refs.push({
                    type,
                    buf
                })

                return {
                    type: DataTypes.Reference,
                    ref: index
                }
            }
        case DataTypes.Array:
            {
                const arr = value as unknown[]
                const dataArr: Data<unknown>[] = []
                const index = refs.length

                refStack.set(arr, index)
                refs.push({
                    type,
                    arr: dataArr
                })


                for (let i = 0; i < arr.length; i++) {
                    const val = arr[i]

                    try {
                        dataArr.push(generateData(val, refs, refStack))
                    } catch (err) {
                        throw forwardError(err, `arr ${i}`)
                    }
                }

                return {
                    type: DataTypes.Reference,
                    ref: index
                }
            }
        case DataTypes.Set:
            {
                const set = value as Set<unknown>
                const dataSet: Data<unknown>[] = []
                const index = refs.length

                refStack.set(set, index)
                refs.push({
                    type,
                    set: dataSet
                })

                let i = 0
                for (const val of set.values()) {
                    try {
                        dataSet.push(generateData(val, refs, refStack))
                    } catch (err) {
                        throw forwardError(err, `set ${i}`)
                    }

                    i++
                }

                return {
                    type: DataTypes.Reference,
                    ref: index
                }
            }
        case DataTypes.Map:
            {
                const map = value as Map<string, unknown>
                const dataMap: Record<string, Data<unknown>> = {}
                const index = refs.length

                refStack.set(map, index)
                refs.push({
                    type,
                    map: dataMap
                })

                for (const [prop, val] of map) {
                    if (typeof prop === "string" && !prop.startsWith("$") && !prop.includes(".") && !prop.includes("\x00")) {
                        try {
                            dataMap[prop] = generateData(val, refs, refStack)
                        } catch (err) {
                            throw forwardError(err, `map '${prop}'`)
                        }
                    }
                }

                return {
                    type: DataTypes.Reference,
                    ref: index
                }
            }
        case DataTypes.Object:
            {
                const obj = value as Record<string, unknown>
                const dataObj: Record<string, Data<unknown>> = {}
                const index = refs.length

                refStack.set(obj, index)
                refs.push({
                    type,
                    obj: dataObj
                })

                const keys = Object.keys(obj)
                for (let i = 0; i < keys.length; i++) {
                    const prop = keys[i]
                    const val = obj[prop]

                    if (!prop.startsWith("$") && !prop.includes(".") && !prop.includes("\x00")) {
                        try {
                            dataObj[prop] = generateData(val, refs, refStack)
                        } catch (err) {
                            throw forwardError(err, `obj '${prop}'`)
                        }
                    }
                }

                return {
                    type: DataTypes.Reference,
                    ref: index
                }
            }
    }
}

function forwardError(err: GeneratorError, at: string): GeneratorError {
    const split = err.message.split("at")
    const msg = split.shift()!.trim()
    const higherAt = split.length ? split.join("at").trim() : null

    const message = `${msg} ${
        higherAt
            ? `at ${at} -> ${higherAt}`
            : `at ${at}`
    }`

    return new GeneratorError(message)
}
