/** Type of a mutex queue entry */
export type QueueEntry = () => void

/** Mutex for locker utility */
export class Mutex {
    public _locked = false
    public _queue: QueueEntry[] = []

    /** Lock the mutex */
    public lock(): Promise<void> {
        const promise = new Promise<void>(resolve => this._queue.push(resolve))

        if (!this._locked) {
            this._locked = true
            this.unlock()
        }

        return promise
    }

    /** Unlock the mutex */
    public unlock(): void {
        const next = this._queue.shift()

        if (!next) {
            if (this._locked) this._locked = false
            return
        }

        next()
    }
}
