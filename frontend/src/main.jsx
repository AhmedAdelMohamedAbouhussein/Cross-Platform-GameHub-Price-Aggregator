import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';

import AuthProvider from "./contexts/AuthProvider.jsx";
import App from './App.jsx'
import './index.css'

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient();

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

createRoot(document.getElementById('root')).render(
  <BrowserRouter basename="/MyGameHub">
    <QueryClientProvider client={queryClient}>
      <GoogleOAuthProvider clientId={CLIENT_ID}>
        <AuthProvider>
          <App />
        </AuthProvider>
      </GoogleOAuthProvider>
    </QueryClientProvider>
  </BrowserRouter>
);
