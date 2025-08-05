import React, { useState } from "react";
import {GoogleLogin/*, googleLogout*/} from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode';

import styles from "./LoginPage.module.css";
import Header from "../Header/Header.jsx";
import Footer from "../Footer/Footer.jsx";

function LoginPage() {
  const [formData, setFormData] = useState({
    email: "",
    password: ""
  });

  const handleChange = (e) => 
  {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value,}));
  };

  const handleSubmit = (e) => 
  {
    e.preventDefault();
    alert(`Signing up with\nUsername: ${formData.username}\nEmail: ${formData.email}`);
  };
  /*
    e: The event triggered by the input change.
    e.target.name: The name attribute of the input (e.g., "email" or "password").
    e.target.value: The value the user typed.
    setFormData(...): Updates the state using the previous values, while replacing only the field that changed.
  */

  /*function handleLogout () 
  {
    googleLogout();
    alert("Logged out successfully");
    setFormData({ username: "", email: "", password: "" });
  }*/


  return (
    <>
      <Header />
      <div className={styles.loginContainer}>
        <form className={styles.loginForm} onSubmit={handleSubmit}>
          <h2 className={styles.title}>Login</h2>
          <input type="email" name="email" placeholder="Email" className={styles.input} value={formData.email} onChange={handleChange} required/>
          <input type="password" name="password" placeholder="Password" className={styles.input} value={formData.password} onChange={handleChange} required/>
          <button type="submit" className={styles.loginButton}>Login</button>        
          <div className={styles.googleLoginWrapper}>
            <GoogleLogin 
              onSuccess={credentialResponse => {  console.log(credentialResponse); 
                                                  console.log(jwtDecode(credentialResponse.credential)); 
                                                }}
              onError={() => { console.log('Login Failed');}}
            />
          </div>
        </form>
      </div>
      <Footer />
    </>
  );
}

export default LoginPage;
