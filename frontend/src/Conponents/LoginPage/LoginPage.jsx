import { useState } from "react";
import {useGoogleLogin} from '@react-oauth/google';
import axios from 'axios';
import { Link } from 'react-router-dom'; 
import { FiEye, FiEyeOff, FiRotateCcw, FiTrash} from "react-icons/fi";

import styles from "./LoginPage.module.css";
import Header from "../Header/Header.jsx";
import Footer from "../Footer/Footer.jsx";

function LoginPage() 
{
  const BACKEND_URL = import.meta.env.VITE_REACT_APP_BACKEND_URL;

  const [formData, setFormData] = useState({email: "", password: ""});
  const [isChecked, setIsChecked] = useState(false);
  const [feedback, setFeedback] = useState(null); // holds {type, message, redirectLink?, permanentDelete?}
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => 
  {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value,}));
  };

  const handleSubmit = async (e) => 
  {
    e.preventDefault();
    const { email, password } = formData; // destructure formData
    
    try 
    {
      const response = await axios.post(`${BACKEND_URL}/api/users/login`, {
        email: email.trim(),
        password: password
      });

      setFeedback({ type: "success", message: response.data.message || "User logged in successfully" });
      console.log('Signup success:', response.data.message);
    }
    catch (error) 
    {
      if (error.response?.data) 
      {
        const { message, restoreLink, permanentDelete } = error.response.data;

        setFeedback({ type: "error", message: message || "Something went wrong", restoreLink, permanentDelete,});
      }
      else 
      {
        // Network or unknown error
        setFeedback({
          type: "error",
          message: "Network error: Unable to reach server",
        });
      }
    }
  };

  function renderFeedback(fb) 
  {
    if (!fb) return null;
    return (
      <div style={{ color: fb.type === "error" ? "red" : "green" }}>
        <p>{fb.message}</p>

        {fb.restoreLink && (
          <div>
            <a href={fb.restoreLink}><FiRotateCcw/>Restore Account</a>
          </div>
        )}

        {fb.permanentDelete && (
          <div style={{ marginTop: "5px" }}>
            <a href={fb.permanentDelete} style={{ color: "red" }}><FiTrash />Permanently Delete Account</a>
          </div>
        )}
      </div>
    );
  }

  const rememberCheckBox = (e) =>
  {
    setIsChecked(e.target.checked);
  }

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
        console.error('Login error:', error.response?.data || error.message);
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
          
          <div className={styles.passwordWrapper}>
            <input type={showPassword ? "text" : "password"} name="password" placeholder="Password" className={styles.passwordInput} value={formData.password} onChange={handleChange} required/>
            <button type="button" className={styles.passwordToggle} onClick={() => setShowPassword((prev) => !prev)}>{showPassword ? <FiEyeOff /> : <FiEye />}</button>
          </div>
          
          <div className={styles.checkboxContainer}>
            <span><input type="checkbox" checked={isChecked} onChange={rememberCheckBox}/>Remember Me</span>
            <Link to="/forgotPassword" className={styles.forgotPasswordLink}>Forgot password</Link>
          </div>
          
          {renderFeedback(feedback)}
          
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
