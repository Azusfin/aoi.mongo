/** A string that can be incrementally generated */
export class IncrementalString {
    private _str = "a"

    get str(): string {
        return this._str
    }

    static replaceAt(str: string, index: number, character: string): string {
        return str.slice(0, index) + character + str.slice(index + character.length)
    }

    incrementAt(index: number): string {
        if (index === -1) return "a".repeat(this.str.length + 1)

        const newChar = String.fromCharCode(this.str.charCodeAt(index) + 1)

        if (newChar == "{") {
            return IncrementalString.replaceAt(this.incrementAt(index - 1), index, "a")
        }

        return IncrementalString.replaceAt(this.str, index, newChar)
    }

    increment(): void {
        this._str = this.incrementAt(this.str.length - 1)
    }
}
