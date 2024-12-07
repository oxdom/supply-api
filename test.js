const { createPublicClient, http, encodeAbiParameters, formatEther, parseEther } = require('viem');
const { base } = require('viem/chains');
const ERC20_ABI = require('./abi/ERC20.json');

const baseTransportRPC = http('https://base.llamarpc.com');

const baseClientRPC = createPublicClient({
    chain: base,
    transport: transportRPC,
});

async function getSupply(tokenAddress) {
    return await clientRPC.readContract({
        address: tokenAddress,
        abi: ERC20_ABI,
        functionName: 'totalSupply',
    });
}

async function main(tokenAddress) {
    for (let attempt = 0; attempt < 3; attempt++) {
        try {
            const totalSupply = await getSupply(tokenAddress);
            console.log(`The supply of token address ${tokenAddress} is ${formatEther(totalSupply)} tokens`);
            return;
        } catch (error) {
            console.error(`Error fetching token balances: ${error.message}`);
            if (attempt === 2) {
                return 0;
            }
        }
    }
}

main('0x4F9Fd6Be4a90f2620860d680c0d4d5Fb53d1A825');
