import { create } from 'zustand';

interface GiftFlowState {
  claimToken: string | null;
  giftData: Record<string, unknown> | null;
  kycData: Record<string, unknown> | null;
  setClaimToken: (token: string) => void;
  setGiftData: (data: Record<string, unknown>) => void;
  setKycData: (data: Record<string, unknown>) => void;
  reset: () => void;
}

export const useGiftStore = create<GiftFlowState>((set) => ({
  claimToken: null,
  giftData: null,
  kycData: null,
  setClaimToken: (token) => set({ claimToken: token }),
  setGiftData: (data) => set({ giftData: data }),
  setKycData: (data) => set({ kycData: data }),
  reset: () => set({ claimToken: null, giftData: null, kycData: null }),
}));
