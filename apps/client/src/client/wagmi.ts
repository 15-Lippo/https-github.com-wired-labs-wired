import { connectorsForWallets } from "@rainbow-me/rainbowkit";
import {
  argentWallet,
  coinbaseWallet,
  injectedWallet,
  metaMaskWallet,
  rainbowWallet,
  walletConnectWallet,
} from "@rainbow-me/rainbowkit/wallets";
import { configureChains, createClient } from "wagmi";
import { arbitrumGoerli } from "wagmi/chains";
import { alchemyProvider } from "wagmi/providers/alchemy";
import { publicProvider } from "wagmi/providers/public";

import { env } from "../env/client.mjs";

const providers = [publicProvider()];

const apiKey = env.NEXT_PUBLIC_ALCHEMY_ID;
if (apiKey) providers.unshift(alchemyProvider({ apiKey }));

export const { chains, provider } = configureChains([arbitrumGoerli], providers);

const needsInjectedWalletFallback =
  typeof window !== "undefined" &&
  window.ethereum &&
  !window.ethereum.isMetaMask &&
  !window.ethereum.isCoinbaseWallet;

const connectors = connectorsForWallets([
  {
    groupName: "Popular",
    wallets: [
      metaMaskWallet({ chains }),
      rainbowWallet({ chains }),
      coinbaseWallet({ chains, appName: "The Wired" }),
    ],
  },
  {
    groupName: "More",
    wallets: [
      argentWallet({ chains }),
      walletConnectWallet({ chains }),
      ...(needsInjectedWalletFallback ? [injectedWallet({ chains })] : []),
    ],
  },
]);

export const wagmiClient = createClient({ connectors, provider, autoConnect: true });
