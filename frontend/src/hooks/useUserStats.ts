import { useAccount, useReadContract } from 'wagmi';
import { type Address } from 'viem';
import { useProfile } from './useProfile';
import { useWithdrawableBalance, useTipsSent } from './useTip';
import { CONTRACT_ADDRESSES, TIPZ_CORE_ABI } from '../services/contract.service';
import { DEFAULT_CHAIN } from '../config/somnia.config';

/**
 * Hook to get comprehensive user statistics
 */
export const useUserStats = (address?: Address) => {
  const { address: connectedAddress } = useAccount();
  const targetAddress = address || connectedAddress;

  const { profile, isLoading: profileLoading } = useProfile(targetAddress);
  const { balance, isLoading: balanceLoading } = useWithdrawableBalance(targetAddress);
  const { tipsSent, isLoading: sentLoading } = useTipsSent(targetAddress, 0);

  const isLoading = profileLoading || balanceLoading || sentLoading;

  // Get stats from profile (already loaded from contract)
  const totalReceived = profile?.totalTipsReceived || 0n;
  const tipsReceivedCount = profile?.totalTipsCount || 0n;

  // Calculate sent tips
  const totalSent = tipsSent.reduce((sum, tip) => sum + tip.amount, 0n);

  // Total tips count (sent + received)
  const tipsCount = tipsSent.length + Number(tipsReceivedCount);

  return {
    // Balance
    withdrawableBalance: balance,
    
    // Received stats (from profile)
    totalReceived,
    tipsReceivedCount: Number(tipsReceivedCount),
    
    // Sent stats
    totalSent,
    tipsSentCount: tipsSent.length,
    
    // Combined stats
    tipsCount,
    
    // Profile stats
    creditScore: profile?.creditScore || 0,
    
    // Loading state
    isLoading,
  };
};

/**
 * Hook to get platform-wide statistics from TipzCore contract
 */
export const usePlatformStats = (): {
  totalUsers: number;
  totalTips: number;
  totalVolume: bigint;
  activeCreators: number;
  isLoading: boolean;
} => {
  // Get total users
  const { data: totalUsers, isLoading: usersLoading } = useReadContract({
    address: CONTRACT_ADDRESSES.tipzCore,
    abi: TIPZ_CORE_ABI,
    functionName: 'getTotalUsers',
    chainId: DEFAULT_CHAIN.id,
  });

  // Get total volume
  const { data: totalVolume, isLoading: volumeLoading } = useReadContract({
    address: CONTRACT_ADDRESSES.tipzCore,
    abi: TIPZ_CORE_ABI,
    functionName: 'getTotalVolume',
    chainId: DEFAULT_CHAIN.id,
  });

  // Get active creators
  const { data: activeCreators, isLoading: creatorsLoading } = useReadContract({
    address: CONTRACT_ADDRESSES.tipzCore,
    abi: TIPZ_CORE_ABI,
    functionName: 'getActiveCreators',
    chainId: DEFAULT_CHAIN.id,
  });

  // Get total tip count
  const { data: totalTips, isLoading: tipsLoading } = useReadContract({
    address: CONTRACT_ADDRESSES.tipzCore,
    abi: TIPZ_CORE_ABI,
    functionName: 'getTotalTipCount',
    chainId: DEFAULT_CHAIN.id,
  });

  const isLoading = usersLoading || volumeLoading || creatorsLoading || tipsLoading;

  return {
    totalUsers: totalUsers ? Number(totalUsers) : 0,
    totalTips: totalTips ? Number(totalTips) : 0,
    totalVolume: (totalVolume as bigint | undefined) || 0n,
    activeCreators: activeCreators ? Number(activeCreators) : 0,
    isLoading,
  };
};
