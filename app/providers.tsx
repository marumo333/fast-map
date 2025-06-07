'use client';

import { Provider } from 'react-redux';
import { store } from './store/store';
import { CookiesProvider } from 'react-cookie';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <Provider store={store}>
      <CookiesProvider>
        {children}
      </CookiesProvider>
    </Provider>
  );
} 