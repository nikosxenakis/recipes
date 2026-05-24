import { MongoClient, type Collection, type Db } from 'mongodb';
import type { Recipe } from './schemas.ts';

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

export async function getRecipesCollection(): Promise<Collection<Recipe>> {
  const database = await getDb();
  return database.collection<Recipe>('recipes');
}

export async function closeDb(): Promise<void> {
  if (client) {
    await client.close();
    client = null;
    db = null;
  }
}
