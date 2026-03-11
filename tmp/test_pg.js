
const { Client } = require('pg');

async function test() {
  const connectionString = "postgresql://myappuser:StrongPasswordHere@72.62.240.101:5432/myappdb";
  const client = new Client({
    connectionString: connectionString,
  });

  try {
    console.log("Connecting to PG...");
    await client.connect();
    console.log("Connected successfully!");
    const res = await client.query('SELECT NOW()');
    console.log("Current time from DB:", res.rows[0]);
    await client.end();
  } catch (err) {
    console.error("PG Connection failed:", err);
  }
}

test();
