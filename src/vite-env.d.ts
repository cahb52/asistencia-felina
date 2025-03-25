
/// <reference types="vite/client" />

// Capacitor App module declaration
declare module '@capacitor/app' {
  export interface AppPlugin {
    exitApp(): Promise<void>;
    addListener(
      eventName: 'backButton',
      listenerFunc: () => void
    ): Promise<{ remove: () => void }>;
  }

  export const App: AppPlugin;
}
