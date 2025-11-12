import { MongoClient, Db } from 'mongodb';
import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';

const FALLBACK_URI = process.env.DOCUMENTDB_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017';
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
    const uri = await resolveMongoUri();
    client = new MongoClient(uri, options);
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

async function resolveMongoUri(): Promise<string> {
  if (process.env.DOCUMENTDB_URI) return process.env.DOCUMENTDB_URI;
  if (process.env.MONGODB_URI) return process.env.MONGODB_URI;

  const secretArn = process.env.DOCDB_ELASTIC_ADMIN_SECRET_ARN || process.env.DOCDB_SECRET_ARN;
  const endpoint = process.env.DOCUMENTDB_ENDPOINT;
  const port = process.env.DOCUMENTDB_PORT ? Number(process.env.DOCUMENTDB_PORT) : 27017;
  const username = process.env.DOCUMENTDB_USERNAME || 'docdbadmin';

  if (secretArn && endpoint) {
    const password = await fetchSecretString(secretArn);
    return `mongodb://${encodeURIComponent(username)}:${encodeURIComponent(password)}@${endpoint}:${port}/`;
  }

  return FALLBACK_URI;
}

async function fetchSecretString(secretArn: string): Promise<string> {
  const region = process.env.AWS_REGION || 'us-east-2';
  const sm = new SecretsManagerClient({ region });
  const resp = await sm.send(new GetSecretValueCommand({ SecretId: secretArn }));
  if (resp.SecretString) return resp.SecretString;
  if (resp.SecretBinary) return Buffer.from(resp.SecretBinary as any, 'base64').toString('utf8');
  throw new Error('Secret has no SecretString or SecretBinary');
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
