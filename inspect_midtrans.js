const fs = require('fs');
const path = require('path');
const midtransClient = require('./node_modules/midtrans-client');

const envFile = fs.readFileSync(path.join(__dirname, '.env.local'), 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
  const parts = line.split('=');
  if (parts.length >= 2) {
    const key = parts[0].trim();
    const val = parts.slice(1).join('=').trim();
    env[key] = val;
  }
});

const apiClient = new midtransClient.CoreApi({
  isProduction: false,
  serverKey: env.MIDTRANS_SERVER_KEY,
  clientKey: env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY,
});

async function checkStatus() {
  const txId = 'PAY-1780903882914';
  try {
    const status = await apiClient.transaction.status(txId);
    console.log('Midtrans Status for', txId, ':');
    console.log(JSON.stringify(status, null, 2));
  } catch (error) {
    console.error('Error fetching Midtrans status:', error.message);
  }
}

checkStatus();
