import { useEffect, useMemo, useState } from 'react';
import { usePublicClient, useReadContract } from 'wagmi';
import { type Address } from 'viem';
import { CONTRACT_ADDRESSES, TIPZ_CORE_ABI, TIPZ_PROFILE_ABI, type LeaderboardEntry as ContractLeaderboardEntry, type Profile, transformProfile } from '../services/contract.service';
import { DEFAULT_CHAIN } from '../config/somnia.config';

export interface LeaderboardEntry {
  rank: number;
  username: string;
  profileImage?: string;
  totalAmount: bigint;
  count: number;
  creditScore?: number;
  walletAddress: Address;
}

export interface CreatorDirectoryEntry {
  username: string;
  walletAddress: Address;
  creditScore: number;
  followers: number;
  totalTipsCount: bigint;
  totalTipsReceived: bigint;
  profileImageIpfs?: string;
  createdAt: bigint;
  isActive: boolean;
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
    chainId: DEFAULT_CHAIN.id,
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
    chainId: DEFAULT_CHAIN.id,
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
    chainId: DEFAULT_CHAIN.id,
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
    chainId: DEFAULT_CHAIN.id,
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

const mapProfileToDirectoryEntry = (profile: Profile): CreatorDirectoryEntry => {
  return {
    username: profile.xUsername,
    walletAddress: profile.walletAddress,
    creditScore: profile.creditScore,
    followers: Number(profile.xFollowers),
    totalTipsCount: profile.totalTipsCount,
    totalTipsReceived: profile.totalTipsReceived,
    profileImageIpfs: profile.profileImageIpfs,
    createdAt: profile.createdAt,
    isActive: profile.isActive,
  };
};

interface CreatorDirectoryOptions {
  limit?: number;
  includeInactive?: boolean;
}

export const useCreatorDirectory = (
  totalRegistrations: number,
  options?: CreatorDirectoryOptions
) => {
  const limit = options?.limit ?? 50;
  const includeInactive = options?.includeInactive ?? false;
  const client = usePublicClient({ chainId: DEFAULT_CHAIN.id });

  const [creators, setCreators] = useState<CreatorDirectoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let cancelled = false;

    const fetchCreators = async () => {
      if (!client) {
        return;
      }

      if (!totalRegistrations) {
        if (!cancelled) {
          setCreators([]);
          setError(null);
        }
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const fetchCount = Math.min(totalRegistrations, limit);

        if (fetchCount <= 0) {
          if (!cancelled) {
            setCreators([]);
          }
          return;
        }

        const indices = Array.from({ length: fetchCount }, (_, index) =>
          BigInt(totalRegistrations - 1 - index)
        );

        const addresses = await Promise.all(
          indices.map((idx) =>
            client.readContract({
              address: CONTRACT_ADDRESSES.tipzProfile,
              abi: TIPZ_PROFILE_ABI,
              functionName: 'getRegisteredUserAtIndex',
              args: [idx],
            }) as Promise<Address>
          )
        );

        const uniqueAddresses = Array.from(new Set(addresses.filter(Boolean)));

        const profiles = await Promise.all(
          uniqueAddresses.map((address) =>
            client.readContract({
              address: CONTRACT_ADDRESSES.tipzProfile,
              abi: TIPZ_PROFILE_ABI,
              functionName: 'getProfile',
              args: [address],
            })
          )
        );

        const mapped = profiles
          .map((rawProfile) => mapProfileToDirectoryEntry(transformProfile(rawProfile)))
          .filter((entry) => entry.username && (includeInactive || entry.isActive));

        const sorted = mapped.sort((a, b) => {
          const diff = Number(b.createdAt - a.createdAt);
          if (diff !== 0) {
            return diff;
          }
          return a.username.localeCompare(b.username);
        });

        if (!cancelled) {
          setCreators(sorted);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err : new Error('Failed to load creators directory'));
          setCreators([]);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    void fetchCreators();

    return () => {
      cancelled = true;
    };
  }, [client, includeInactive, limit, totalRegistrations]);

  const summaries = useMemo(() => creators, [creators]);

  return {
    creators: summaries,
    isLoading,
    error,
  };
};
