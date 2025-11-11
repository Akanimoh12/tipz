import { ConnectButton } from '@rainbow-me/rainbowkit';
import { Wallet } from 'lucide-react';
import { Button } from '@/components/atoms/Button';
import { cn } from '@/utils/cn';

interface WalletButtonProps {
  variant?: 'primary' | 'secondary' | 'ghost' | 'brand';
  size?: 'sm' | 'md' | 'lg';
  showBalance?: boolean;
  showNetwork?: boolean;
  className?: string;
}

export function WalletButton({
  variant = 'brand',
  size = 'md',
  showBalance = true,
  showNetwork = false,
  className,
}: Readonly<WalletButtonProps>) {
  return (
    <ConnectButton.Custom>
      {({
        account,
        chain,
        openAccountModal,
        openChainModal,
        openConnectModal,
        authenticationStatus,
        mounted,
      }) => {
        const ready = mounted && authenticationStatus !== 'loading';
        const connected =
          ready &&
          account &&
          chain &&
          (!authenticationStatus || authenticationStatus === 'authenticated');

        return (
          <div
            {...(!ready && {
              'aria-hidden': true,
              style: {
                opacity: 0,
                pointerEvents: 'none',
                userSelect: 'none',
              },
            })}
            className={className}
          >
            {(() => {
              if (!connected) {
                return (
                  <Button onClick={openConnectModal} variant={variant} size={size}>
                    <Wallet className="w-4 h-4 mr-2xs" />
                    Connect Wallet
                  </Button>
                );
              }

              if (chain.unsupported) {
                return (
                  <Button onClick={openChainModal} variant="primary" size={size}>
                    Wrong network
                  </Button>
                );
              }

              return (
                <div className="flex gap-xs">
                  {showNetwork && (
                    <button
                      onClick={openChainModal}
                      className={cn(
                        'inline-flex items-center gap-2xs px-sm py-xs',
                        'bg-secondary border-3 border-primary rounded-brutalist',
                        'hover:bg-accent transition-colors',
                        'text-body-sm font-medium'
                      )}
                      type="button"
                    >
                      {chain.hasIcon && (
                        <div
                          className="w-4 h-4 rounded-full overflow-hidden"
                          style={{
                            background: chain.iconBackground,
                          }}
                        >
                          {chain.iconUrl && (
                            <img
                              alt={chain.name ?? 'Chain icon'}
                              src={chain.iconUrl}
                              className="w-4 h-4"
                            />
                          )}
                        </div>
                      )}
                      {chain.name}
                    </button>
                  )}

                  <button
                    onClick={openAccountModal}
                    className={cn(
                      'inline-flex items-center gap-2xs px-sm py-xs',
                      'bg-secondary border-3 border-primary rounded-brutalist shadow-brutalist',
                      'hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none',
                      'transition-all duration-150',
                      'text-body-sm font-medium'
                    )}
                    type="button"
                  >
                    <Wallet className="w-4 h-4" />
                    {account.displayName}
                    {showBalance && account.displayBalance && (
                      <span className="text-primary/70">
                        {account.displayBalance}
                      </span>
                    )}
                  </button>
                </div>
              );
            })()}
          </div>
        );
      }}
    </ConnectButton.Custom>
  );
}
