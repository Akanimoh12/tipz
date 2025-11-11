import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { useAccount } from 'wagmi';
import { type Address } from 'viem';
import { useProfileRead, useProfileWrite } from './useContract';
import type { Profile } from '../services/contract.service';

const PROFILE_STALE_TIME = 5 * 60 * 1000; // 5 minutes

export const useProfile = (address?: Address) => {
  const { address: connectedAddress } = useAccount();
  const targetAddress = address || connectedAddress;

  const { 
    data: profile, 
    isLoading, 
    isError, 
    error, 
    refetch 
  } = useProfileRead<Profile>('getProfile', targetAddress ? [targetAddress] : undefined);

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
  return useQuery({
    queryKey: ['profile', 'username', username],
    queryFn: async () => {
      const { data } = useProfileRead<Profile>('getProfileByUsername', [username]);
      return data;
    },
    staleTime: PROFILE_STALE_TIME,
    enabled: !!username,
  });
};

export const useIsRegistered = (address?: Address) => {
  const { address: connectedAddress } = useAccount();
  const targetAddress = address || connectedAddress;

  const { 
    data: isRegistered, 
    isLoading 
  } = useProfileRead<boolean>('isRegistered', targetAddress ? [targetAddress] : undefined);

  return {
    isRegistered: isRegistered || false,
    isLoading,
  };
};

export const useRegisterProfile = () => {
  const queryClient = useQueryClient();
  const { address } = useAccount();

  return useMutation({
    mutationFn: async (params: {
      username: string;
      xFollowers: number;
      xPosts: number;
      xReplies: number;
      profileImageIpfs: string;
    }) => {
      const { writeAsync } = useProfileWrite('registerProfile', [
        params.username,
        params.xFollowers,
        params.xPosts,
        params.xReplies,
        params.profileImageIpfs,
      ]);

      if (!writeAsync) {
        throw new Error('Write function not available');
      }

      return writeAsync();
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

  return useMutation({
    mutationFn: async (profileImageIpfs: string) => {
      const { writeAsync } = useProfileWrite('updateProfileMetadata', [profileImageIpfs]);

      if (!writeAsync) {
        throw new Error('Write function not available');
      }

      return writeAsync();
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

  return useMutation({
    mutationFn: async (params: {
      xFollowers: number;
      xPosts: number;
      xReplies: number;
    }) => {
      const { writeAsync } = useProfileWrite('updateXMetrics', [
        params.xFollowers,
        params.xPosts,
        params.xReplies,
      ]);

      if (!writeAsync) {
        throw new Error('Write function not available');
      }

      return writeAsync();
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

  return useMutation({
    mutationFn: async () => {
      const { writeAsync } = useProfileWrite('deactivateProfile');

      if (!writeAsync) {
        throw new Error('Write function not available');
      }

      return writeAsync();
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

  return useMutation({
    mutationFn: async () => {
      const { writeAsync } = useProfileWrite('reactivateProfile');

      if (!writeAsync) {
        throw new Error('Write function not available');
      }

      return writeAsync();
    },
    onSuccess: () => {
      if (address) {
        queryClient.invalidateQueries({ queryKey: ['profile', address] });
      }
    },
  });
};
