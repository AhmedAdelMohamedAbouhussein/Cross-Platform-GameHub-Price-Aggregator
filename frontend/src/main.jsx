import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom';
import {GoogleOAuthProvider} from '@react-oauth/google';

import AuthProvider from "./contexts/AuthProvider.jsx";
import App from './App.jsx'
import './index.css'

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

createRoot(document.getElementById('root')).render(
<BrowserRouter basename="/Web_App">
  <GoogleOAuthProvider clientId={CLIENT_ID}>
    <AuthProvider>
      <App /> 
    </AuthProvider>
  </GoogleOAuthProvider>
</BrowserRouter>
);
