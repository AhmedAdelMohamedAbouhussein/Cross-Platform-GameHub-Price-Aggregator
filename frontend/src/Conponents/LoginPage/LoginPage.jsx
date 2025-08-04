import React, { useState } from "react";
import styles from "./LoginPage.module.css";
import Header from "../Header/Header.jsx";
import Footer from "../Footer/Footer.jsx";

function LoginPage() {
  const [formData, setFormData] = useState({
    email: "",
    password: ""
  });

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    alert(`Logging in with\nEmail: ${formData.email}`);
    // Add login API logic here
  };

  return (
    <>
      <Header />
      <div className={styles.loginContainer}>
        <form className={styles.loginForm} onSubmit={handleSubmit}>
          <h2 className={styles.title}>Login</h2>
          <input type="email" name="email" placeholder="Email" className={styles.input} value={formData.email} onChange={handleChange} required/>
          <input type="password" name="password" placeholder="Password" className={styles.input} value={formData.password} onChange={handleChange} required/>
          <button type="submit" className={styles.loginButton}>Login</button>
        </form>
      </div>
      <Footer />
    </>
  );
}

export default LoginPage;
