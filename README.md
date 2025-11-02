# Terra Tempo

A decentralized agricultural data management platform built with Fully Homomorphic Encryption (FHE) technology, enabling secure and private computation on encrypted crop records.

## Overview

Terra Tempo is a blockchain-based application that allows farmers to:
- Submit encrypted crop records (crop type, land area, actual yield)
- Access AI-powered agricultural guidance and recommendations
- Analyze personal farming data while maintaining privacy
- Share knowledge with the farming community

All sensitive data is encrypted using FHEVM (Fully Homomorphic Encryption Virtual Machine), ensuring that computations can be performed on encrypted data without decryption.

## Project Structure

```
.
├── fhevm-hardhat-template/    # Smart contracts and Hardhat configuration
│   ├── contracts/              # Solidity smart contracts
│   ├── deploy/                 # Deployment scripts
│   ├── test/                   # Contract tests
│   └── tasks/                  # Hardhat custom tasks
│
└── terra-tempo-frontend/       # Next.js frontend application
    ├── app/                    # Next.js app router pages
    ├── components/             # React components
    ├── hooks/                  # Custom React hooks
    ├── fhevm/                  # FHEVM integration logic
    └── scripts/                # Build and deployment scripts
```

## Features

### Smart Contracts (`fhevm-hardhat-template`)
- **TerraTempoCore**: Main contract managing encrypted crop records
- FHEVM integration for encrypted data operations
- Access control for decryption permissions
- Support for localhost and Sepolia testnet

### Frontend (`terra-tempo-frontend`)
- Next.js 15 with static export
- Wallet integration (MetaMask, EIP-6963)
- FHEVM Relayer SDK integration (Sepolia) and Mock utils (localhost)
- Encrypted data submission and decryption
- Dashboard, records management, and analytics pages
- Responsive design with dark mode support

## Prerequisites

- **Node.js**: Version 20 or higher
- **npm**: Package manager
- **MetaMask** or compatible Web3 wallet
- **Hardhat node** (for local development)

## Installation

### 1. Install Contract Dependencies

```bash
cd fhevm-hardhat-template
npm install
```

### 2. Install Frontend Dependencies

```bash
cd terra-tempo-frontend
npm install
```

### 3. Set Up Environment Variables

#### Hardhat Configuration

```bash
cd fhevm-hardhat-template
npx hardhat vars set MNEMONIC
npx hardhat vars set INFURA_API_KEY
npx hardhat vars set ETHERSCAN_API_KEY  # Optional
```

#### Frontend Configuration

The frontend automatically detects the network and uses:
- **Mock FHEVM** for localhost (chainId: 31337)
- **Real Relayer SDK** for Sepolia (chainId: 11155111)

## Development

### Local Development (Mock Mode)

1. **Start Hardhat node** (in one terminal):
   ```bash
   cd fhevm-hardhat-template
   npx hardhat node
   ```

2. **Deploy contracts** (in another terminal):
   ```bash
   cd fhevm-hardhat-template
   npx hardhat deploy --network localhost
   ```

3. **Generate ABI and addresses**:
   ```bash
   cd terra-tempo-frontend
   npm run dev:mock
   ```

   This will:
   - Check if Hardhat node is running
   - Generate contract ABI and address mappings
   - Start the Next.js dev server with mock FHEVM

### Production Mode (Sepolia Testnet)

1. **Deploy contracts to Sepolia**:
   ```bash
   cd fhevm-hardhat-template
   npx hardhat deploy --network sepolia
   ```

2. **Update contract addresses** in `terra-tempo-frontend/abi/TerraTempoCoreAddresses.ts`

3. **Start frontend**:
   ```bash
   cd terra-tempo-frontend
   npm run dev
   ```

## Build and Deploy

### Frontend Static Export

```bash
cd terra-tempo-frontend
npm run build
```

The static files will be generated in the `out/` directory.

### Vercel Deployment

The frontend is configured for Vercel deployment with:
- Static export support
- Required headers for FHEVM WASM files
- Cross-Origin policies for secure execution

## Usage

1. **Connect Wallet**: Click "Connect Wallet" and approve the connection
2. **Submit Record**: Navigate to "Records" → "New Record" and fill in the encrypted form
3. **View Records**: Check your submitted records in the "Records" page
4. **Decrypt Data**: Click "Decrypt" on any record to view decrypted values (requires authorization)
5. **Analytics**: View your farming statistics and AI recommendations in the "Analytics" page

## Technology Stack

### Smart Contracts
- **Solidity**: ^0.8.28
- **Hardhat**: Development environment
- **FHEVM**: Fully Homomorphic Encryption Virtual Machine
- **ethers.js**: Ethereum interaction library

### Frontend
- **Next.js**: 15.0.0 (React framework)
- **TypeScript**: Type safety
- **Tailwind CSS**: Styling
- **FHEVM Relayer SDK**: v0.3.0-5 (Sepolia)
- **FHEVM Mock Utils**: v0.3.0-1 (localhost)
- **ethers.js**: v6.13.0

## Security Considerations

- All sensitive data is encrypted using FHEVM before submission
- Decryption requires explicit authorization via ACL (Access Control List)
- Wallet connection uses EIP-6963 standard for provider discovery
- Private keys are never exposed; all operations use wallet signatures

## License

See individual LICENSE files in subdirectories.

## Contributing

This is a private project. For questions or issues, please contact the maintainers.


