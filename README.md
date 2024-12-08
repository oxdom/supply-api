# Token Supply API

This repository provides an API server for fetching and calculating the adjusted supply of tokens across multiple blockchain networks, including **Solana**, **Ethereum**, **Base**, **Arbitrum**, and **Sui**. The API is built using Node.js and Express and leverages the respective SDKs or libraries for interacting with each blockchain.

## Table of Contents
- [Overview](#overview)
- [Features](#features)
- [Endpoints](#endpoints)
- [Why Check Decimals?](#why-check-decimals)
- [Why Use BigInt?](#why-use-bigint)
- [Setup](#setup)
- [Usage](#usage)
- [Input Requirements for Each Chain](#input-requirements-for-each-chain)
- [Known Burn Addresses](#known-burn-addresses)
- [Error Handling](#error-handling)
- [License](#license)

---

## Overview

This API calculates the **adjusted token supply** by subtracting the balances of known burn addresses (addresses where tokens are irretrievably sent) from the total supply. This ensures an accurate representation of the circulating supply.

The API supports:
1. **Solana**: Fetches token supply using the Solana RPC.
2. **Ethereum-Compatible Chains**: Calculates adjusted supply using ERC-20 token contracts.
3. **Sui**: Fetches total supply using the Sui RPC.

---

## Features

- Fetch **total token supply**.
- Identify and subtract tokens sent to known **burn addresses**.
- Dynamically determine token **decimals** to correctly format supply values.
- Cross-chain support for:
  - Solana
  - Ethereum Mainnet
  - Arbitrum
  - Base chain
  - Sui

---

## Endpoints

### Solana Token Supply
```http
GET /supply/solana/:tokenAddress
```
- **Input:** `tokenAddress` - The Solana token's public key.
- **Output:** Returns the total supply of the Solana token.

---

### Ethereum Token Supply
```http
GET /supply/eth/:tokenAddress
```
- **Input:** `tokenAddress` - The Ethereum token contract address.
- **Output:** Returns the adjusted supply of the token.

---

### Arbitrum Token Supply
```http
GET /supply/arb/:tokenAddress
```
- **Input:** `tokenAddress` - The Arbitrum token contract address.
- **Output:** Returns the adjusted supply of the token.

---

### Base Token Supply
```http
GET /supply/base/:tokenAddress
```
- **Input:** `tokenAddress` - The Base token contract address.
- **Output:** Returns the adjusted supply of the token.

---

### Sui Token Supply
```http
GET /supply/sui/:tokenAddress
```
- **Input:** `tokenAddress` - The Sui token address.
- **Output:** Returns the total supply of the Sui token.

---

## Why Check Decimals?

In token standards like ERC-20, the total supply and balances are stored as integers (e.g., 1000000000000000000 for `1.0` tokens with 18 decimals). The `decimals` field specifies how many decimal places a token supports.

- **Example:** A token with a supply of `1000000000000000000` and `18` decimals translates to `1.0`.
- Decimals ensure that the supply is correctly formatted when displayed or processed.

Without retrieving `decimals`, token amounts could be misrepresented (e.g., displaying `1000000000000000000` instead of `1.0`).

---

## Why Use BigInt?

Blockchain supply and balances often exceed standard JavaScript number limits (`Number.MAX_SAFE_INTEGER`). **BigInt** allows precise calculations for such large numbers.

- Example: Total supply of `10^26` tokens.
- **BigInt** supports arithmetic without losing precision, making it ideal for blockchain data.

---

## Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/oxdom/supply-api.git
   cd token-supply-api
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure RPC endpoints:
   - Update the `ARBITRUM_PROVIDER_URL`, `SOLANA_CLUSTER`, `SUI_PROVIDER_URL`, and other transport URLs in the `.env` file.

4. Start the server:
   ```bash
   node index.js
   ```
   The server runs at `http://localhost:3000`.

---

## Usage

To fetch token supply, make HTTP GET requests to the appropriate endpoint, passing the token address as a parameter. 

**Example (Base Token):**
```bash
curl http://localhost:3000/supply/base/0xTokenAddress
```

---

## Input Requirements for Each Chain

| Chain      | Token Address Format                                                                                      | Notes                              |
|------------|----------------------------------------------------------------------------------------------------------|------------------------------------|
| **Solana** | Base58-encoded string (e.g., `TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA`)                              | Token public key.                 |
| **Ethereum** | Checksummed or lowercase hex string (e.g., `0x1234567890abcdef1234567890abcdef12345678`)                | Use the ERC-20 token contract.    |
| **Arbitrum** | Checksummed or lowercase hex string (e.g., `0x1234567890abcdef1234567890abcdef12345678`)                | Use the ERC-20 token contract.    |
| **Base**    | Checksummed or lowercase hex string (e.g., `0x1234567890abcdef1234567890abcdef12345678`)                 | Use the ERC-20 token contract.    |
| **Sui**     | Hex string (e.g., `0x1234567890abcdef1234567890abcdef12345678`)                                         | Use the Sui token address.        |

---

## Known Burn Addresses

For Ethereum-compatible chains, the following burn addresses are used:
- `0x0000000000000000000000000000000000000000`
- `0xdead000000000000000000000000000000000000`
- `0x000000000000000000000000000000000000dEaD`

---

## Error Handling

- Invalid token addresses return a **400 Bad Request**.
- Failed supply fetches return a **500 Internal Server Error**.

---

## License

This project is licensed under the MIT License.