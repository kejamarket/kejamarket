const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'server.js');
let content = fs.readFileSync(filePath, 'utf8');

// First cron: line 3007
content = content.replace(
`// Check for expired boosts every hour
setInterval(() => {
  try {
    console.log('[CRON] Checking for expired boosts...');
    const properties = store.getAllProperties();
    let expiredCount = 0;

    properties.forEach(property => {`,
`// Check for expired boosts every hour
setInterval(async () => {
  try {
    console.log('[CRON] Checking for expired boosts...');
    const properties = await store.getAllProperties();
    let expiredCount = 0;

    if (Array.isArray(properties)) properties.forEach(property => {`
);

// Second cron: line 3045
content = content.replace(
`    console.log('[CRON] Checking for boost renewal reminders...');
    const properties = store.getAllProperties();
    const users = store.getAllUsers();
    const now = new Date();`,
`    console.log('[CRON] Checking for boost renewal reminders...');
    const properties = await store.getAllProperties();
    const users = await store.getAllUsers();
    const now = new Date();`
);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Fixed cron jobs.');
