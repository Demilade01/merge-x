# WalletConnect Integration

This project uses WalletConnect libraries alongside RainbowKit for enhanced wallet connectivity features.

## Installed Libraries

- `@walletconnect/ethereum-provider@latest` - Direct Ethereum provider integration
- `@walletconnect/utils@^2.21.9` - Utility functions
- `@walletconnect/web3wallet@^1.16.1` - Wallet-to-wallet communication
- `@reown/walletkit@^1.2.11` - Reown WalletKit (formerly WalletConnect)
- `@walletconnect/core@^2.21.9` - Core WalletConnect functionality

## Usage

### Basic Usage with RainbowKit

RainbowKit already handles wallet connections. These libraries are available for advanced features:

```typescript
import { useWalletConnect } from '../hooks/useWalletConnect';
import { walletConnectUtils } from '../src/utils/walletconnect';

function MyComponent() {
  const { utils, connect, disconnect } = useWalletConnect();

  // Use utility functions
  const formatted = utils.formatAddress('0x...');
  const isValid = utils.isValidAddress('0x...');
  const chainName = utils.getChainName(1); // 'Ethereum'
}
```

### Direct Ethereum Provider

For direct WalletConnect connections (bypassing RainbowKit):

```typescript
import { initEthereumProvider } from '../src/utils/walletconnect';

const provider = await initEthereumProvider();
if (provider) {
  await provider.enable();
  // Use provider for transactions
}
```

### Web3Wallet for Wallet-to-Wallet

For advanced wallet-to-wallet communication:

```typescript
import { initWeb3Wallet } from '../src/utils/walletconnect';

const web3wallet = await initWeb3Wallet();
if (web3wallet) {
  // Use for wallet-to-wallet features
}
```

## Configuration

Make sure you have your WalletConnect Project ID in `.env.local`:

```
NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=your-project-id
```

## Notes

- RainbowKit continues to work as before
- These libraries provide additional features when needed
- Both can coexist without conflicts
- Use RainbowKit for standard wallet connections
- Use WalletConnect libraries for advanced features
