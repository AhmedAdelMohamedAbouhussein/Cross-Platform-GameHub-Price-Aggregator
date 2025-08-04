import React from "react";
import styles from "./LandingPage.module.css";
import Header from "../Header/Header.jsx";
import Footer from "../Footer/Footer.jsx";

function LandingPage() {
  return (
    <>
      <Header />
      <div className={styles.landingContainer}>
        <h1 className={styles.title}>Welcome to Our App</h1>
        <p className={styles.subtitle}>Explore features and get started</p>
      </div>
      <Footer />
    </>
  );
}

export default LandingPage;
