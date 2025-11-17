import { parseEther, formatEther, type Address } from 'viem';
import TipzProfileABI from '../../../contract/out/TipzProfile.sol/TipzProfile.json';
import TipzCoreABI from '../../../contract/out/TipzCore.sol/TipzCore.json';

export const TIPZ_PROFILE_ABI = TipzProfileABI.abi;
export const TIPZ_CORE_ABI = TipzCoreABI.abi;

export const CONTRACT_ADDRESSES = {
  tipzProfile: (import.meta.env.VITE_TIPZ_PROFILE_ADDRESS as Address) || '0x',
  tipzCore: (import.meta.env.VITE_TIPZ_CORE_ADDRESS as Address) || '0x',
} as const;

// Profile structure matching TipzProfile.sol contract
export interface Profile {
  walletAddress: Address;
  xUsername: string;
  xFollowers: bigint;
  xPosts: bigint;
  xReplies: bigint;
  creditScore: number;
  profileImageIpfs: string;
  totalTipsReceived: bigint;
  totalTipsCount: bigint;
  withdrawableBalance: bigint;
  totalWithdrawn: bigint;
  createdAt: bigint;
  isActive: boolean;
}

// Leaderboard entry from TipzCore.sol
export interface LeaderboardEntry {
  username: string;
  walletAddress: Address;
  totalAmount: bigint;
  count: bigint;
  creditScore: bigint;
  rank: bigint;
}

// Tip record structure from TipzCore.sol
export interface TipRecord {
  id: bigint;
  fromAddress: Address;
  fromUsername: string;
  toUsername: string;
  amount: bigint;
  message: string;
  timestamp: bigint;
}

// Helper to transform contract profile to our interface
export const transformProfile = (contractProfile: any): Profile => {
  return {
    walletAddress: contractProfile.walletAddress as Address,
    xUsername: contractProfile.xUsername as string,
    xFollowers: BigInt(contractProfile.xFollowers?.toString() || '0'),
    xPosts: BigInt(contractProfile.xPosts?.toString() || '0'),
    xReplies: BigInt(contractProfile.xReplies?.toString() || '0'),
    creditScore: Number(contractProfile.creditScore || 0),
    profileImageIpfs: contractProfile.profileImageIpfs as string,
    totalTipsReceived: BigInt(contractProfile.totalTipsReceived?.toString() || '0'),
    totalTipsCount: BigInt(contractProfile.totalTipsCount?.toString() || '0'),
    withdrawableBalance: BigInt(contractProfile.withdrawableBalance?.toString() || '0'),
    totalWithdrawn: BigInt(contractProfile.totalWithdrawn?.toString() || '0'),
    createdAt: BigInt(contractProfile.createdAt?.toString() || '0'),
    isActive: Boolean(contractProfile.isActive),
  };
};

const ERROR_MESSAGES: Record<string, string> = {
  'RecipientNotRegistered': 'Recipient is not registered on Tipz',
  'TipAmountTooLow': 'Tip amount is below minimum (0.001 STT)',
  'SelfTipNotAllowed': 'You cannot tip yourself',
  'WithdrawalAmountZero': 'Withdrawal amount must be greater than zero',
  'WithdrawalAmountExceedsBalance': 'Insufficient balance for withdrawal',
  'InsufficientBalance': 'Insufficient balance in contract',
  'TransferFailed': 'Transfer failed - please try again',
  'UsernameAlreadyTaken': 'Username is already taken',
  'InvalidUsername': 'Invalid username format',
  'UserAlreadyRegistered': 'This address is already registered',
  'User denied transaction': 'Transaction cancelled by user',
  'insufficient funds': 'Insufficient funds for transaction',
};

const findErrorMessage = (message: string): string | null => {
  const errorKey = Object.keys(ERROR_MESSAGES).find(key => message.includes(key));
  return errorKey ? ERROR_MESSAGES[errorKey] : null;
};

export const parseContractError = (error: unknown): string => {
  if (!(error instanceof Error)) {
    return 'An unknown error occurred';
  }

  const customMessage = findErrorMessage(error.message);
  return customMessage || error.message;
};

export const formatTipAmount = (amount: bigint): string => {
  return formatEther(amount);
};

export const parseTipAmount = (amount: string): bigint => {
  return parseEther(amount);
};

export const calculatePlatformFee = (amount: bigint): bigint => {
  return (amount * 200n) / 10000n;
};

export const calculateRecipientAmount = (amount: bigint): bigint => {
  return amount - calculatePlatformFee(amount);
};

export const formatTimestamp = (timestamp: bigint): Date => {
  return new Date(Number(timestamp) * 1000);
};
