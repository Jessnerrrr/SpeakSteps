const mongoose = require('mongoose');
const { MongoClient } = require('mongodb');
const path = require('node:path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });

const uri = process.env.MONGODB_URI;

const redactUri = (message) => {
  const text = String(message);
  return uri ? text.split(uri).join('[redacted MongoDB URI]') : text;
};

const connectDB = async () => {
  if (!uri) {
    throw new Error('MONGODB_URI must be set in backend/.env');
  }

  try {
    const conn = await mongoose.connect(uri);
    console.log(`[MongoDB] Mongoose Connected: ${conn.connection.host}`);
    console.log(`[MongoDB] Active Database: ${conn.connection.name}`);
    return conn;
  } catch (error) {
    console.error(`[MongoDB] Connection error: ${redactUri(error.message)}`);
    throw error;
  }
};

const getDatabaseTree = async () => {
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const adminDb = client.db().admin();
    const dbsList = await adminDb.listDatabases();
    
    const tree = [];
    for (const dbInfo of dbsList.databases) {
      const currentDb = client.db(dbInfo.name);
      const collections = await currentDb.listCollections().toArray();
      const colDetails = [];
      for (const col of collections) {
        const count = await currentDb.collection(col.name).countDocuments();
        colDetails.push({
          name: col.name,
          documentCount: count,
        });
      }
      tree.push({
        database: dbInfo.name,
        sizeOnDisk: dbInfo.sizeOnDisk,
        empty: dbInfo.empty,
        collections: colDetails,
      });
    }
    return tree;
  } finally {
    await client.close();
  }
};

module.exports = {
  connectDB,
  getDatabaseTree,
  redactUri,
};
