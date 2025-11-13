import { useAccount } from 'wagmi';
import { type Address } from 'viem';
import { useProfile } from './useProfile';
import { useWithdrawableBalance, useTipHistory, useTipsSent } from './useTip';

/**
 * Hook to get comprehensive user statistics
 */
export const useUserStats = (address?: Address) => {
  const { address: connectedAddress } = useAccount();
  const targetAddress = address || connectedAddress;

  const { profile, isLoading: profileLoading } = useProfile(targetAddress);
  const { balance, isLoading: balanceLoading } = useWithdrawableBalance(targetAddress);
  const { history, isLoading: historyLoading } = useTipHistory(targetAddress, 0);
  const { tipsSent, isLoading: sentLoading } = useTipsSent(targetAddress, 0);

  const isLoading = profileLoading || balanceLoading || historyLoading || sentLoading;

  // Calculate received tips
  const tipsReceived = history.filter((tip) => tip.toUsername === profile?.xUsername);
  const totalReceived = tipsReceived.reduce((sum, tip) => sum + tip.amount, 0n);

  // Calculate sent tips
  const totalSent = tipsSent.reduce((sum, tip) => sum + tip.amount, 0n);

  // Total tips count (sent + received)
  const tipsCount = history.length;

  return {
    // Balance
    withdrawableBalance: balance,
    
    // Received stats
    totalReceived,
    tipsReceivedCount: tipsReceived.length,
    
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
 * Hook to get platform-wide statistics
 */
export const usePlatformStats = () => {
  // TODO: Add platform-wide contract reads when available
  // For now, return placeholder structure
  return {
    totalUsers: 0,
    totalTips: 0,
    totalVolume: 0n,
    activeCreators: 0,
    isLoading: false,
  };
};
