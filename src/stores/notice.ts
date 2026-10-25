import { create } from 'zustand';

type NoticeState = {
  message: string;
  open: boolean;
  nonce: number;
  show: (message: string) => void;
  close: () => void;
};

export const useNoticeStore = create<NoticeState>((set) => ({
  message: '',
  open: false,
  nonce: 0,
  show(message: string) {
    set((state) => ({ message, open: true, nonce: state.nonce + 1 }));
  },
  close() {
    set({ open: false });
  },
}));
