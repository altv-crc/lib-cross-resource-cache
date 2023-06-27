/**
 * Deep copies an object, and cleans out all functions.
 *
 * @export
 * @template T
 * @param {T} data
 * @return {T}
 */
export function deepCopy<T extends {}>(data: T): T {
    return JSON.parse(JSON.stringify(data));
}
