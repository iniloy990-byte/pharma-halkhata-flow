import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.pharmastream.app',
  appName: 'PharmaStream',
  webDir: 'dist',
  server: {
    url: "https://07c2b41b-4154-4dd4-9f9e-dd676b4043ed.lovableproject.com?forceHideBadge=true",
    cleartext: true
  }
};

export default config;
