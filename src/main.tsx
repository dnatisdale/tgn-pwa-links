import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles.css';

import { I18nProvider } from './i18n-provider'; // <<— use the provider file we created

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <I18nProvider>
      <App />
    </I18nProvider>
  </React.StrictMode>
);
