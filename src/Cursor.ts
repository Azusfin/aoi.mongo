import { FindCursor } from "mongodb"
import { transform } from "./Transformer"
import { Doc, Document, Types } from "./Types"

/**
 * A mongodb FindCursor wrapper for doc
 */
export class Cursor<T extends Types> {
    /** The mongodb FindCursor */
    readonly cursor: FindCursor<Document<T>>

    /**
     * @param cursor The mongodb FindCursor to wrap
     */
    constructor(cursor: FindCursor<Document<T>>) {
        if (typeof cursor !== "object" || cursor === null) throw new TypeError("cursor must be a non-null object")
        this.cursor = cursor
    }

    async* [Symbol.asyncIterator](): AsyncGenerator<Doc<T>, void, void> {
        for await (const document of this.cursor) {
            yield transform(document)
        }
    }
}
