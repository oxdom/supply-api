// Dynamically import TronWeb
const { default: TronWebModule } = await import('tronweb');

// Retrieve TronWeb from the imported module
const TronWeb = TronWebModule.TronWeb;

// Set up TronWeb instance conditionally
export const tronWeb = new TronWeb({
    fullHost: 'https://api.trongrid.io',   // Use TronGrid
    headers: { 'TRON-PRO-API-KEY': '5fbfdec2-d8d4-4bfe-8c0e-03ec49f54fef' } // Add API key as header
});
