import { darkTheme, RainbowKitProvider } from '@rainbow-me/rainbowkit';
import type { ReactNode } from 'react';

const brutalistTheme = darkTheme({
  accentColor: '#000000',
  accentColorForeground: '#FFFFFF',
  borderRadius: 'small',
  fontStack: 'system',
  overlayBlur: 'none',
});

brutalistTheme.colors.modalBackground = '#FFFFFF';
brutalistTheme.colors.modalText = '#000000';
brutalistTheme.colors.modalTextSecondary = '#000000';
brutalistTheme.colors.profileForeground = '#FFFFFF';
brutalistTheme.colors.modalBorder = '#000000';
brutalistTheme.colors.menuItemBackground = '#FAFAFA';
brutalistTheme.colors.closeButton = '#000000';
brutalistTheme.colors.closeButtonBackground = '#FAFAFA';

interface RainbowKitConfigProps {
  children: ReactNode;
}

export function RainbowKitConfig({ children }: Readonly<RainbowKitConfigProps>) {
  return (
    <RainbowKitProvider theme={brutalistTheme} modalSize="compact">
      {children}
    </RainbowKitProvider>
  );
}
