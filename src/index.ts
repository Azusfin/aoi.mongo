import { join } from "path"
import { readFileSync } from "fs"

/** The current used version of aoi.mongo */
export const version: string = JSON.parse(readFileSync(join(__dirname, "..", "package.json"), "utf-8")).version

export * from "./Mongo"
export * from "./Types"
export * from "./Cursor"
export * from "./IncString"
export * from "./Generator"
export * from "./Transformer"

export * as Query from "./query"
