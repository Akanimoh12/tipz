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
import { DEFAULT_CHAIN } from '../config/somnia.config';

export interface UseContractReadResult<T> {
  data: T | undefined;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => void;
}

type ContractWriteOverrides = {
  args?: readonly unknown[];
  value?: bigint;
};

export interface UseContractWriteResult {
  write: ((overrides?: ContractWriteOverrides) => void) | undefined;
  writeAsync: ((overrides?: ContractWriteOverrides) => Promise<`0x${string}`>) | undefined;
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
    chainId: DEFAULT_CHAIN.id,
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
    chainId: DEFAULT_CHAIN.id,
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
    writeContractAsync,
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

  const write = writeContract
    ? (overrides?: ContractWriteOverrides) => {
        writeContract({
          address: CONTRACT_ADDRESSES.tipzProfile,
          abi: TIPZ_PROFILE_ABI,
          functionName,
          args: (overrides?.args ?? args ?? []) as readonly unknown[],
          value: overrides?.value ?? value,
          chainId: DEFAULT_CHAIN.id,
        });
      }
    : undefined;

  const writeAsync = writeContractAsync
    ? async (overrides?: ContractWriteOverrides) => {
        return writeContractAsync({
          address: CONTRACT_ADDRESSES.tipzProfile,
          abi: TIPZ_PROFILE_ABI,
          functionName,
          args: (overrides?.args ?? args ?? []) as readonly unknown[],
          value: overrides?.value ?? value,
          chainId: DEFAULT_CHAIN.id,
        });
      }
    : undefined;

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
    writeContractAsync,
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

  const write = writeContract
    ? (overrides?: ContractWriteOverrides) => {
        writeContract({
          address: CONTRACT_ADDRESSES.tipzCore,
          abi: TIPZ_CORE_ABI,
          functionName,
          args: (overrides?.args ?? args ?? []) as readonly unknown[],
          value: overrides?.value ?? value,
          chainId: DEFAULT_CHAIN.id,
        });
      }
    : undefined;

  const writeAsync = writeContractAsync
    ? async (overrides?: ContractWriteOverrides) => {
        return writeContractAsync({
          address: CONTRACT_ADDRESSES.tipzCore,
          abi: TIPZ_CORE_ABI,
          functionName,
          args: (overrides?.args ?? args ?? []) as readonly unknown[],
          value: overrides?.value ?? value,
          chainId: DEFAULT_CHAIN.id,
        });
      }
    : undefined;

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
