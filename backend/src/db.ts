import { MongoClient, type Collection, type Db } from 'mongodb';
import type { Recipe } from 'recipes-shared';

let client: MongoClient | null = null;
let db: Db | null = null;

function readEnv(): { uri: string; dbName: string } {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI is not set');
  }
  const dbName = process.env.MONGODB_DB ?? deriveDbName(uri) ?? 'recipes';
  return { uri, dbName };
}

function deriveDbName(uri: string): string | undefined {
  try {
    const trimmed = uri.split('?')[0] ?? '';
    const segments = trimmed.replace(/^mongodb(\+srv)?:\/\//, '').split('/');
    const tail = segments[1];
    return tail && tail.length > 0 ? tail : undefined;
  } catch {
    return undefined;
  }
}

export async function getDb(): Promise<Db> {
  if (db) {
    return db;
  }
  const { uri, dbName } = readEnv();
  client = new MongoClient(uri);
  await client.connect();
  db = client.db(dbName);
  return db;
}

let recipeIndexesEnsured = false;

export async function getRecipesCollection(): Promise<Collection<Recipe>> {
  const database = await getDb();
  const collection = database.collection<Recipe>('recipes');
  if (!recipeIndexesEnsured) {
    recipeIndexesEnsured = true;
    void collection
      .createIndexes([
        { key: { id: 1 }, unique: true },
        { key: { category: 1 } },
        { key: { creator: 1 } },
        { key: { title: 1 } }
      ])
      .catch((err) => {
        console.warn('Recipe index creation failed:', err);
        recipeIndexesEnsured = false;
      });
  }
  return collection;
}

export interface UserDoc {
  name: string;
}

let userIndexesEnsured = false;

export async function getUsersCollection(): Promise<Collection<UserDoc>> {
  const database = await getDb();
  const collection = database.collection<UserDoc>('users');
  if (!userIndexesEnsured) {
    userIndexesEnsured = true;
    void collection
      .createIndex({ name: 1 }, { unique: true })
      .catch((err) => {
        console.warn('User index creation failed:', err);
        userIndexesEnsured = false;
      });
  }
  return collection;
}

export async function closeDb(): Promise<void> {
  if (client) {
    await client.close();
    client = null;
    db = null;
  }
}
