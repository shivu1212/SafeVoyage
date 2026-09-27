import { MongoClient } from 'mongodb';

let client;
let database;

export async function connectMongo() {
  if (database) return database;

  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/SafeVoyage';
  const dbName = process.env.MONGODB_DB_NAME || 'SafeVoyage';
  client = new MongoClient(uri, {
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 5000
  });
  await client.connect();
  database = client.db(dbName);
  await database.collection('users').createIndex({ email: 1 }, { unique: true });
  console.log('MongoDB connected successfully');
  return database;
}

export function getMongoDatabase() {
  if (!database) {
    throw new Error('MongoDB is not connected. Please make sure MongoDB is running.');
  }
  return database;
}

export async function closeMongo() {
  if (client) await client.close();
  client = null;
  database = null;
}
