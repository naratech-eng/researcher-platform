import { MongoClient, Db } from 'mongodb';

const MONGODB_URI = process.env.DOCUMENTDB_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017';
const DB_NAME = process.env.DB_NAME || 'animal_genetics';

let client: MongoClient | null = null;
let db: Db | null = null;

export async function connectDB(): Promise<Db> {
  if (db) {
    return db;
  }

  try {
    const options: any = {
      tls: process.env.DOCUMENTDB_TLS === 'true',
      tlsCAFile: process.env.DOCUMENTDB_CA_FILE,
      retryWrites: false,
      directConnection: true,
    };

    if (options.tlsCAFile === undefined) {
      delete options.tlsCAFile;
    }

    if (!options.tls) {
      delete options.tls;
      delete options.tlsCAFile;
    }

    client = new MongoClient(MONGODB_URI, options);
    await client.connect();

    db = client.db(DB_NAME);

    console.log(`✅ Connected to DocumentDB: ${DB_NAME}`);

    await createIndexes();

    return db;
  } catch (error) {
    console.error('❌ DocumentDB connection error:', error);
    throw error;
  }
}

async function createIndexes() {
  if (!db) return;

  try {
    const usersCollection = db.collection('users');

    await usersCollection.createIndex({ email: 1 }, { unique: true });
    await usersCollection.createIndex({ cognitoUserId: 1 }, { sparse: true });
    await usersCollection.createIndex({ walletAddress: 1 }, { sparse: true });
    await usersCollection.createIndex({ didIdentifier: 1 }, { sparse: true });

    console.log('✅ Database indexes created');
  } catch (error) {
    console.error('❌ Error creating indexes:', error);
  }
}

export async function closeDB(): Promise<void> {
  if (client) {
    await client.close();
    client = null;
    db = null;
    console.log('🔌 Disconnected from DocumentDB');
  }
}

export function getDB(): Db {
  if (!db) {
    throw new Error('Database not connected. Call connectDB() first.');
  }
  return db;
}
