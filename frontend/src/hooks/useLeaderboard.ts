import { useReadContract } from 'wagmi';
import { type Address } from 'viem';
import { CONTRACT_ADDRESSES, TIPZ_CORE_ABI, TIPZ_PROFILE_ABI, type LeaderboardEntry as ContractLeaderboardEntry } from '../services/contract.service';

export interface LeaderboardEntry {
  rank: number;
  username: string;
  profileImage?: string;
  totalAmount: bigint;
  count: number;
  creditScore?: number;
  walletAddress: Address;
}

// Transform contract leaderboard entry to our interface
const transformLeaderboardEntry = (entry: ContractLeaderboardEntry, index: number): LeaderboardEntry => {
  return {
    rank: Number(entry.rank || BigInt(index + 1)),
    username: entry.username,
    profileImage: undefined, // Will need to fetch separately if needed
    totalAmount: entry.totalAmount,
    count: Number(entry.count),
    creditScore: Number(entry.creditScore),
    walletAddress: entry.walletAddress,
  };
};

/**
 * Hook to get top creators by tips received
 */
export const useTopCreators = (limit: number = 50) => {
  const { 
    data: rawCreators, 
    isLoading,
    error,
    refetch 
  } = useReadContract({
    address: CONTRACT_ADDRESSES.tipzCore,
    abi: TIPZ_CORE_ABI,
    functionName: 'getTopCreators',
    args: [BigInt(limit)],
  });

  // Debug logging
  console.log('[useTopCreators Debug]', {
    rawCreators,
    isLoading,
    error,
    contractAddress: CONTRACT_ADDRESSES.tipzCore,
    limit,
  });

  const creators = rawCreators 
    ? (rawCreators as ContractLeaderboardEntry[]).map((entry, index) => transformLeaderboardEntry(entry, index))
    : [];

  return {
    creators,
    isLoading,
    refetch,
  };
};

/**
 * Hook to get top tippers by tips sent
 */
export const useTopTippers = (limit: number = 50) => {
  const { 
    data: rawTippers, 
    isLoading, 
    refetch 
  } = useReadContract({
    address: CONTRACT_ADDRESSES.tipzCore,
    abi: TIPZ_CORE_ABI,
    functionName: 'getTopTippers',
    args: [BigInt(limit)],
  });

  const tippers = rawTippers 
    ? (rawTippers as ContractLeaderboardEntry[]).map((entry, index) => transformLeaderboardEntry(entry, index))
    : [];

  return {
    tippers,
    isLoading,
    refetch,
  };
};

/**
 * Hook to get user's leaderboard position
 */
export const useUserRank = (username: string) => {
  const { 
    data: rank, 
    isLoading 
  } = useReadContract({
    address: CONTRACT_ADDRESSES.tipzCore,
    abi: TIPZ_CORE_ABI,
    functionName: 'getUserRank',
    args: username ? [username] : undefined,
    query: {
      enabled: !!username,
    },
  });

  return {
    rank: rank ? Number(rank) : 0,
    isLoading,
  };
};

/**
 * Hook to get all registered users (for debugging/admin purposes)
 * Shows all users regardless of tip activity
 */
export const useAllRegisteredUsers = () => {
  const { 
    data: totalRegistrations, 
    isLoading: loadingTotal,
    error,
    isError
  } = useReadContract({
    address: CONTRACT_ADDRESSES.tipzProfile,
    abi: TIPZ_PROFILE_ABI,
    functionName: 'getTotalRegistrations',
  });

  console.log('[useAllRegisteredUsers Debug]', {
    totalRegistrations: totalRegistrations ? Number(totalRegistrations) : 0,
    loadingTotal,
    isError,
    error: error ? (error as Error).message : null,
    contractAddress: CONTRACT_ADDRESSES.tipzProfile,
  });

  // Return 0 if there's an error
  return {
    totalRegistrations: (isError || !totalRegistrations) ? 0 : Number(totalRegistrations),
    isLoading: loadingTotal,
    error,
  };
};
