import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAccount } from 'wagmi';
import toast from 'react-hot-toast';
import { type Address } from 'viem';
import { useTipzCoreWrite, useTipzCoreRead } from './useContract';
import { 
  parseTipAmount, 
  formatTipAmount, 
  calculateRecipientAmount,
  type TipRecord 
} from '../services/contract.service';

export const useWithdrawableBalance = (address?: Address) => {
  const { address: connectedAddress } = useAccount();
  const targetAddress = address || connectedAddress;

  const { 
    data: balance, 
    isLoading, 
    refetch 
  } = useTipzCoreRead<bigint>('getWithdrawableBalance', targetAddress ? [targetAddress] : undefined);

  return {
    balance: balance || 0n,
    balanceFormatted: balance ? formatTipAmount(balance) : '0',
    isLoading,
    refetch,
  };
};

export const useSendTip = () => {
  const queryClient = useQueryClient();
  const { address } = useAccount();

  return useMutation({
    mutationFn: async (params: {
      toUsername: string;
      amount: string;
      message: string;
    }) => {
      const amountWei = parseTipAmount(params.amount);
      const recipientAmount = calculateRecipientAmount(amountWei);

      const { writeAsync } = useTipzCoreWrite(
        'sendTip',
        [params.toUsername, params.message],
        amountWei
      );

      if (!writeAsync) {
        throw new Error('Write function not available');
      }

      const hash = await writeAsync();

      return { 
        hash, 
        amount: params.amount, 
        recipientAmount: formatTipAmount(recipientAmount),
        toUsername: params.toUsername 
      };
    },
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey: ['withdrawableBalance'] });

      const previousBalance = queryClient.getQueryData<bigint>(['withdrawableBalance', address]);

      if (previousBalance && address) {
        const amountWei = parseTipAmount(variables.amount);
        queryClient.setQueryData<bigint>(
          ['withdrawableBalance', address],
          previousBalance - amountWei
        );
      }

      return { previousBalance };
    },
    onError: (error, _variables, context) => {
      if (context?.previousBalance && address) {
        queryClient.setQueryData(['withdrawableBalance', address], context.previousBalance);
      }

      const errorMessage = error instanceof Error ? error.message : 'Failed to send tip';
      toast.error(errorMessage);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['withdrawableBalance'] });
      queryClient.invalidateQueries({ queryKey: ['tipHistory'] });
      queryClient.invalidateQueries({ queryKey: ['tipsSent'] });
      queryClient.invalidateQueries({ queryKey: ['tipsReceived'] });
      queryClient.invalidateQueries({ queryKey: ['profile'] });

      toast.success(
        `Successfully tipped ${data.recipientAmount} ETH to @${data.toUsername}!`,
        { duration: 5000 }
      );
    },
  });
};

export const useWithdrawTips = () => {
  const queryClient = useQueryClient();
  const { address } = useAccount();

  return useMutation({
    mutationFn: async (amount: string) => {
      const amountWei = parseTipAmount(amount);

      const { writeAsync } = useTipzCoreWrite('withdrawTips', [amountWei]);

      if (!writeAsync) {
        throw new Error('Write function not available');
      }

      const hash = await writeAsync();

      return { hash, amount };
    },
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey: ['withdrawableBalance'] });

      const previousBalance = queryClient.getQueryData<bigint>(['withdrawableBalance', address]);

      if (previousBalance && address) {
        const amountWei = parseTipAmount(variables);
        queryClient.setQueryData<bigint>(
          ['withdrawableBalance', address],
          previousBalance - amountWei
        );
      }

      return { previousBalance };
    },
    onError: (error, _variables, context) => {
      if (context?.previousBalance && address) {
        queryClient.setQueryData(['withdrawableBalance', address], context.previousBalance);
      }

      const errorMessage = error instanceof Error ? error.message : 'Failed to withdraw tips';
      toast.error(errorMessage);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['withdrawableBalance'] });
      queryClient.invalidateQueries({ queryKey: ['profile'] });

      toast.success(`Successfully withdrew ${data.amount} ETH!`, { duration: 5000 });
    },
  });
};

export const useWithdrawAllTips = () => {
  const queryClient = useQueryClient();
  const { address } = useAccount();

  return useMutation({
    mutationFn: async () => {
      const { writeAsync } = useTipzCoreWrite('withdrawAllTips');

      if (!writeAsync) {
        throw new Error('Write function not available');
      }

      const hash = await writeAsync();

      return { hash };
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['withdrawableBalance'] });

      const previousBalance = queryClient.getQueryData<bigint>(['withdrawableBalance', address]);

      if (address) {
        queryClient.setQueryData<bigint>(['withdrawableBalance', address], 0n);
      }

      return { previousBalance };
    },
    onError: (error, _variables, context) => {
      if (context?.previousBalance && address) {
        queryClient.setQueryData(['withdrawableBalance', address], context.previousBalance);
      }

      const errorMessage = error instanceof Error ? error.message : 'Failed to withdraw tips';
      toast.error(errorMessage);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['withdrawableBalance'] });
      queryClient.invalidateQueries({ queryKey: ['profile'] });

      toast.success('Successfully withdrew all tips!', { duration: 5000 });
    },
  });
};

export const useTipHistory = (address?: Address, limit: number = 0) => {
  const { address: connectedAddress } = useAccount();
  const targetAddress = address || connectedAddress;

  const { 
    data: history, 
    isLoading, 
    refetch 
  } = useTipzCoreRead<TipRecord[]>(
    'getTipHistory', 
    targetAddress ? [targetAddress, limit] : undefined
  );

  return {
    history: history || [],
    isLoading,
    refetch,
  };
};

export const useTipsSent = (address?: Address, limit: number = 0) => {
  const { address: connectedAddress } = useAccount();
  const targetAddress = address || connectedAddress;

  const { 
    data: tipsSent, 
    isLoading, 
    refetch 
  } = useTipzCoreRead<TipRecord[]>(
    'getTipsSent', 
    targetAddress ? [targetAddress, limit] : undefined
  );

  return {
    tipsSent: tipsSent || [],
    isLoading,
    refetch,
  };
};

export const useTipsReceived = (username: string, limit: number = 0) => {
  const { 
    data: tipsReceived, 
    isLoading, 
    refetch 
  } = useTipzCoreRead<TipRecord[]>(
    'getTipsReceived', 
    username ? [username, limit] : undefined
  );

  return {
    tipsReceived: tipsReceived || [],
    isLoading,
    refetch,
  };
};

export const useRecentTips = (limit: number = 10) => {
  const { 
    data: recentTips, 
    isLoading, 
    refetch 
  } = useTipzCoreRead<TipRecord[]>('getRecentTips', [limit]);

  return {
    recentTips: recentTips || [],
    isLoading,
    refetch,
  };
};

export const useTipById = (tipId: bigint) => {
  const { 
    data: tip, 
    isLoading, 
    refetch 
  } = useTipzCoreRead<TipRecord>('getTipById', tipId ? [tipId] : undefined);

  return {
    tip,
    isLoading,
    refetch,
  };
};

export const useTotalTipCount = () => {
  const { 
    data: count, 
    isLoading, 
    refetch 
  } = useTipzCoreRead<bigint>('getTotalTipCount');

  return {
    count: count || 0n,
    countNumber: count ? Number(count) : 0,
    isLoading,
    refetch,
  };
};
