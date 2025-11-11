import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type { Address } from 'viem';

type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'reconnecting';

interface WalletState {
  address: Address | null;
  chainId: number | null;
  balance: bigint | null;
  connectionStatus: ConnectionStatus;
  isConnected: boolean;
}

interface WalletActions {
  setAddress: (address: Address | null) => void;
  setChainId: (chainId: number | null) => void;
  setBalance: (balance: bigint | null) => void;
  setConnectionStatus: (status: ConnectionStatus) => void;
  connect: (address: Address, chainId: number) => void;
  disconnect: () => void;
  updateBalance: (balance: bigint) => void;
}

type WalletStore = WalletState & WalletActions;

const initialState: WalletState = {
  address: null,
  chainId: null,
  balance: null,
  connectionStatus: 'disconnected',
  isConnected: false,
};

export const useWalletStore = create<WalletStore>()(
  devtools(
    persist(
      immer((set) => ({
        ...initialState,

        setAddress: (address) =>
          set((state) => {
            state.address = address;
            state.isConnected = !!address;
          }),

        setChainId: (chainId) =>
          set((state) => {
            state.chainId = chainId;
          }),

        setBalance: (balance) =>
          set((state) => {
            state.balance = balance;
          }),

        setConnectionStatus: (status) =>
          set((state) => {
            state.connectionStatus = status;
            state.isConnected = status === 'connected';
          }),

        connect: (address, chainId) =>
          set((state) => {
            state.address = address;
            state.chainId = chainId;
            state.connectionStatus = 'connected';
            state.isConnected = true;
          }),

        disconnect: () =>
          set((state) => {
            state.address = null;
            state.chainId = null;
            state.balance = null;
            state.connectionStatus = 'disconnected';
            state.isConnected = false;
          }),

        updateBalance: (balance) =>
          set((state) => {
            state.balance = balance;
          }),
      })),
      {
        name: 'wallet-storage',
        partialize: (state) => ({
          address: state.address,
          chainId: state.chainId,
        }),
      }
    ),
    { name: 'WalletStore' }
  )
);

export const useWalletAddress = () => useWalletStore((state) => state.address);
export const useWalletChainId = () => useWalletStore((state) => state.chainId);
export const useWalletBalance = () => useWalletStore((state) => state.balance);
export const useWalletConnectionStatus = () => useWalletStore((state) => state.connectionStatus);
export const useIsWalletConnected = () => useWalletStore((state) => state.isConnected);

export const useWalletData = () =>
  useWalletStore((state) => ({
    address: state.address,
    chainId: state.chainId,
    balance: state.balance,
    connectionStatus: state.connectionStatus,
    isConnected: state.isConnected,
  }));
