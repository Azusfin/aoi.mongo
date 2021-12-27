const benny = require("benny")
const aoimongo = require("..")

const h = [
    new Date(),
    /test/,
    {
        i: new Set(),
        j: new Map()
    }
]
const obj = {
    a: null,
    b: true,
    c: {
        d: 9,
        e: {
            f: 7n,
            g: "test",
            h,
            k: h
        }
    }
}

const refs = []
const data = aoimongo.generate(obj, refs)

benny.suite(
    "Aoi.Mongo",
    benny.add("Generate", () => {
        aoimongo.generate(obj, [])
    }),
    benny.add("Transform", () => {
        aoimongo.transform({ key: "aaa", data, refs })
    }),
    benny.add("Filter", () => {
        new aoimongo.Query.Filter()
            .data
            .objGet("c")
            .objGet("e")
            .objGet("h")
            .array()
            .first()
            .date()
            .year
            .greaterThanEqual(2021)
    }),
    benny.cycle((_, summary) => {
        const progress = (
            (summary.results.filter((result) => result.samples !== 0).length /
                summary.results.length) *
                100
        ).toFixed(2)

        const progressInfo = `Progress: ${progress}%`

        const output = summary.results
            .map(item => {
                const ops = item.ops.toLocaleString("en-us")
                const margin = item.margin.toFixed(2)

                return item.samples
                    ? `\n  ${item.name}:\n`
                        + `      ${ops} ops/s, ±${margin}% (${item.samples} samples)`
                    : null
            })
            .filter(item => item !== null)
            .join("\n")

        return `${progressInfo}\n${output}`
    })
)
