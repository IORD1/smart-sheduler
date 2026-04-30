import { MongoClient } from 'mongodb';
import { ApiError } from './api';

if (typeof window !== 'undefined') {
  throw new Error('lib/mongo.js must not be imported on the client');
}

const uri = process.env.MONGO_CONNECTION_STRING;
// 'smart_sheduler' matches the repo name typo, intentional — production data
// lives in this db, do not "fix" the spelling without a migration.
const dbName = process.env.MONGO_DB_NAME || 'smart_sheduler';

if (!uri) {
  throw new Error('Missing MONGO_CONNECTION_STRING in environment');
}

// We cache the in-flight connect() promise so concurrent requests share one
// connection. If `connect()` rejects (e.g. transient DNS failure during cold
// start), we MUST clear the cached promise — otherwise every subsequent
// request awaits the same rejected promise and the server is permanently dead.

function getClientPromise() {
  if (global.__mongoClientPromise) return global.__mongoClientPromise;

  const client = new MongoClient(uri);
  const promise = client.connect().then(
    (connected) => {
      global.__mongoClient = connected;
      return connected;
    },
    (err) => {
      // Reset cache so the next call starts a fresh connection attempt.
      global.__mongoClient = undefined;
      global.__mongoClientPromise = undefined;
      throw err;
    },
  );

  global.__mongoClient = client;
  global.__mongoClientPromise = promise;
  return promise;
}

export async function getDb() {
  const client = await getClientPromise();
  return client.db(dbName);
}

export async function getCollection(name) {
  const db = await getDb();
  return db.collection(name);
}

export function getUserId(req) {
  const id = req.headers.get('x-user-id');
  if (!id) {
    throw new ApiError(400, 'missing x-user-id header');
  }
  return id;
}
