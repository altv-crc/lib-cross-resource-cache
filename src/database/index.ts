import * as alt from 'alt-server';
import { MongoClient, Db, InsertOneResult, ObjectId } from 'mongodb';
import * as Utility from '../utility/deepCopy.js';

const MetaNames = {
    mongodbConnectionString: 'orchestra-mongodb-connection-string',
    databaseName: 'orchestra-database-name',
    connectionPool: 'orchestra-database-connection-pool',
};

let isConnected = false;
let isInit = false;
let onReadyCallback: Function;
let database: Db;

/**
 * Used to setup the database once the proper connection information has been set in metadata cache.
 *
 * It will call itself until a database connection is provided.
 *
 * @return {*}
 */
async function setup() {
    if (isConnected || isInit) {
        return;
    }

    const connectionString = <string>alt.getMeta(MetaNames.mongodbConnectionString);
    const databaseName = <string>alt.getMeta(MetaNames.databaseName);

    if (!connectionString) {
        await alt.Utils.wait(1000);
        setup();
        return;
    }

    if (!databaseName) {
        await alt.Utils.wait(1000);
        setup();
        return;
    }

    isInit = true;

    const client: MongoClient = await MongoClient.connect(connectionString).catch((err) => {
        console.warn(`crc: Could not connect to MongoDB instance. Incorrect credentials? Service not running?`, err);
        return undefined;
    });

    if (!client) {
        isInit = false;
        setup();
        return;
    }

    database = client.db(databaseName);
    isInit = false;
    isConnected = true;

    if (!onReadyCallback) {
        return;
    }

    onReadyCallback();
}

/**
 * Only needs to be called once from a single resource.
 *
 * All resources will use the same database once initialized.
 *
 * @export
 * @param {{ mongodbConnectionString: string; databaseName: string }} options
 * @return {*}
 */
export async function connect(mongodbConnectionString: string, databaseName: string) {
    if (isConnected) {
        console.log(`crc: Already connected to a database, no need to call this function.`);
        return;
    }

    if (alt.hasMeta(MetaNames.mongodbConnectionString) || alt.hasMeta(MetaNames.databaseName)) {
        return;
    }

    alt.setMeta(MetaNames.mongodbConnectionString, mongodbConnectionString);
    alt.setMeta(MetaNames.databaseName, databaseName);
    setup();
}

/**
 * Returns when the database has been connected to properly
 *
 * @export
 * @param {(connectionCount: number) => void} callback
 */
export async function onReady(callback: () => void) {
    onReadyCallback = callback;
    setup();
}

/**
 * Returns the database instance, when the database instance is ready.
 *
 * @export
 * @return {Promise<Db | undefined>}
 */
export async function getMongoClient(): Promise<Db | undefined> {
    await alt.Utils.waitFor(() => isConnected, 60000);
    return database;
}

/**
 * Simply creates a document, and returns its `_id`.
 *
 * @export
 * @template T
 * @param {T} data
 * @param {string} collection
 * @return {(Promise<string | undefined>)}
 */
export async function create<T extends { [key: string]: any }>(
    data: T,
    collection: string
): Promise<string | undefined> {
    const client = await getMongoClient();
    let result: InsertOneResult<Document>;

    try {
        result = await client.collection(collection).insertOne(data);
        return String(result.insertedId);
    } catch (err) {
        return undefined;
    }
}

/**
 * Updates a single document by `_id`.
 *
 * Pass any data you want as `update<{ myInterface: string, _id: string }>(..., ...)`
 *
 * @export
 * @template T
 * @param {T} data
 * @param {string} collection
 * @return {Promise<boolean>}
 */
export async function update<T extends { [key: string]: any }>(data: T, collection: string): Promise<boolean> {
    if (!data._id) {
        throw new Error(`crc: Failed to specify _id in update function.`);
    }

    const client = await getMongoClient();
    const dataClone = Utility.deepCopy<T>(data);
    delete dataClone._id;

    try {
        const result = await client
            .collection(collection)
            .findOneAndUpdate({ _id: new ObjectId(data._id) }, { $set: dataClone });
        return result.ok ? true : false;
    } catch (err) {
        return false;
    }
}

/**
 * Destroy a document by `_id` and `collection`.
 *
 * Returns `true` if successful.
 *
 * @export
 * @param {string} _id
 * @param {string} collection
 * @return {Promise<boolean>}
 */
export async function destroy(_id: string, collection: string): Promise<boolean> {
    const client = await getMongoClient();

    try {
        const result = await client.collection(collection).deleteOne({ _id: new ObjectId(_id) });
        return result.deletedCount >= 1;
    } catch (err) {
        return false;
    }
}

/**
 * Returns a single document by partial data match.
 *
 * Use `_id` to lookup a document by `_id`. Ensure it is a `string`.
 *
 * Returns `undefined` if a document is not found.
 *
 * @export
 * @template T
 * @param {(Partial<T & { _id: string }>)} dataToMatch
 * @param {string} collection
 * @return {(Promise<T | undefined>)}
 */
export async function get<T extends { [key: string]: any; _id?: string | ObjectId }>(
    dataToMatch: Partial<T>,
    collection: string
): Promise<T | undefined> {
    const client = await getMongoClient();

    try {
        const dataLookup: any = { ...dataToMatch };

        if (dataToMatch._id) {
            dataLookup._id = new ObjectId(dataToMatch._id);
        }

        const document = await client.collection(collection).findOne<T>(dataLookup);
        if (!document) {
            return undefined;
        }

        return { ...document, _id: String(document._id) };
    } catch (err) {
        console.log(err);
        return undefined;
    }
}

/**
 * Returns all matching documents as `an array` given an object.
 *
 * @export
 * @template T
 * @param {T} dataToMatch
 * @param {string} collection
 * @return {Promise<T[]>}
 */
export async function getMany<T extends { [key: string]: any }>(
    dataToMatch: Partial<T>,
    collection: string
): Promise<T[]> {
    const client = await getMongoClient();

    try {
        const dataLookup: any = { ...dataToMatch };

        if (dataToMatch._id) {
            dataLookup._id = new ObjectId(dataToMatch._id);
        }

        const cursor = await client.collection(collection).find<T>(dataLookup);
        const documents = await cursor.toArray();
        return documents.map((x) => {
            return { ...x, _id: String(x._id) };
        });
    } catch (err) {
        return [];
    }
}

/**
 * Returns all data from a collection if it exists.
 *
 * If the collection does not exist it will return `undefined`
 *
 * @export
 * @template T
 * @param {string} collection
 * @return {(Promise<(T & { _id: string })[] | undefined>)}
 */
export async function getAll<T extends { _id: ObjectId }>(
    collection: string
): Promise<(T & { _id: string })[] | undefined> {
    const client = await getMongoClient();

    try {
        const cursor = await client.collection(collection).find();
        const documents = await cursor.toArray();
        return documents.map((x) => {
            return { ...x, _id: String(x._id) };
        }) as (T & { _id: string })[];
    } catch (err) {
        return undefined;
    }
}

/**
 * Deletes a single document by `_id`
 *
 * If the document was deleted it will return `true`.
 *
 * @export
 * @param {string} _id
 * @param {string} collection
 * @return {Promise<boolean>}
 */
export async function deleteDocument(_id: string, collection: string): Promise<boolean> {
    const client = await getMongoClient();

    try {
        const result = await client.collection(collection).deleteOne({ _id: new ObjectId(_id) });
        return result.acknowledged;
    } catch (err) {
        return false;
    }
}
