import { useState } from "react";
import {useGoogleLogin} from '@react-oauth/google';
import axios from 'axios';
import { Link } from 'react-router-dom'; 

import styles from "./LoginPage.module.css";
import Header from "../Header/Header.jsx";
import Footer from "../Footer/Footer.jsx";

function LoginPage() {
  const [formData, setFormData] = useState({
    email: "",
    password: ""
  });
  const [isChecked, setIsChecked] = useState(false);

  const handleChange = (e) => 
  {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value,}));
  };

  const handleSubmit = (e) => 
  {
    e.preventDefault();
    alert(`Signing up with\nUsername: ${formData.username}\nEmail: ${formData.email}`);
  };

  const rememberCheckBox = (e) =>
  {
    setIsChecked(e.target.checked);
  }

  const BACKEND_URL = import.meta.env.VITE_REACT_APP_BACKEND_URL;
  const googleLogin = useGoogleLogin({
    onSuccess: async ({ code }) => {
      try 
      {
        const response = await axios.post(`${BACKEND_URL}/auth/google/access-token`, {
          code,
        });
        const { tokens, userInfo } = response.data;

        console.log('Access Token:', tokens);
        console.log('User Info:', userInfo);

      } 
      catch (error) 
      {
        console.error('Login error:', error);
      }
    },
  flow: 'auth-code',
  });

  return (
    <>
      <Header />
      <div className={styles.loginContainer}>
        <form className={styles.loginForm} onSubmit={handleSubmit}>
          <h2 className={styles.title}>Login</h2>
          <input type="email" name="email" placeholder="Email" className={styles.input} value={formData.email} onChange={handleChange} required/>
          <input type="password" name="password" placeholder="Password" className={styles.input} value={formData.password} onChange={handleChange} required/>
          
            <div className={styles.checkboxContainer}>
              <span><input type="checkbox" checked={isChecked} onChange={rememberCheckBox}/>Remember Me</span>
              <Link to="/forgotPassword" className={styles.forgotPasswordLink}>Forgot password</Link>
            </div>

          <button type="submit" className={styles.loginButton}>Login</button>        
          <div className={styles.googleLoginWrapper}>
            <button type="button" className={styles.googleLoginButton} onClick={() => googleLogin()}> <img src="https://developers.google.com/identity/images/g-logo.png" alt="Google icon" /> Sign in with Google </button>
          </div>
          <p className={styles.signupPrompt}>Don't have an account? <Link to="/signup">Sign up</Link></p>
        </form>
      </div>
      <Footer />
    </>
  );
}

export default LoginPage;
