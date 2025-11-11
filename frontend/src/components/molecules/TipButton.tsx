import { useState, type ButtonHTMLAttributes } from 'react';
import { Zap, Loader2 } from 'lucide-react';
import { Button } from '@/components/atoms/Button';
import { Input } from '@/components/atoms/Input';
import { cn } from '@/utils/cn';

interface TipButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'onClick'> {
  onTip: (amount: string) => void;
  isLoading?: boolean;
  suggestedAmounts?: string[];
  minAmount?: string;
  maxAmount?: string;
  inline?: boolean;
}

export function TipButton({
  onTip,
  isLoading = false,
  suggestedAmounts = ['0.001', '0.01', '0.1'],
  minAmount = '0.001',
  maxAmount,
  inline = false,
  className,
  disabled,
  ...props
}: Readonly<TipButtonProps>) {
  const [amount, setAmount] = useState('');
  const [showInput, setShowInput] = useState(false);
  const [error, setError] = useState('');

  const validateAmount = (value: string): boolean => {
    const numValue = Number.parseFloat(value);

    if (Number.isNaN(numValue) || numValue <= 0) {
      setError('Please enter a valid amount');
      return false;
    }

    if (minAmount && numValue < Number.parseFloat(minAmount)) {
      setError(`Minimum amount is ${minAmount} ETH`);
      return false;
    }

    if (maxAmount && numValue > Number.parseFloat(maxAmount)) {
      setError(`Maximum amount is ${maxAmount} ETH`);
      return false;
    }

    setError('');
    return true;
  };

  const handleTip = () => {
    if (validateAmount(amount)) {
      onTip(amount);
      setAmount('');
      setShowInput(false);
    }
  };

  const handleSuggestedAmount = (suggested: string) => {
    setAmount(suggested);
    setError('');
    onTip(suggested);
  };

  if (inline) {
    return (
      <div className={cn('flex gap-xs items-start', className)}>
        <div className="flex-1">
          <Input
            type="number"
            step="0.001"
            min={minAmount}
            max={maxAmount}
            value={amount}
            onChange={(e) => {
              setAmount(e.target.value);
              setError('');
            }}
            placeholder="0.001"
            error={error}
            className="text-center"
            disabled={disabled || isLoading}
          />
        </div>
        
        <Button
          onClick={handleTip}
          disabled={disabled || isLoading || !amount}
          isLoading={isLoading}
          size="md"
          variant="primary"
          className="shrink-0"
          {...props}
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              <Zap className="w-4 h-4 mr-2xs" />
              Tip
            </>
          )}
        </Button>
      </div>
    );
  }

  if (!showInput) {
    return (
      <div className={cn('space-y-xs', className)}>
        <Button
          onClick={() => setShowInput(true)}
          disabled={disabled || isLoading}
          variant="primary"
          size="lg"
          className="w-full"
          {...props}
        >
          <Zap className="w-5 h-5 mr-2xs" />
          Send Tip
        </Button>
        
        {suggestedAmounts.length > 0 && (
          <div className="flex gap-2xs">
            {suggestedAmounts.map((suggested) => (
              <button
                key={suggested}
                onClick={() => handleSuggestedAmount(suggested)}
                disabled={disabled || isLoading}
                className="flex-1 py-2xs px-xs bg-accent border-2 border-primary rounded-brutalist hover:bg-primary hover:text-secondary transition-colors duration-150 text-body-sm font-medium disabled:opacity-50"
              >
                {suggested} ETH
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={cn('space-y-xs', className)}>
      <div className="flex gap-xs">
        <div className="flex-1">
          <Input
            type="number"
            step="0.001"
            min={minAmount}
            max={maxAmount}
            value={amount}
            onChange={(e) => {
              setAmount(e.target.value);
              setError('');
            }}
            placeholder="0.001"
            error={error}
            autoFocus
            disabled={disabled || isLoading}
          />
        </div>
        
        <Button
          onClick={handleTip}
          disabled={disabled || isLoading || !amount}
          isLoading={isLoading}
          size="md"
          variant="primary"
          className="shrink-0"
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              <Zap className="w-4 h-4 mr-2xs" />
              Send
            </>
          )}
        </Button>
      </div>

      {suggestedAmounts.length > 0 && (
        <div className="flex gap-2xs">
          {suggestedAmounts.map((suggested) => (
            <button
              key={suggested}
              onClick={() => setAmount(suggested)}
              disabled={disabled || isLoading}
              className="flex-1 py-2xs px-xs bg-accent border-2 border-primary rounded-brutalist hover:bg-primary hover:text-secondary transition-colors duration-150 text-body-sm font-medium disabled:opacity-50"
            >
              {suggested}
            </button>
          ))}
        </div>
      )}

      <button
        onClick={() => {
          setShowInput(false);
          setAmount('');
          setError('');
        }}
        className="text-body-sm text-primary/70 hover:text-primary underline"
      >
        Cancel
      </button>
    </div>
  );
}
