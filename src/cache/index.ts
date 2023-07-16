import * as alt from 'alt-server';
import * as Database from '../database/index.js';
import * as Utility from '../utility/index.js';
import { invokeDataChange } from '../events/keyChange.js';
import { invoke } from '../events/onSync.js';
import { ObjectId, Document as MongoDoc } from 'mongodb';

const reservedKeys = ['_id', 'collection'];
const streamSyncedPrefix = 'streamSyncedMeta-';
const syncedPrefix = 'syncedMeta-';
const localPrefix = 'localMeta-';

/**
 * Writes to the database given the `_id` and `collection` keys are present on the entity.
 *
 * @param {alt.Entity} entity
 * @param {{ [key: string]: any }} data
 * @return {Promise<boolean>}
 */
async function writeToDatabase(entity: alt.Entity, data: { [key: string]: any }): Promise<boolean> {
    if (!entity) {
        return false;
    }

    if (!entity.hasMeta('_id') || !entity.hasMeta('collection')) {
        return false;
    }

    const _id = <string>entity.getMeta('_id');
    const collection = <string>entity.getMeta('collection');

    const db = await Database.getMongoClient();

    try {
        const filter = { _id: new ObjectId(_id) };
        const dataToUpdate = { $set: data };
        await db.collection(collection).updateOne(filter, dataToUpdate);
        Utility.logger.write(`Document ${_id} updated data with ${JSON.stringify(data)}`);

        return true;
    } catch (err) {
        console.error(`Could not update data for entity ${_id}`);
        return false;
    }
}

/**
 * Handles setting multiple types of meta, given the key value and it's individual flags.
 *
 * @param {alt.Entity} entity
 * @param {string} key
 * @param {*} value
 */
function processMeta(entity: alt.Entity, key: string, value: any) {
    if (!entity) {
        return;
    }

    const oldValue = entity.getMeta(key);
    entity.setMeta(key, value);

    if (alt.getMeta(`${streamSyncedPrefix}${key}`)) {
        entity.setStreamSyncedMeta(key, value);
    }

    if (alt.getMeta(`${syncedPrefix}${key}`)) {
        entity.setSyncedMeta(key, value);
    }

    if (entity instanceof alt.Player && alt.getMeta(`${localPrefix}${key}`)) {
        entity.setLocalMeta(key, value);
    }

    invokeDataChange(key, entity, value, oldValue);
}

/**
 * Set a value given a key.
 *
 * Returns `true` if written to the database.
 *
 * Otherwise, returns `false`.
 *
 * @export
 * @param {alt.Entity} entity
 * @param {string} key
 * @param {(string | number | Object)} value
 * @return {Promise<boolean>}
 */
export async function setValue(entity: alt.Entity, key: string, value: string | number | Object): Promise<boolean> {
    if (!entity) {
        return false;
    }

    if (reservedKeys.includes(key)) {
        console.error(`Cannot setKey with reserved keyword: ${key}`);
        return false;
    }

    processMeta(entity, String(key), value);
    return await writeToDatabase(entity, { [key]: value });
}

/**
 * Sets values given a key.
 *
 * Returns `true` if written to the database.
 *
 * Otherwise, returns `false`.
 *
 * @export
 * @param {alt.Entity} entity
 * @param {Object} dataSet
 * @return {Promise<boolean>}
 */
export async function setValues(entity: alt.Entity, dataSet: Object): Promise<boolean> {
    if (!entity) {
        return false;
    }

    dataSet = Utility.deepCopy<typeof dataSet>(dataSet);

    const keys = Object.keys(dataSet);

    for (let key of keys) {
        if (reservedKeys.includes(key)) {
            delete dataSet[key];
            console.error(`Cannot set with reserved keyword: ${key}`);
            continue;
        }

        processMeta(entity, String(key), dataSet[key]);
    }

    return await writeToDatabase(entity, dataSet);
}

/**
 * Get a specific key that is saved to this entity.
 *
 * **Use Case**
 * Returns a single value from stored cache.
 *
 * @example
 * ```ts
 * const cash = crc.cache.getValue<number>('cash');
 *
 * if (typeof cash === 'undefined') {
 *      console.log('Result does not exist.');
 * } else {
 *      console.log('Cash is: ' + cash);
 * }
 * ```
 *
 * @export
 * @template T
 * @param {alt.Entity} entity
 * @param {string} key
 * @return {T | undefined}
 */
export function getValue<T = unknown>(entity: alt.Entity, key: string): T | undefined {
    if (!entity) {
        return undefined;
    }

    if (key === '_id') {
        return String(entity.getMeta(String(key))) as T;
    }

    return entity.getMeta(String(key)) as T;
}

/**
 * Get all data that is saved to this entity.
 *
 * **Use Case**
 * Returns all meta keys on a player as an object.
 *
 * @example
 * ```ts
 * interface CharacterData {
 *      cash: number;
 *      bank: number;
 * }
 *
 * const result = crc.cache.getValues<CharacterData>(somePlayer);
 * console.log(result);
 * ```
 *
 * @export
 * @template T
 * @param {alt.Entity} entity
 * @return {T | undefined}
 */
export function getValues<T = unknown>(entity: alt.Entity): T {
    if (!entity) {
        return undefined;
    }

    const keys = entity.getMetaDataKeys();
    const dataSet = {};
    for (let key of keys) {
        if (key === '_id' && entity.hasMeta('_id')) {
            dataSet[key] = String(entity.getMeta(key));
            continue;
        }

        dataSet[key] = entity.getMeta(key);
    }

    return dataSet as T;
}

/**
 * Sync an entity to a MongoDB document.
 *
 * Requires the specific `ID` of the document as string, and the `collection` where the document is found.
 *
 * Returns `true` if the data was found, and bound to the entity.
 *
 * Returns `false` if the data was not found.
 *
 * **Use Case**
 * Used to sync an initial document to an entity.
 *
 * This should always be the first step in synchronizing an entity to a database.
 *
 * @example
 * ```ts
 * crc.cache.sync(somePlayer, '6429f2ae40e974b0ba3ba573', 'characters');
 * ```
 *
 * @export
 * @param {alt.Entity} entity
 * @param {string} _id
 * @param {string} collection
 * @returns {boolean}
 */
export async function sync(entity: alt.Entity, _id: string, collection: string) {
    const db = await Database.getMongoClient();

    let dataSet: MongoDoc & { _id: ObjectId | string };

    try {
        dataSet = await db.collection(collection).findOne({ _id: new ObjectId(_id) });
        entity.setMeta('collection', collection);
    } catch (err) {
        console.error(`Could not find document for ${_id} in collection ${collection}`);
        return false;
    }

    const keys = Object.keys(dataSet);
    for (let key of keys) {
        if (key === '_id') {
            dataSet[key] = String(dataSet[key]);
        }

        processMeta(entity, String(key), dataSet[key]);
    }

    invoke(entity);
    return true;
}

/**
 * Create a document for an entity with some initial data.
 *
 * `sync` is called from within this function.
 *
 * `Returns` a `string` that represents the document `_id` for further usage.
 *
 * @export
 * @param {alt.Entity} entity
 * @param {string} collection
 * @returns {string}
 */
export async function create<T extends { [key: string]: any }>(
    entity: alt.Entity,
    initialData: T,
    collection: string
): Promise<string | undefined> {
    if (initialData._id) {
        delete initialData._id;
    }

    initialData = Utility.deepCopy<typeof initialData>(initialData);

    const db = await Database.getMongoClient();

    try {
        const insertRequest = await db.collection(collection).insertOne(initialData);
        await sync(entity, String(insertRequest.insertedId), collection);
        return String(insertRequest.insertedId);
    } catch (err) {
        console.error(`Could create document entity with data: ${JSON.stringify(initialData)}`);
        return undefined;
    }
}

/**
 * Marks a specific key used in a value to be also set as streamSyncedMeta on an entity.
 *
 * **Use Case**
 * Good for assigning data when a player is `streamedIn` for another player.
 * A solid example would be attaching objects to a player for others to see.
 *
 * @example
 * ```ts
 * crc.cache.setKeysAsStreamSynced(['object-attachments']);
 * ```
 *
 * @export
 * @param {Array<string>} keys
 */
export function setKeysAsStreamSynced(keys: Array<string>) {
    for (let key of keys) {
        alt.setMeta(`${streamSyncedPrefix}${key}`, true);
    }
}

/**
 * Marks a specific key used in a value to be also set as syncedMeta on an entity.
 *
 * **Use Case**
 * Good for scoreboards that need to get all player names locally.
 *
 * @example
 * ```ts
 * crc.cache.setKeysAsSynced(['name']);
 * ```
 *
 * @export
 * @param {Array<string>} keys
 */
export function setKeysAsSynced(keys: Array<string>) {
    for (let key of keys) {
        alt.setMeta(`${syncedPrefix}${key}`, true);
    }
}

/**
 * Marks a specific key or keys used in a value to be also set as localMeta on an player entity.
 *
 * **Use Case**
 * Good for synchronizing `cash` or `bank` values locally for a player on the client-side.
 *
 * @example
 * ```ts
 * crc.cache.setKeysAsLocal(['cash', 'bank']);
 * ```
 *
 * @export
 * @param {Array<string>} keys
 */
export function setKeysAsLocal(keys: Array<string>) {
    for (let key of keys) {
        alt.setMeta(`${localPrefix}${key}`, true);
    }
}
