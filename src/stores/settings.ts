import { create } from 'zustand';

import {
  readStoredConfigUrl,
  writeStoredConfigUrl,
  resolveConfigUrl,
} from '@/lib/catalog/configUrl';

type SettingsState = {
  configUrl: string;
  saveConfigUrl: (value: string) => void;
  resolvedConfigUrl: () => string;
};

export const useSettingsStore = create<SettingsState>((set) => ({
  configUrl: readStoredConfigUrl(),

  saveConfigUrl(value: string) {
    writeStoredConfigUrl(value);
    set({ configUrl: readStoredConfigUrl() });
  },

  resolvedConfigUrl() {
    return resolveConfigUrl();
  },
}));
