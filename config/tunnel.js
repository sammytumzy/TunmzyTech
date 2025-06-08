<<<<<<< HEAD
// This file has been removed as the ngrok/localtunnel functionality is no longer needed.
=======
const localtunnel = require('localtunnel');
const dotenv = require('dotenv');

dotenv.config();

const PORT = process.env.PORT || 5000;

async function setupTunnel() {
  try {
    const subdomain = process.env.LOCALTUNNEL_SUBDOMAIN || 'fast-areas-shave';
    const tunnel = await localtunnel({ 
      port: PORT,
      subdomain: subdomain // Use subdomain from environment variables or default
    });
    
    console.log(`🚀 LocalTunnel is running! Public URL: ${tunnel.url}`);
    
    tunnel.on('close', () => {
      console.log('LocalTunnel closed');
      process.exit(1);
    });
    
    tunnel.on('error', (err) => {
      console.error('LocalTunnel error:', err);
      process.exit(1);
    });
    
    return tunnel;
  } catch (error) {
    console.error('Failed to start localtunnel:', error);
    process.exit(1);
  }
}

module.exports = setupTunnel;
>>>>>>> f0d38d87b7a8cbf4156ccd4c1cf1b8254d297799
