import { useState } from "react";
import {useGoogleLogin} from '@react-oauth/google';
import axios from 'axios';
import { Link } from 'react-router-dom'; 

import styles from "./SignupPage.module.css"; 
import Header from "../Header/Header.jsx";
import Footer from "../Footer/Footer.jsx";

function SignupPage() 
{
  const BACKEND_URL = import.meta.env.VITE_REACT_APP_BACKEND_URL;
  const [formData, setFormData] = useState({ username: "", email: "", password: ""});
  const [errorMessage, setErrorMessage] = useState(""); // <-- state for errors


  const handleChange = (e) => 
  {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value,}));
  };

  const handleSubmit = async (e) => 
  {
    e.preventDefault();
    const { username, email, password } = formData; // destructure formData

    try 
    {
      const response = await axios.post(`${BACKEND_URL}/api/users/adduser`, {
        name: username,
        email: email,
        password: password
    });

    setErrorMessage("User signed up successfully");
    console.log('Signup success:', response.data);
    }
    catch (error) 
    {
      if (error.response) 
      {
        // Backend responded with an error
        setErrorMessage(error.response.data.message || "Something went wrong");
        console.error(error.response.data);
      } 
      else 
      {
        // Network error or no response
        setErrorMessage("Network error: Unable to reach server");
        console.error(error);
      }
    }
  };

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
      <div className={styles.signupContainer}>
        <form className={styles.signupForm} onSubmit={handleSubmit}>
          <h2 className={styles.signupTitle}>Sign Up</h2>
          <input type="text" name="username" placeholder="Username" className={styles.signupInput} value={formData.username} onChange={handleChange} required/>
          <input type="email" name="email" placeholder="Email" className={styles.signupInput} value={formData.email} onChange={handleChange} required/>
          <input type="password" name="password" placeholder="Password" className={styles.signupInput} value={formData.password} onChange={handleChange} required/>
          
          {errorMessage && (
  <div style={{ color: "red" }}>
    {typeof errorMessage === "string" ? errorMessage : errorMessage.message}
    {errorMessage.restoreLink && (
      <div>
        <a href={errorMessage.restoreLink}>Restore Account</a>
      </div>
    )}
  </div>
)}
          <button type="submit" className={styles.signupButton}> Sign Up </button>
          <div className={styles.googleSignupWrapper}>
            <button type="button" className={styles.googleSignupButton} onClick={() => googleLogin()}> <img src="https://developers.google.com/identity/images/g-logo.png" alt="Google icon" /> Sign in with Google </button>
          </div>
          <p className={styles.loginPrompt}>Already have an account? <Link to="/login" className={styles.loginLink}>Login</Link></p>
        </form>
      </div>
      <Footer />
    </>
  );
}

export default SignupPage;
