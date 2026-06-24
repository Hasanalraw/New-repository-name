// Safeguard against iframe environment where window.fetch has only a getter
try {
  const originalFetch = window.fetch;
  let customFetch = originalFetch;
  try {
    Object.defineProperty(window, "fetch", {
      get() {
        return customFetch;
      },
      set(val) {
        customFetch = val;
      },
      configurable: true,
      enumerable: true,
    });
  } catch (err) {
    console.warn("window.fetch is not configurable, trying prototype override", err);
    try {
      const proto = Object.getPrototypeOf(window);
      if (proto && Object.getOwnPropertyDescriptor(proto, "fetch")?.configurable) {
        Object.defineProperty(proto, "fetch", {
          get() {
            return customFetch;
          },
          set(val) {
            customFetch = val;
          },
          configurable: true,
        });
      }
    } catch (e2) {
      console.warn("All fetch property redefine attempts failed:", e2);
    }
  }
} catch (e) {
  console.error("Critical error in fetch fallback initializer:", e);
}

import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
