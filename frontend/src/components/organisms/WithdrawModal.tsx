import { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, Wallet, Loader2 } from 'lucide-react';
import { useWithdrawModal, useModalStore } from '@/store';
import { useWithdrawTips, useWithdrawAllTips } from '@/hooks/useTip';
import { Button } from '@/components/atoms/Button';
import { Input } from '@/components/atoms/Input';
import { formatTipAmount } from '@/services/contract.service';

const withdrawFormSchema = z.object({
  amount: z
    .string()
    .min(1, 'Amount is required')
    .refine((val) => !Number.isNaN(Number.parseFloat(val)) && Number.parseFloat(val) > 0, 'Amount must be greater than 0')
    .refine((val) => Number.parseFloat(val) >= 0.001, 'Minimum withdrawal is 0.001 ETH'),
});

type WithdrawFormData = z.infer<typeof withdrawFormSchema>;

export function WithdrawModal() {
  const { isOpen, data } = useWithdrawModal();
  const { closeModal } = useModalStore();
  const { mutate: withdrawTips, isPending } = useWithdrawTips();
  const { mutate: withdrawAllTips, isPending: isWithdrawingAll } = useWithdrawAllTips();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<WithdrawFormData>({
    resolver: zodResolver(withdrawFormSchema),
    defaultValues: {
      amount: '',
    },
  });

  const onSubmit = (formData: WithdrawFormData) => {
    withdrawTips(formData.amount, {
      onSuccess: () => {
        closeModal('withdraw');
        reset();
      },
    });
  };

  const handleWithdrawAll = () => {
    withdrawAllTips(undefined, {
      onSuccess: () => {
        closeModal('withdraw');
        reset();
      },
    });
  };

  const handleClose = () => {
    if (!isPending && !isWithdrawingAll) {
      closeModal('withdraw');
      reset();
    }
  };

  const availableBalance = data?.availableBalance || 0n;
  const availableFormatted = formatTipAmount(availableBalance);
  const isLoading = isPending || isWithdrawingAll;

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={handleClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-primary/50 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-md">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden bg-secondary border-3 border-primary rounded-brutalist shadow-brutalist-lg transition-all">
                <div className="flex items-center justify-between p-md border-b-3 border-primary">
                  <Dialog.Title className="text-h3 font-bold flex items-center gap-xs">
                    <Wallet className="w-6 h-6" />
                    Withdraw Tips
                  </Dialog.Title>
                  
                  <button
                    onClick={handleClose}
                    disabled={isLoading}
                    className="p-xs rounded hover:bg-accent transition-colors disabled:opacity-50"
                    aria-label="Close"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="p-md space-y-md">
                  <div className="p-sm bg-accent border-3 border-primary rounded-brutalist">
                    <p className="text-body-sm text-primary/70 mb-2xs">
                      Available Balance
                    </p>
                    <p className="text-h2 font-bold">{availableFormatted} ETH</p>
                  </div>

                  <Input
                    {...register('amount')}
                    label="Withdrawal Amount (ETH)"
                    type="number"
                    step="0.001"
                    min="0.001"
                    max={availableFormatted}
                    placeholder="0.001"
                    error={errors.amount?.message}
                    disabled={isLoading}
                    autoFocus
                  />

                  <button
                    type="button"
                    onClick={() => {
                      const input = document.querySelector<HTMLInputElement>('input[name="amount"]');
                      if (input) input.value = availableFormatted;
                    }}
                    disabled={isLoading || availableBalance === 0n}
                    className="text-body-sm text-primary/70 hover:text-primary underline disabled:opacity-50"
                  >
                    Use maximum amount
                  </button>

                  <div className="p-sm bg-yellow-50 border-3 border-yellow-600 rounded-brutalist">
                    <p className="text-body-sm text-yellow-900">
                      <strong>Note:</strong> Withdrawals are processed immediately. Gas fees apply.
                    </p>
                  </div>

                  <div className="flex gap-sm pt-sm">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={handleClose}
                      disabled={isLoading}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                    
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={handleWithdrawAll}
                      disabled={isLoading || availableBalance === 0n}
                      isLoading={isWithdrawingAll}
                      className="flex-1"
                    >
                      {isWithdrawingAll ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2xs animate-spin" />
                          Withdrawing...
                        </>
                      ) : (
                        'Withdraw All'
                      )}
                    </Button>
                    
                    <Button
                      type="submit"
                      variant="primary"
                      disabled={isLoading || availableBalance === 0n}
                      isLoading={isPending}
                      className="flex-1"
                    >
                      {isPending ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2xs animate-spin" />
                          Withdrawing...
                        </>
                      ) : (
                        <>
                          <Wallet className="w-4 h-4 mr-2xs" />
                          Withdraw
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
