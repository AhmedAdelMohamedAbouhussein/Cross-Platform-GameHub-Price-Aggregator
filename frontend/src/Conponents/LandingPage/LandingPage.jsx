import React from "react";
import styles from "./LandingPage.module.css";
import Header from "../Header/Header.jsx";
import Footer from "../Footer/Footer.jsx";
import { useNavigate } from "react-router-dom";

function LandingPage() {
  const navigate = useNavigate();

  function RouteToLogin() {
    navigate("/login");
  }

  function RouteToSignup() {
    navigate("/signup");
  }

  return (
    <>
      <Header />
      <div className={styles.landingContainer}>
        <h1 className={styles.title}>Welcome to Our App</h1>
        <p className={styles.subtitle}>Explore features and get started</p>
        <div className={styles.buttonContainer}>
          <button className={styles.landingButtons} onClick={RouteToLogin}>Login</button>
          <button className={styles.landingButtons} onClick={RouteToSignup}>Sign Up</button>
        </div>
      </div>
      <Footer />
    </>
  );
}

export default LandingPage;
