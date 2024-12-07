const express = require('express');
const { Connection, PublicKey } = require('@solana/web3.js');
const { ethers } = require('ethers');
const { createPublicClient, http, formatEther } = require('viem');
const { base, mainnet } = require('viem/chains');
const { isAddress, getAddress } = require('@ethersproject/address');

const app = express();
const port = 3000;
const ERC20_ABI = require('./abi/ERC20.json');

// Solana cluster endpoint
const SOLANA_CLUSTER = 'https://api.mainnet-beta.solana.com';

// Create a connection to the Solana cluster
const solanaConnection = new Connection(SOLANA_CLUSTER, 'confirmed');

// Ethereum provider (replace with your own URL if running a local node or using another provider)
const ETHEREUM_PROVIDER_URL = 'https://winter-sparkling-gadget.quiknode.pro/78b00fcaed6bedd88a4e33f3688781281a172dd2'; // Example URL, replace with actual provider

// Create an Ethereum provider
//const ethereumProvider = new ethers.providers.JsonRpcProvider(ETHEREUM_PROVIDER_URL);

// Setup Base client
const baseTransportRPC = http('https://base.llamarpc.com');

const baseClientRPC = createPublicClient({
    chain: base,
    transport: baseTransportRPC,
});

const ethTransportRPC = http(ETHEREUM_PROVIDER_URL);

const ethClientRPC = createPublicClient({
    chain: mainnet,
    transport: ethTransportRPC,
});
async function cleanAddress(address) {
    try {
      // Check if the address is valid
      if (isAddress(address)) {
        // Normalize the address to its checksum format
        return getAddress(address);
      } else {
        throw new Error(`Invalid address: ${address}`);
      }
    } catch (error) {
      console.error('Error validating address:', error.message);
      throw error;
    }
  }
// Function to get the supply of a token on Solana
async function getSolanaTokenSupply(tokenAddress) {
  try {
    const publicKey = new PublicKey(tokenAddress);
    const supply = await solanaConnection.getTokenSupply(publicKey);
    return supply.value.uiAmount;
  } catch (error) {
    console.error('Error fetching Solana token supply:', error);
    throw error;
  }
}

// Function to get the supply of a token on Base
async function getBaseSupply(tokenAddress) {
    return await baseClientRPC.readContract({
        address: tokenAddress,
        abi: ERC20_ABI,
        functionName: 'totalSupply',
    });
}

// Function to get the supply of a token on Base
async function getEthSupply(tokenAddress) {
    return await ethClientRPC.readContract({
        address: tokenAddress,
        abi: ERC20_ABI,
        functionName: 'totalSupply',
    });
}

// Define an endpoint to get the token supply for Solana
app.get('/supply/solana/:tokenAddress', async (req, res) => {
  const { tokenAddress } = req.params;
  try {
    const supply = await getSolanaTokenSupply(tokenAddress);
    res.json({ tokenAddress, supply });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch Solana token supply' });
  }
});

// Define an endpoint to get the token supply for Base
app.get('/supply/base/:tokenAddress', async (req, res) => {
  const { tokenAddress } = req.params;
  try {
   
        const totalSupply = await getBaseSupply(tokenAddress);
        console.log(`The supply of token address ${tokenAddress} is ${formatEther(totalSupply)} tokens`);
        const supply = formatEther(totalSupply)
   
    res.json({ tokenAddress, supply });
  } catch (error) {
    console.log(error)
    res.status(500).json({ error: 'Failed to fetch Base token supply' });
  }
});

app.get('/supply/eth/:tokenAddress', async (req, res) => {
    const { tokenAddress } = req.params;
    try {
     
          const totalSupply = await getEthSupply(tokenAddress);
          console.log(`The supply of token address ${tokenAddress} is ${formatEther(totalSupply)} tokens`);
          const supply = formatEther(totalSupply)
     
      res.json({ tokenAddress, supply });
    } catch (error) {
      console.log(error)
      res.status(500).json({ error: 'Failed to fetch Eth token supply' });
    }
  });

// Start the server
app.listen(port, () => {
  console.log(`API server running at http://localhost:${port}`);
});