import { Fragment, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, Zap, Loader2 } from 'lucide-react';
import { useTipModal, useModalStore } from '@/store';
import { useSendTip } from '@/hooks/useTip';
import { Avatar } from '@/components/atoms/Avatar';
import { Button } from '@/components/atoms/Button';
import { Input } from '@/components/atoms/Input';
import { calculatePlatformFee, calculateRecipientAmount, parseTipAmount } from '@/services/contract.service';

const tipFormSchema = z.object({
  amount: z
    .string()
    .min(1, 'Amount is required')
    .refine((val) => !Number.isNaN(Number.parseFloat(val)) && Number.parseFloat(val) > 0, 'Amount must be greater than 0')
    .refine((val) => Number.parseFloat(val) >= 0.001, 'Minimum tip is 0.001 ETH'),
  message: z.string().max(280, 'Message must be less than 280 characters').optional(),
});

type TipFormData = z.infer<typeof tipFormSchema>;

export function TipModal() {
  const { isOpen, data } = useTipModal();
  const { closeModal } = useModalStore();
  const { mutate: sendTip, isPending } = useSendTip();

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<TipFormData>({
    resolver: zodResolver(tipFormSchema),
    defaultValues: {
      amount: data?.suggestedAmount || '',
      message: '',
    },
  });

  const amountValue = watch('amount');

  useEffect(() => {
    if (isOpen && data?.suggestedAmount) {
      reset({ amount: data.suggestedAmount, message: '' });
    }
  }, [isOpen, data?.suggestedAmount, reset]);

  const onSubmit = (formData: TipFormData) => {
    if (!data) return;

    sendTip(
      {
        toUsername: data.toUsername,
        amount: formData.amount,
        message: formData.message || '',
      },
      {
        onSuccess: () => {
          closeModal('tip');
          reset();
        },
      }
    );
  };

  const handleClose = () => {
    if (!isPending) {
      closeModal('tip');
      reset();
    }
  };

  const tipAmount = amountValue ? parseTipAmount(amountValue) : 0n;
  const platformFee = tipAmount ? calculatePlatformFee(tipAmount) : 0n;
  const recipientAmount = tipAmount ? calculateRecipientAmount(tipAmount) : 0n;

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
                    <Zap className="w-6 h-6" />
                    Send Tip
                  </Dialog.Title>
                  
                  <button
                    onClick={handleClose}
                    disabled={isPending}
                    className="p-xs rounded hover:bg-accent transition-colors disabled:opacity-50"
                    aria-label="Close"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {data && (
                  <form onSubmit={handleSubmit(onSubmit)} className="p-md space-y-md">
                    <div className="flex items-center gap-sm p-sm bg-accent border-3 border-primary rounded-brutalist">
                      <Avatar
                        src={data.profileImageIpfs}
                        alt={data.toUsername}
                        fallbackText={data.toUsername}
                        size="md"
                      />
                      <div>
                        <p className="font-bold text-body">@{data.toUsername}</p>
                        {data.creditScore && (
                          <p className="text-body-sm text-primary/70">
                            Credit Score: {data.creditScore}
                          </p>
                        )}
                      </div>
                    </div>

                    <Input
                      {...register('amount')}
                      label="Amount (ETH)"
                      type="number"
                      step="0.001"
                      min="0.001"
                      placeholder="0.001"
                      error={errors.amount?.message}
                      disabled={isPending}
                      autoFocus
                    />

                    <div className="space-y-2xs">
                      <label htmlFor="tip-message" className="block text-body-sm font-medium">
                        Message (optional)
                      </label>
                      <textarea
                        {...register('message')}
                        id="tip-message"
                        placeholder="Say something nice..."
                        rows={3}
                        maxLength={280}
                        disabled={isPending}
                        className="w-full px-sm py-xs border-3 border-primary bg-secondary text-primary rounded-brutalist placeholder:text-primary/50 focus:outline-none focus:shadow-brutalist transition-shadow resize-none disabled:opacity-50"
                      />
                      {errors.message && (
                        <p className="text-body-sm text-red-600">
                          {errors.message.message}
                        </p>
                      )}
                    </div>

                    {tipAmount > 0n && (
                      <div className="p-sm bg-accent border-3 border-primary rounded-brutalist space-y-2xs text-body-sm">
                        <div className="flex justify-between">
                          <span className="text-primary/70">Tip Amount:</span>
                          <span className="font-bold">{amountValue} ETH</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-primary/70">Platform Fee (2%):</span>
                          <span>{(Number(platformFee) / 1e18).toFixed(6)} ETH</span>
                        </div>
                        <div className="flex justify-between pt-2xs border-t-2 border-primary">
                          <span className="font-bold">Creator Receives:</span>
                          <span className="font-bold text-green-600">
                            {(Number(recipientAmount) / 1e18).toFixed(6)} ETH
                          </span>
                        </div>
                      </div>
                    )}

                    <div className="flex gap-sm pt-sm">
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={handleClose}
                        disabled={isPending}
                        className="flex-1"
                      >
                        Cancel
                      </Button>
                      
                      <Button
                        type="submit"
                        variant="brand"
                        disabled={isPending}
                        isLoading={isPending}
                        className="flex-1"
                      >
                        {isPending ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2xs animate-spin" />
                            Sending...
                          </>
                        ) : (
                          <>
                            <Zap className="w-4 h-4 mr-2xs" />
                            Send Tip
                          </>
                        )}
                      </Button>
                    </div>
                  </form>
                )}
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
