import { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { motion } from 'framer-motion';
import { CheckCircle, Zap, Wallet, UserPlus, X, Share2, ExternalLink } from 'lucide-react';
import { useCelebrationModal, useModalStore } from '@/store';
import { Button } from '@/components/atoms/Button';
import { useNavigate } from 'react-router-dom';

const confettiVariants = {
  initial: { opacity: 0, scale: 0 },
  animate: (i: number) => ({
    opacity: [0, 1, 1, 0],
    scale: [0, 1, 1, 0],
    x: [0, Math.random() * 400 - 200],
    y: [0, Math.random() * -400],
    rotate: [0, Math.random() * 360],
    transition: {
      duration: 2,
      delay: i * 0.05,
      ease: 'easeOut',
    },
  }),
};

const modalVariants = {
  hidden: { opacity: 0, scale: 0.8, y: 20 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: [0.16, 1, 0.3, 1],
    },
  },
  exit: {
    opacity: 0,
    scale: 0.8,
    y: 20,
    transition: {
      duration: 0.2,
    },
  },
};

const iconVariants = {
  hidden: { scale: 0, rotate: -180 },
  visible: {
    scale: 1,
    rotate: 0,
    transition: {
      delay: 0.2,
      duration: 0.5,
      ease: [0.16, 1, 0.3, 1],
    },
  },
};

export function CelebrationModal() {
  const { isOpen, data } = useCelebrationModal();
  const { closeModal } = useModalStore();
  const navigate = useNavigate();

  const handleClose = () => {
    closeModal('celebration');
  };

  const handleShare = () => {
    if (!data?.shareUrl) return;
    window.open(data.shareUrl, '_blank', 'width=550,height=420');
  };

  const handleViewProfile = () => {
    if (!data?.username) return;
    const profilePath = `/@${data.username}`;
    handleClose();
    navigate(profilePath);
  };

  const getIcon = () => {
    switch (data?.type) {
      case 'tip_sent':
        return Zap;
      case 'tip_received':
        return Zap;
      case 'withdrawal':
        return Wallet;
      case 'registration':
        return UserPlus;
      default:
        return CheckCircle;
    }
  };

  const getTitle = () => {
    switch (data?.type) {
      case 'tip_sent':
        return 'Tip Sent Successfully!';
      case 'tip_received':
        return 'Tip Received!';
      case 'withdrawal':
        return 'Withdrawal Complete!';
      case 'registration':
        return 'Welcome to Tipz!';
      default:
        return 'Success!';
    }
  };

  const getMessage = () => {
    if (data?.message) return data.message;

    switch (data?.type) {
      case 'tip_sent':
        return data.amount && data.username
          ? `You sent ${data.amount} STT to @${data.username}`
          : 'Your tip has been sent!';
      case 'tip_received':
        return data.amount && data.username
          ? `You received ${data.amount} STT from @${data.username}`
          : 'You received a tip!';
      case 'withdrawal':
        return data.amount
          ? `${data.amount} STT has been sent to your wallet`
          : 'Your withdrawal is complete!';
      case 'registration':
        return 'Your profile has been created. Start tipping creators!';
      default:
        return 'Your action completed successfully!';
    }
  };

  const Icon = getIcon();

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

        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="flex min-h-full items-center justify-center">
            {Array.from({ length: 20 }, (_, i) => {
              // Use stable ID based on modal type and confetti piece number
              const confettiId = `confetti-${data?.type || 'default'}-${i}`;
              return (
                <motion.div
                  key={confettiId}
                  custom={i}
                  variants={confettiVariants}
                  initial="initial"
                  animate="animate"
                  className="absolute w-3 h-3 bg-primary rounded-full"
                />
              );
            })}
          </div>
        </div>

        <div className="fixed inset-0 overflow-y-auto pointer-events-none">
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
              <Dialog.Panel className="pointer-events-auto">
                <motion.div
                  variants={modalVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="w-full max-w-md bg-secondary border-3 border-primary rounded-brutalist shadow-brutalist-lg overflow-hidden"
                >
                  <div className="relative p-xl text-center">
                    <button
                      onClick={handleClose}
                      className="absolute top-md right-md p-xs rounded hover:bg-accent transition-colors"
                      aria-label="Close"
                    >
                      <X className="w-5 h-5" />
                    </button>

                    <motion.div
                      variants={iconVariants}
                      initial="hidden"
                      animate="visible"
                      className="inline-flex items-center justify-center w-24 h-24 bg-green-100 border-3 border-green-600 rounded-brutalist mb-md"
                    >
                      <Icon className="w-12 h-12 text-green-600" />
                    </motion.div>

                    <Dialog.Title className="text-h2 font-bold mb-sm">
                      {getTitle()}
                    </Dialog.Title>

                    <p className="text-body text-primary/70 mb-lg">
                      {getMessage()}
                    </p>

                    <Button onClick={handleClose} variant="primary" size="lg" className="w-full">
                      Awesome!
                    </Button>

                    {(data?.shareUrl || data?.username) && (
                      <div className="mt-sm grid gap-sm sm:grid-cols-2">
                        {data?.shareUrl && (
                          <Button
                            type="button"
                            variant="brand"
                            onClick={handleShare}
                            className="w-full"
                          >
                            <Share2 className="w-4 h-4 mr-2xs" />
                            Share on X
                          </Button>
                        )}

                        {data?.username && (
                          <Button
                            type="button"
                            variant="secondary"
                            onClick={handleViewProfile}
                            className="w-full"
                          >
                            <ExternalLink className="w-4 h-4 mr-2xs" />
                            View Profile
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </motion.div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
