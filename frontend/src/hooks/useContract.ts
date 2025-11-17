import { 
  useReadContract, 
  useWriteContract, 
  useWaitForTransactionReceipt
} from 'wagmi';
import { 
  CONTRACT_ADDRESSES, 
  TIPZ_PROFILE_ABI, 
  TIPZ_CORE_ABI,
  parseContractError 
} from '../services/contract.service';

export interface UseContractReadResult<T> {
  data: T | undefined;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => void;
}

export interface UseContractWriteResult {
  write: (() => void) | undefined;
  writeAsync: (() => Promise<`0x${string}`>) | undefined;
  data: `0x${string}` | undefined;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  isPending: boolean;
  isSuccess: boolean;
}

export const useProfileRead = <T,>(
  functionName: string,
  args?: unknown[]
): UseContractReadResult<T> => {
  const { data, isLoading, isError, error, refetch } = useReadContract({
    address: CONTRACT_ADDRESSES.tipzProfile,
    abi: TIPZ_PROFILE_ABI,
    functionName,
    args,
  });

  return {
    data: data as T | undefined,
    isLoading,
    isError,
    error: error ? new Error(parseContractError(error)) : null,
    refetch: () => { void refetch(); },
  };
};

export const useTipzCoreRead = <T,>(
  functionName: string,
  args?: unknown[]
): UseContractReadResult<T> => {
  const { data, isLoading, isError, error, refetch } = useReadContract({
    address: CONTRACT_ADDRESSES.tipzCore,
    abi: TIPZ_CORE_ABI,
    functionName,
    args,
  });

  return {
    data: data as T | undefined,
    isLoading,
    isError,
    error: error ? new Error(parseContractError(error)) : null,
    refetch: () => { void refetch(); },
  };
};

export const useProfileWrite = (
  functionName: string,
  args?: unknown[],
  value?: bigint
) => {
  const { 
    data: hash, 
    writeContract, 
    isPending,
    isError: isWriteError,
    error: writeError 
  } = useWriteContract();

  const { 
    isLoading: isConfirming,
    isSuccess,
    isError: isConfirmError,
    error: confirmError
  } = useWaitForTransactionReceipt({
    hash,
  });

  const write = writeContract ? () => {
    writeContract({
      address: CONTRACT_ADDRESSES.tipzProfile,
      abi: TIPZ_PROFILE_ABI,
      functionName,
      args: args || [],
      value,
    });
  } : undefined;

  const writeAsync = writeContract ? async () => {
    return writeContract({
      address: CONTRACT_ADDRESSES.tipzProfile,
      abi: TIPZ_PROFILE_ABI,
      functionName,
      args: args || [],
      value,
    });
  } : undefined;

  const error = writeError ?? confirmError;
  const isLoading = isPending || isConfirming;

  return {
    write,
    writeAsync,
    data: hash,
    isLoading,
    isError: isWriteError || isConfirmError,
    error: error ? new Error(parseContractError(error)) : null,
    isPending,
    isSuccess,
  };
};

export const useTipzCoreWrite = (
  functionName: string,
  args?: unknown[],
  value?: bigint
) => {
  const { 
    data: hash, 
    writeContract, 
    isPending,
    isError: isWriteError,
    error: writeError 
  } = useWriteContract();

  const { 
    isLoading: isConfirming,
    isSuccess,
    isError: isConfirmError,
    error: confirmError
  } = useWaitForTransactionReceipt({
    hash,
  });

  const write = writeContract ? () => {
    writeContract({
      address: CONTRACT_ADDRESSES.tipzCore,
      abi: TIPZ_CORE_ABI,
      functionName,
      args: args || [],
      value,
    });
  } : undefined;

  const writeAsync = writeContract ? async () => {
    return writeContract({
      address: CONTRACT_ADDRESSES.tipzCore,
      abi: TIPZ_CORE_ABI,
      functionName,
      args: args || [],
      value,
    });
  } : undefined;

  const error = writeError ?? confirmError;
  const isLoading = isPending || isConfirming;

  return {
    write,
    writeAsync,
    data: hash,
    isLoading,
    isError: isWriteError || isConfirmError,
    error: error ? new Error(parseContractError(error)) : null,
    isPending,
    isSuccess,
  };
};
