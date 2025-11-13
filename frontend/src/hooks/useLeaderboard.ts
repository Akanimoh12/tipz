import { useTipzCoreRead } from './useContract';
import { type Address } from 'viem';

export interface LeaderboardEntry {
  rank: number;
  username: string;
  profileImage?: string;
  totalAmount: bigint;
  count: number;
  creditScore?: number;
  walletAddress: Address;
}

/**
 * Hook to get top creators by tips received
 */
export const useTopCreators = (limit: number = 50) => {
  // TODO: Add actual contract call when getTopCreators is implemented
  // For now, this is a placeholder that will need to be implemented in the contract
  
  const { 
    data: creators, 
    isLoading, 
    refetch 
  } = useTipzCoreRead<LeaderboardEntry[]>(
    'getTopCreators', 
    [limit]
  );

  return {
    creators: creators || [],
    isLoading,
    refetch,
  };
};

/**
 * Hook to get top tippers by tips sent
 */
export const useTopTippers = (limit: number = 50) => {
  // TODO: Add actual contract call when getTopTippers is implemented
  // For now, this is a placeholder that will need to be implemented in the contract
  
  const { 
    data: tippers, 
    isLoading, 
    refetch 
  } = useTipzCoreRead<LeaderboardEntry[]>(
    'getTopTippers', 
    [limit]
  );

  return {
    tippers: tippers || [],
    isLoading,
    refetch,
  };
};

/**
 * Hook to get user's leaderboard position
 */
export const useUserRank = (username: string) => {
  // TODO: Implement contract call to get user's rank
  const { 
    data: rank, 
    isLoading 
  } = useTipzCoreRead<number>(
    'getUserRank', 
    username ? [username] : undefined
  );

  return {
    rank: rank || 0,
    isLoading,
  };
};
