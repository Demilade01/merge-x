<p align="center">
  <img src="https://imgur.com/VQIB0A9.png" alt="Merge-X" width="400" />
</p>
<p align="center">
  <b>Merge-X</b>
  <br/>
  <i>Batch-transfer selected ERC-20 tokens from one EVM wallet to another with ENS support.</i>
</p>

<br/>

### Overview
Merge-X is a minimal, production-ready Next.js dApp that helps you quickly migrate funds between wallets. Connect a wallet, fetch token balances on supported chains, select which tokens to move, and send them in a streamlined flow. ENS names are supported for the destination address.

### Features
- **Wallet connect**: RainbowKit + Wagmi with multiple popular wallets.
- **Multi-chain**: Ethereum Mainnet, Polygon, Optimism, Arbitrum, BSC, Gnosis.
- **Token fetching**: Serverless API proxy to Covalent with filtering and blacklist.
- **Batch transfer UX**: Select multiple ERC-20 tokens and submit transfers.
- **ENS support**: Enter `vitalik.eth` or any ENS name; it resolves before sending.
- **Clean state**: Jotai atoms for selections, tokens list, and destination.

### Tech Stack
- **Frontend**: Next.js 14, React 18, TypeScript
- **Web3**: Wagmi, Viem, RainbowKit
- **UI**: Geist UI
- **Validation**: Zod

### Requirements
- Node.js 18+
- Env vars:
  - `NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID` (WalletConnect project ID)
  - `COVALENT_API_KEY` (server-side, used in the API route)

### Getting Started
1. Install dependencies:
   ```bash
   npm install
   ```
2. Create a `.env.local` at the project root:
   ```bash
   NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=YOUR_PROJECT_ID
   COVALENT_API_KEY=YOUR_COVALENT_KEY
   ```
3. Run the dev server:
   ```bash
   npm run dev
   ```
4. Open `http://localhost:3000` and connect your wallet.

### How It Works
- The client calls `GET /api/chain-info/[chainId]/[evmAddress]` to fetch balances.
- The API handler translates the `chainId` to a Covalent `chainName` and queries Covalent.
- Results are filtered to legitimate ERC-20s and exclude any `blacklistAddresses` defined in `src/token-lists.ts`.
- The UI displays balances and USD quotes; toggles let users select tokens.
- When sending, Viem simulates the ERC-20 `transfer` for gas estimation and then submits via Wagmi’s `writeContract`.
- If the destination is an ENS name, it resolves to an address before sending.

Key files:
- `pages/_app.tsx`: Wagmi/RainbowKit setup and global app shell
- `pages/index.tsx`: Renders `GetTokens` + `SendTokens`
- `components/contract/GetTokens.tsx`: Fetches and displays balances with toggles
- `components/contract/SendTokens.tsx`: Destination input and batch send logic
- `pages/api/chain-info/[chainId]/[evmAddress].ts`: Covalent proxy + filtering
- `src/token-lists.ts`: Blacklist and token references
- `src/atoms/*`: Jotai global state atoms

### Scripts
- `npm run dev` — Start development server
- `npm run build` — Build for production
- `npm run start` — Start production build
- `npm run lint` — Lint
- `npm run export` — Static export (where applicable)

### Security Notes
- Always verify the destination address/ENS name before sending.
- The app does not custody keys; transactions are signed in your wallet.
- The filtering is best-effort; review selected tokens before confirming.

### Roadmap Ideas
- Native token (ETH/MATIC/etc.) sweep support with safety checks
- Gas and fee previews per token
- Retry/queue and partial failures handling UI
- CSV export of balances

### License
MIT
