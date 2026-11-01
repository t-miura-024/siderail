import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { OptionsPage } from '@/components/OptionsPage';
import '@/styles/global.css';

const rootElement = document.getElementById('root');
if (rootElement === null) {
  throw new Error('#root が見つかりません');
}

createRoot(rootElement).render(
  <StrictMode>
    <OptionsPage />
  </StrictMode>,
);
