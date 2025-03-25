
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: "app.lovable.ba20ef70c2a84adfaeb04f784c510530",
  appName: "asistencia-felina",
  webDir: "dist",
  server: {
    url: "https://ba20ef70-c2a8-4adf-aeb0-4f784c510530.lovableproject.com?forceHideBadge=true",
    cleartext: true
  },
  // Adding android and ios specific configurations
  android: {
    path: "android"
  },
  ios: {
    path: "ios"
  }
};

export default config;
