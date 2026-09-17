require('dotenv').config();
const fs = require('fs');
const { Client } = require('pg');

let s = fs.readFileSync('./js/data/seedListings.js', 'utf8');
s = s.replace(/Studio BnB Short-Stay in Kilimani \(Rose Avenue near Yaya Centre\)/g, 'Executive 1 Bedroom Apartment in Kilimani (Rose Avenue near Yaya Centre)');
fs.writeFileSync('./js/data/seedListings.js', s, 'utf8');

let d = fs.readFileSync('./db/data.json', 'utf8');
d = d.replace(/Studio BnB Short-Stay in Kilimani \(Rose Avenue near Yaya Centre\)/g, 'Executive 1 Bedroom Apartment in Kilimani (Rose Avenue near Yaya Centre)');
fs.writeFileSync('./db/data.json', d, 'utf8');

async function updateDb() {
  const c = new Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
  await c.connect();
  await c.query(`
    UPDATE properties 
    SET title = 'Executive 1 Bedroom Apartment in Kilimani (Rose Avenue near Yaya Centre)'
    WHERE id = 'prop-nrb-035'
  `);
  console.log('✅ Updated DB');
  await c.end();
}

updateDb();
