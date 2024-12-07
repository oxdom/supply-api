const express = require('express');
const { Connection, PublicKey } = require('@solana/web3.js');
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

// Base client
const baseTransportRPC = http('https://base.llamarpc.com');
const baseClientRPC = createPublicClient({
    chain: base,
    transport: baseTransportRPC,
});

// Ethereum client
const ETHEREUM_PROVIDER_URL = 'https://winter-sparkling-gadget.quiknode.pro/78b00fcaed6bedd88a4e33f3688781281a172dd2';
const ethTransportRPC = http(ETHEREUM_PROVIDER_URL);
const ethClientRPC = createPublicClient({
    chain: mainnet,
    transport: ethTransportRPC,
});

// Known burn addresses
const ETH_BURN_ADDRESSES = [
    '0x0000000000000000000000000000000000000000', // Zero address
    '0xdead000000000000000000000000000000000000',  // Dead address
    "0x000000000000000000000000000000000000dEaD"
];

// Utility function to validate and normalize an address
async function cleanAddress(address) {
    if (!isAddress(address)) {
        throw new Error(`Invalid address: ${address}`);
    }
    return getAddress(address);
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

// Generic function to get the adjusted supply for Ethereum-compatible chains
async function getAdjustedSupply(clientRPC, tokenAddress) {
    try {
        // Fetch total supply
        const totalSupply = await clientRPC.readContract({
            address: tokenAddress,
            abi: ERC20_ABI,
            functionName: 'totalSupply',
        });

        // Calculate burned tokens
        let burnedAmount = 0n;
        for (const burnAddress of ETH_BURN_ADDRESSES) {
            const balance = await clientRPC.readContract({
                address: tokenAddress,
                abi: ERC20_ABI,
                functionName: 'balanceOf',
                args: [burnAddress],
            });
            burnedAmount += balance;
        }
        console.log(burnedAmount)

        // Adjust the total supply
        return totalSupply - burnedAmount;
    } catch (error) {
        console.error('Error fetching adjusted supply:', error);
        throw error;
    }
}

// Route for Solana supply
app.get('/supply/solana/:tokenAddress', async (req, res) => {
    const { tokenAddress } = req.params;
    try {
        const supply = await getSolanaTokenSupply(tokenAddress);
        res.json({ tokenAddress, supply });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch Solana token supply' });
    }
});

// Route for Base supply
app.get('/supply/base/:tokenAddress', async (req, res) => {
    const { tokenAddress } = req.params;
    try {
        const cleanTokenAddress = await cleanAddress(tokenAddress);
        const adjustedSupply = await getAdjustedSupply(baseClientRPC, cleanTokenAddress);
        res.json({ tokenAddress, supply: formatEther(adjustedSupply) });
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'Failed to fetch Base token supply' });
    }
});

// Route for Ethereum supply
app.get('/supply/eth/:tokenAddress', async (req, res) => {
    const { tokenAddress } = req.params;
    try {
        const cleanTokenAddress = await cleanAddress(tokenAddress);
        const adjustedSupply = await getAdjustedSupply(ethClientRPC, cleanTokenAddress);
        res.json({ tokenAddress, supply: formatEther(adjustedSupply) });
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'Failed to fetch Ethereum token supply' });
    }
});

// Start the server
app.listen(port, () => {
    console.log(`API server running at http://localhost:${port}`);
});
