const { createPublicClient, http, encodeAbiParameters, formatEther, parseEther } = require('viem');
const { base, arbitrum } = require('viem/chains');
const ERC20_ABI = require('./abi/ERC20.json');

// Arbitrum provider
const ARBITRUM_PROVIDER_URL = 'https://arb1.arbitrum.io/rpc';
const arbitrumTransportRPC = http(ARBITRUM_PROVIDER_URL);
const arbClientRPC = createPublicClient({
    chain: arbitrum,
    transport: arbitrumTransportRPC,
});

// Base provider
const BASE_PROVIDER_URL = 'https://base.llamarpc.com';
const baseTransportRPC = http(BASE_PROVIDER_URL);
const baseClientRPC = createPublicClient({
    chain: base,
    transport: baseTransportRPC,
});

// Known burn addresses
const BURN_ADDRESSES = [
    '0x0000000000000000000000000000000000000000', // Zero address
    '0xdead000000000000000000000000000000000000', // Dead address
    '0x000000000000000000000000000000000000dEaD' // Another variation
];

// Function to fetch token supply with decimals and burn adjustments
async function getSupply(clientRPC, tokenAddress) {
    try {
        // Fetch total supply
        const totalSupply = await clientRPC.readContract({
            address: tokenAddress,
            abi: ERC20_ABI,
            functionName: 'totalSupply',
        });

        // Fetch decimals
        const decimals = await clientRPC.readContract({
            address: tokenAddress,
            abi: ERC20_ABI,
            functionName: 'decimals',
        });

        // Fetch burned balances
        let burnedAmount = 0n;
        for (const burnAddress of BURN_ADDRESSES) {
            try {
                const balance = await clientRPC.readContract({
                    address: tokenAddress,
                    abi: ERC20_ABI,
                    functionName: 'balanceOf',
                    args: [burnAddress],
                });
                burnedAmount += balance;
            } catch (error) {
                console.warn(`Burn address ${burnAddress} balance fetch failed: ${error.message}`);
            }
        }
        console.log("burnedAmount", burnedAmount)
        console.log("decimals", decimals)
        console.log("totalSupply", totalSupply)
        // Adjust total supply and format with decimals
        const adjustedSupply = (totalSupply - burnedAmount) / BigInt(10 ** decimals);
    console.log(`Adjusted Supply: ${adjustedSupply} tokens`);

        return adjustedSupply// / BigInt(10 ** decimals);
    } catch (error) {
        console.error(`Error fetching token supply: ${error.message}`);
        throw error;
    }
}

// Main function to fetch supply for a token
async function main(tokenAddress, clientRPC, chainName) {
    for (let attempt = 0; attempt < 3; attempt++) {
        try {
            const adjustedSupply = await getSupply(clientRPC, tokenAddress);
            console.log(`The supply of token address ${tokenAddress} on ${chainName} is ${adjustedSupply} tokens`);
            return;
        } catch (error) {
            console.error(`Error fetching token supply (attempt ${attempt + 1}): ${error.message}`);
            if (attempt === 2) {
                console.error(`Failed to fetch token supply for ${tokenAddress} on ${chainName} after 3 attempts.`);
                return 0;
            }
        }
    }
}

// Run for Arbitrum and Base
(async () => {
    const tokenAddress = '0x09e18590e8f76b6cf471b3cd75fe1a1a9d2b2c2b';
    const chain = 'Arbitrum';
    console.log(`Fetching token supply for ${chain}...`);
    await main(tokenAddress, arbClientRPC, chain);

})();

