import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, HashRouter } from 'react-router-dom';
import { BookingProvider } from './store/BookingContext';
import { AuthProvider } from './store/AuthContext';
import App from './App';
import './styles/global.css';
import './styles/enhancements.css';
import './styles/manual-address.css';
import './styles/polish.css';

const Router = import.meta.env.VITE_ROUTER_MODE === 'hash' ? HashRouter : BrowserRouter;

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Router>
      <AuthProvider>
        <BookingProvider>
          <App />
        </BookingProvider>
      </AuthProvider>
    </Router>
  </StrictMode>,
);
