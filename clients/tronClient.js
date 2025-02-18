// Dynamically import TronWeb
const { default: TronWebModule } = await import('tronweb');
const env = require('dotenv');
env.config();
// Retrieve TronWeb from the imported module
const TronWeb = TronWebModule.TronWeb;

// Set up TronWeb instance conditionally
export const tronWeb = new TronWeb({
    fullHost: 'https://api.trongrid.io',   // Use TronGrid
    headers: { 'TRON-PRO-API-KEY': process.env.TRON_API_KEY } // Add API key as header
});
