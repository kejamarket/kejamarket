/**
 * KejaMarket - IndexNow Instant Submission Script
 * Submits the latest site URLs directly to Bing, Microsoft Copilot, and Yandex
 * via the IndexNow API protocol.
 */

const fetch = require('node-fetch');

const HOST = 'kejamarket.co.ke';
const KEY = 'e80fc85ec99b4d81a9544ef4a6527b14';
const KEY_LOCATION = `https://${HOST}/${KEY}.txt`;

const URL_LIST = [
  `https://${HOST}/`,
  `https://${HOST}/terms`,
  `https://${HOST}/privacy-policy`,
  `https://${HOST}/offline`,
  `https://${HOST}/llms.txt`,
  `https://${HOST}/llms-full.txt`
];

async function submitIndexNow() {
  console.log('🚀 Initiating IndexNow submission for KejaMarket...');
  console.log(`Host: ${HOST}`);
  console.log(`Key Location: ${KEY_LOCATION}`);
  console.log(`URLs to index (${URL_LIST.length}):`, URL_LIST);

  const payload = {
    host: HOST,
    key: KEY,
    keyLocation: KEY_LOCATION,
    urlList: URL_LIST
  };

  const endpoints = [
    'https://api.indexnow.org/indexnow',
    'https://www.bing.com/indexnow'
  ];

  for (const endpoint of endpoints) {
    try {
      console.log(`\n📡 Pinging ${endpoint}...`);
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json; charset=utf-8'
        },
        body: JSON.stringify(payload),
        timeout: 10000
      });

      console.log(`Response Status: ${response.status} ${response.statusText}`);
      if (response.status === 200 || response.status === 202) {
        console.log(`✅ Success! IndexNow accepted the URL batch from ${endpoint}.`);
      } else {
        const text = await response.text();
        console.warn(`⚠️ Warning: Received non-200/202 status from ${endpoint}:`, text);
      }
    } catch (err) {
      console.error(`❌ Error submitting to ${endpoint}:`, err.message);
    }
  }

  console.log('\n🎉 IndexNow submission process completed.');
}

if (require.main === module) {
  submitIndexNow();
}

module.exports = { submitIndexNow, URL_LIST };
