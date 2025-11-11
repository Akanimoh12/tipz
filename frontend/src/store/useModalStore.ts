import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type { Address } from 'viem';

export type ModalType = 'tip' | 'withdraw' | 'share' | 'celebration';

export interface TipModalData {
  toUsername: string;
  toAddress: Address;
  profileImageIpfs?: string;
  creditScore?: number;
  suggestedAmount?: string;
}

export interface WithdrawModalData {
  availableBalance: bigint;
  maxAmount?: string;
}

export interface ShareModalData {
  username: string;
  shareText?: string;
  shareUrl?: string;
}

export interface CelebrationModalData {
  type: 'tip_sent' | 'tip_received' | 'withdrawal' | 'registration';
  amount?: string;
  username?: string;
  message?: string;
}

export type ModalData =
  | TipModalData
  | WithdrawModalData
  | ShareModalData
  | CelebrationModalData
  | null;

interface ModalState {
  tipModalOpen: boolean;
  withdrawModalOpen: boolean;
  shareModalOpen: boolean;
  celebrationModalOpen: boolean;
  modalData: ModalData;
}

interface ModalActions {
  openTipModal: (data: TipModalData) => void;
  openWithdrawModal: (data: WithdrawModalData) => void;
  openShareModal: (data: ShareModalData) => void;
  openCelebrationModal: (data: CelebrationModalData) => void;
  closeModal: (type: ModalType) => void;
  closeAllModals: () => void;
  setModalData: (data: ModalData) => void;
}

type ModalStore = ModalState & ModalActions;

const initialState: ModalState = {
  tipModalOpen: false,
  withdrawModalOpen: false,
  shareModalOpen: false,
  celebrationModalOpen: false,
  modalData: null,
};

export const useModalStore = create<ModalStore>()(
  devtools(
    immer((set) => ({
      ...initialState,

      openTipModal: (data) =>
        set((state) => {
          state.tipModalOpen = true;
          state.modalData = data;
        }),

      openWithdrawModal: (data) =>
        set((state) => {
          state.withdrawModalOpen = true;
          state.modalData = data;
        }),

      openShareModal: (data) =>
        set((state) => {
          state.shareModalOpen = true;
          state.modalData = data;
        }),

      openCelebrationModal: (data) =>
        set((state) => {
          state.celebrationModalOpen = true;
          state.modalData = data;
        }),

      closeModal: (type) =>
        set((state) => {
          switch (type) {
            case 'tip':
              state.tipModalOpen = false;
              break;
            case 'withdraw':
              state.withdrawModalOpen = false;
              break;
            case 'share':
              state.shareModalOpen = false;
              break;
            case 'celebration':
              state.celebrationModalOpen = false;
              break;
          }
          state.modalData = null;
        }),

      closeAllModals: () => set(initialState),

      setModalData: (data) =>
        set((state) => {
          state.modalData = data;
        }),
    })),
    { name: 'ModalStore' }
  )
);

export const useTipModal = () =>
  useModalStore((state) => ({
    isOpen: state.tipModalOpen,
    data: state.tipModalOpen ? (state.modalData as TipModalData) : null,
  }));

export const useWithdrawModal = () =>
  useModalStore((state) => ({
    isOpen: state.withdrawModalOpen,
    data: state.withdrawModalOpen ? (state.modalData as WithdrawModalData) : null,
  }));

export const useShareModal = () =>
  useModalStore((state) => ({
    isOpen: state.shareModalOpen,
    data: state.shareModalOpen ? (state.modalData as ShareModalData) : null,
  }));

export const useCelebrationModal = () =>
  useModalStore((state) => ({
    isOpen: state.celebrationModalOpen,
    data: state.celebrationModalOpen ? (state.modalData as CelebrationModalData) : null,
  }));

export const useAnyModalOpen = () =>
  useModalStore((state) =>
    state.tipModalOpen ||
    state.withdrawModalOpen ||
    state.shareModalOpen ||
    state.celebrationModalOpen
  );
