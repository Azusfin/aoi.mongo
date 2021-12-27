import { IncrementalString } from "../IncString"
import { Filter as MongoFilter } from "mongodb"
import { Document, Types } from "../Types"
import { NumFilter } from "./Number"
import { Match } from "./Match"

/** A filter which work with dates */
export class DateFilter<T extends Types> {
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

    /** Filter if date is equal */
    equal(date: Date): Match<T> {
        return this.compare("$eq", date)
    }

    /** Filter if date is not equal */
    notEqual(date: Date): Match<T> {
        return this.compare("$ne", date)
    }

    /** Filter of the date difference */
    diff(date: Date): NumFilter<T> {
        const expr = {}
        const variable = this.str.str

        const filter = new NumFilter(`$$${variable}`, this.filter, expr)

        this.expr.$let = {
            vars: {
                [variable]: {
                    $dateDiff: {
                        startDate: this.path,
                        endDate: {
                            $literal: date
                        },
                        unit: "millisecond"
                    }
                }
            },
            in: expr
        }

        return filter
    }

    /** Millisecond of the date between 0 to 999 */
    get millisecond(): NumFilter<T> {
        return this.expression("$millisecond")
    }

    /** Second of the date between 0 to 60 */
    get second(): NumFilter<T> {
        return this.expression("$second")
    }

    /** Minute of the date between 0 to 59 */
    get minute(): NumFilter<T> {
        return this.expression("$minute")
    }

    /** Hour of the date between 0 to 23 */
    get hour(): NumFilter<T> {
        return this.expression("$hour")
    }

    /** Day of the month (date) of the date between 1 to 33 */
    get date(): NumFilter<T> {
        return this.expression("$dayOfMonth")
    }

    /** Month of the date between 1 to 12 */
    get month(): NumFilter<T> {
        return this.expression("$month")
    }

    /** Year of the date, ex. 2019 */
    get year(): NumFilter<T> {
        return this.expression("$year")
    }

    /** Filter if the comparison return true */
    compare(
        operator: "$eq" | "$ne",
        date: Date
    ): Match<T> {
        const match = new Match(this.filter)

        this.expr[operator] = [this.path, {
            $literal: date
        }]

        return match
    }

    /** Date expression filter */
    expression(
        expr: "$millisecond" | "$second" | "$minute" | "$hour" | "$dayOfMonth" | "$month" | "$year"
    ): NumFilter<T> {
        const expression = {}
        const variable = this.str.str

        const filter = new NumFilter(`$$${variable}`, this.filter, expression)

        this.expr.$let = {
            vars: {
                [variable]: {
                    [expr]: this.path
                }
            },
            in: expression
        }

        return filter
    }
}
