require('dotenv').config();

const express = require('express');
const { Connection, PublicKey } = require('@solana/web3.js');
const { createPublicClient, http, formatEther } = require('viem');
const { base, mainnet, arbitrum  } = require('viem/chains');
const { isAddress, getAddress } = require('@ethersproject/address');

const app = express();
const port = 3000;
const ERC20_ABI = require('./abi/ERC20.json');

// Solana cluster endpoint
const SOLANA_CLUSTER = process.env.SOLANA_CLUSTER;
const ARBITRUM_PROVIDER_URL = process.env.ARBITRUM_PROVIDER_URL;
const baseTransportRPC = http(process.env.BASE_TRANSPORT_RPC);
const ethTransportRPC = http(process.env.ETH_TRANSPORT_RPC);
// Create a connection to the Solana cluster
const solanaConnection = new Connection(SOLANA_CLUSTER, 'confirmed');


const arbitrumTransportRPC = http(ARBITRUM_PROVIDER_URL);

const arbClientRPC = createPublicClient({
    chain: arbitrum,
    transport: arbitrumTransportRPC,
});
// Base client

const baseClientRPC = createPublicClient({
    chain: base,
    transport: baseTransportRPC,
});


const ethClientRPC = createPublicClient({
    chain: mainnet,
    transport: ethTransportRPC,
});

// Known burn addresses not sure if we want to use these
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
async function getDecimals(clientRPC, tokenAddress, defaultDecimals = 18) {
    try {
        // Try to fetch decimals from the contract
        const decimals = await clientRPC.readContract({
            address: tokenAddress,
            abi: ERC20_ABI,
            functionName: 'decimals',
        });
        console.log(`Token decimals fetched: ${decimals}`);
        return decimals;
    } catch (error) {
        // If decimals are not defined, fallback to default
        console.warn(`Decimals not defined for contract at ${tokenAddress}. Using default: ${defaultDecimals}`);
        return defaultDecimals;
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
            const decimals = await getDecimals(clientRPC, tokenAddress);
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
            console.log("burnedAmount", burnedAmount)
            console.log("decimals", decimals)
            console.log("totalSupply", totalSupply)

            // Adjust the total supply
            const adjustedSupply = (totalSupply - burnedAmount) / BigInt(10 ** decimals);
            console.log(`Adjusted Supply: ${adjustedSupply} tokens`);
            if(typeof adjustedSupply === "bigint"){
                return adjustedSupply.toString()
            }else{
                return adjustedSupply
            }
        
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
        
        res.json({ tokenAddress, supply: adjustedSupply });
        
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
        
        res.json({ tokenAddress, supply: adjustedSupply });
        
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
        
        res.json({ tokenAddress, supply: adjustedSupply });
        
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'Failed to fetch Ethereum token supply' });
    }
});


// Route for arbitrum supply
app.get('/supply/arb/:tokenAddress', async (req, res) => {
    const { tokenAddress } = req.params;
    try {
        const cleanTokenAddress = await cleanAddress(tokenAddress);
        const adjustedSupply = await getAdjustedSupply(arbClientRPC, cleanTokenAddress);
        console.log("adjustedSupply", adjustedSupply)
        
        res.json({ tokenAddress, supply: adjustedSupply });
        
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'Failed to fetch Ethereum token supply' });
    }
});

// Start the server
app.listen(port, () => {
    console.log(`API server running at http://localhost:${port}`);
});
