const { MongoClient } = require('mongodb');
const mongoose = require('mongoose');
const path = require('node:path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

const uri = process.env.MONGODB_URI;
const redactUri = (message) => String(message).split(uri || '\0').join('[redacted MongoDB URI]');

async function run() {
  if (!uri) {
    throw new Error('MONGODB_URI must be set in backend/.env');
  }

  console.log("==================================================");
  console.log("       SPEAKSTEPS - MONGODB CONNECTION TEST       ");
  console.log("==================================================");
  console.log("URI Target: configured MongoDB connection");

  // 1. Test Native MongoDB Driver & List Databases/Collections
  console.log("\n[1/2] Connecting with MongoDB Driver (mongodb)...");
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log("✔ Connection Established Successfully!");

    const adminDb = client.db().admin();
    const ping = await adminDb.ping();
    console.log(`✔ Ping Response: ${JSON.stringify(ping)}`);

    console.log("\n--- RENDERING ALL DATABASES & COLLECTIONS ---");
    const dbsList = await adminDb.listDatabases();
    console.log(`Found ${dbsList.databases.length} database(s):\n`);

    for (const dbInfo of dbsList.databases) {
      const sizeKB = (dbInfo.sizeOnDisk / 1024).toFixed(2);
      console.log(`📁 [Database] ${dbInfo.name} (${sizeKB} KB)`);

      try {
        const currentDb = client.db(dbInfo.name);
        const collections = await currentDb.listCollections().toArray();
        if (collections.length === 0) {
          console.log(`   └── (no collections)`);
        } else {
          for (let i = 0; i < collections.length; i++) {
            const isLast = i === collections.length - 1;
            const prefix = isLast ? '└──' : '├──';
            const col = collections[i];
            const count = await currentDb.collection(col.name).countDocuments();
            console.log(`   ${prefix} 📄 ${col.name} (${count} docs)`);
          }
        }
      } catch (err) {
        console.log(`   └── [Error reading collections: ${err.message}]`);
      }
      console.log("");
    }
  } catch (err) {
    console.error("✖ Native Driver Error:", redactUri(err.message));
  } finally {
    await client.close();
  }

  // 2. Test Mongoose ODM Connection
  console.log("[2/2] Connecting with Mongoose ODM (mongoose)...");
  try {
    const conn = await mongoose.connect(uri);
    console.log(`✔ Mongoose Connected Successfully!`);
    console.log(`✔ Host: ${conn.connection.host}`);
    console.log(`✔ Connected Database: ${conn.connection.name}`);
    console.log(`✔ Ready State: ${mongoose.connection.readyState} (1 = connected)`);
    await mongoose.disconnect();
    console.log("✔ Mongoose Disconnected cleanly.");
  } catch (err) {
    console.error("✖ Mongoose Error:", redactUri(err.message));
  }

  console.log("\n==================================================");
  console.log("             ALL TESTS COMPLETED                  ");
  console.log("==================================================");
}

run().catch(console.dir);
