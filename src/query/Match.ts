import { Filter as MongoFilter } from "mongodb"
import { Document, Types } from "../Types"

/** A class representing a filtered query */
export class Match<T extends Types> {
    readonly filter: MongoFilter<Document<T>>

    constructor(filter: MongoFilter<Document<T>>) {
        this.filter = {
            $and: [{
                $or: [filter]
            }]
        }
    }

    /**
     * Join a match with logical AND
     * 
     * AND is the top-level comparison 
     * */
    and(match: Match<T>): this {
        const and = this.filter.$and!

        and.push({
            $or: [match.filter]
        })

        return this
    }

    /**
     * Join a match with logical OR
     * 
     * OR is the bottom-level comparison
     */
    or(match: Match<T>): this {
        const and = this.filter.$and!
        const or = and[and.length - 1].$or!

        or.push(match.filter)

        return this
    }
}
