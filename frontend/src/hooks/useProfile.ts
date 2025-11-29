import { useQueryClient, useMutation } from '@tanstack/react-query';
import { useAccount, useReadContract } from 'wagmi';
import { type Address } from 'viem';
import { useProfileWrite } from './useContract';
import { CONTRACT_ADDRESSES, TIPZ_PROFILE_ABI, transformProfile } from '../services/contract.service';
import { DEFAULT_CHAIN } from '../config/somnia.config';

const PROFILE_STALE_TIME = 5 * 60 * 1000; // 5 minutes

export const useProfile = (address?: Address) => {
  const { address: connectedAddress } = useAccount();
  const targetAddress = address || connectedAddress;

  const { 
    data: rawProfile, 
    isLoading, 
    isError, 
    error, 
    refetch 
  } = useReadContract({
    address: CONTRACT_ADDRESSES.tipzProfile,
    abi: TIPZ_PROFILE_ABI,
    functionName: 'getProfile',
    args: targetAddress ? [targetAddress] : undefined,
    chainId: DEFAULT_CHAIN.id,
    query: {
      enabled: !!targetAddress,
      staleTime: PROFILE_STALE_TIME,
    },
  });

  const profile = rawProfile ? transformProfile(rawProfile) : undefined;

  console.log('[useProfile Debug]', {
    targetAddress,
    rawProfile,
    profile,
    isLoading,
    isError,
    error: error ? (error as Error).message : null,
    contractAddress: CONTRACT_ADDRESSES.tipzProfile,
  });

  return {
    profile,
    isLoading,
    isError,
    error,
    refetch,
    isRegistered: profile?.isActive || false,
  };
};

export const useProfileByUsername = (username: string) => {
  const { 
    data: rawProfile, 
    isLoading, 
    isError, 
    error, 
    refetch 
  } = useReadContract({
    address: CONTRACT_ADDRESSES.tipzProfile,
    abi: TIPZ_PROFILE_ABI,
    functionName: 'getProfileByUsername',
    args: username ? [username] : undefined,
    chainId: DEFAULT_CHAIN.id,
    query: {
      enabled: !!username,
      staleTime: PROFILE_STALE_TIME,
    },
  });

  const profile = rawProfile ? transformProfile(rawProfile) : undefined;

  console.log('[useProfileByUsername Debug]', {
    username,
    rawProfile,
    profile,
    isLoading,
    isError,
    error: error ? (error as Error).message : null,
    contractAddress: CONTRACT_ADDRESSES.tipzProfile,
  });

  return {
    profile,
    isLoading,
    isError,
    error,
    refetch,
  };
};

export const useIsRegistered = (address?: Address) => {
  const { address: connectedAddress } = useAccount();
  const targetAddress = address || connectedAddress;

  const { 
    data: isRegistered, 
    isLoading 
  } = useReadContract({
    address: CONTRACT_ADDRESSES.tipzProfile,
    abi: TIPZ_PROFILE_ABI,
    functionName: 'isRegistered',
    args: targetAddress ? [targetAddress] : undefined,
    chainId: DEFAULT_CHAIN.id,
    query: {
      enabled: !!targetAddress,
    },
  });

  return {
    isRegistered: isRegistered || false,
    isLoading,
  };
};

export const useIsUsernameTaken = (username: string) => {
  const { 
    data: isTaken, 
    isLoading,
    refetch
  } = useReadContract({
    address: CONTRACT_ADDRESSES.tipzProfile,
    abi: TIPZ_PROFILE_ABI,
    functionName: 'isUsernameTaken',
    args: username ? [username] : undefined,
    chainId: DEFAULT_CHAIN.id,
    query: {
      enabled: !!username && username.length >= 1,
      staleTime: 0, // Always check fresh
    },
  });

  return {
    isTaken: isTaken || false,
    isLoading,
    refetch,
  };
};

export const useRegisterProfile = () => {
  const queryClient = useQueryClient();
  const { address } = useAccount();
  const registerProfileWrite = useProfileWrite('registerProfile');

  return useMutation({
    mutationFn: async (params: {
      username: string;
      xFollowers: number;
      xPosts: number;
      xReplies: number;
      profileImageIpfs: string;
    }) => {
      if (!registerProfileWrite.writeAsync) {
        throw new Error('Write function not available');
      }

      return registerProfileWrite.writeAsync({
        args: [
          params.username,
          params.xFollowers,
          params.xPosts,
          params.xReplies,
          params.profileImageIpfs,
        ],
      });
    },
    onSuccess: () => {
      if (address) {
        queryClient.invalidateQueries({ queryKey: ['profile', address] });
        queryClient.invalidateQueries({ queryKey: ['isRegistered', address] });
      }
    },
  });
};

export const useUpdateProfileMetadata = () => {
  const queryClient = useQueryClient();
  const { address } = useAccount();
  const updateProfileMetadataWrite = useProfileWrite('updateProfileMetadata');

  return useMutation({
    mutationFn: async (profileImageIpfs: string) => {
      if (!updateProfileMetadataWrite.writeAsync) {
        throw new Error('Write function not available');
      }

      return updateProfileMetadataWrite.writeAsync({
        args: [profileImageIpfs],
      });
    },
    onSuccess: () => {
      if (address) {
        queryClient.invalidateQueries({ queryKey: ['profile', address] });
      }
    },
  });
};

export const useUpdateXMetrics = () => {
  const queryClient = useQueryClient();
  const { address } = useAccount();
  const updateXMetricsWrite = useProfileWrite('updateXMetrics');

  return useMutation({
    mutationFn: async (params: {
      xFollowers: number;
      xPosts: number;
      xReplies: number;
    }) => {
      if (!updateXMetricsWrite.writeAsync) {
        throw new Error('Write function not available');
      }

      return updateXMetricsWrite.writeAsync({
        args: [
          params.xFollowers,
          params.xPosts,
          params.xReplies,
        ],
      });
    },
    onSuccess: () => {
      if (address) {
        queryClient.invalidateQueries({ queryKey: ['profile', address] });
      }
    },
  });
};

export const useDeactivateProfile = () => {
  const queryClient = useQueryClient();
  const { address } = useAccount();
  const deactivateProfileWrite = useProfileWrite('deactivateProfile');

  return useMutation({
    mutationFn: async () => {
      if (!deactivateProfileWrite.writeAsync) {
        throw new Error('Write function not available');
      }

      return deactivateProfileWrite.writeAsync();
    },
    onSuccess: () => {
      if (address) {
        queryClient.invalidateQueries({ queryKey: ['profile', address] });
      }
    },
  });
};

export const useReactivateProfile = () => {
  const queryClient = useQueryClient();
  const { address } = useAccount();
  const reactivateProfileWrite = useProfileWrite('reactivateProfile');

  return useMutation({
    mutationFn: async () => {
      if (!reactivateProfileWrite.writeAsync) {
        throw new Error('Write function not available');
      }

      return reactivateProfileWrite.writeAsync();
    },
    onSuccess: () => {
      if (address) {
        queryClient.invalidateQueries({ queryKey: ['profile', address] });
      }
    },
  });
};
