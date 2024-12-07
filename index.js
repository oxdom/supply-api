const express = require('express');
const { Connection, PublicKey } = require('@solana/web3.js');

const app = express();
const port = 3000;

// Solana cluster endpoint
const SOLANA_CLUSTER = 'https://api.mainnet-beta.solana.com';

// Create a connection to the Solana cluster
const connection = new Connection(SOLANA_CLUSTER, 'confirmed');

// Function to get the supply of a token
async function getTokenSupply(tokenAddress) {
  try {
    const publicKey = new PublicKey(tokenAddress);
    const supply = await connection.getTokenSupply(publicKey);
    return supply.value.uiAmount;
  } catch (error) {
    console.error('Error fetching token supply:', error);
    throw error;
  }
}

// Define an endpoint to get the token supply
app.get('/supply/:tokenAddress', async (req, res) => {
  const { tokenAddress } = req.params;
  try {
    const supply = await getTokenSupply(tokenAddress);
    res.json({ tokenAddress, supply });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch token supply' });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`API server running at http://localhost:${port}`);
});