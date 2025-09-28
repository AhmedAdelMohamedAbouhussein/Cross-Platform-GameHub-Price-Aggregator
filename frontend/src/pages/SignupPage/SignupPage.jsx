import { useState } from "react";
import {useGoogleLogin} from '@react-oauth/google';
import axios from 'axios';
import { Link } from 'react-router-dom'; 
import { useNavigate } from 'react-router-dom';
import { FiEye, FiEyeOff, FiRotateCcw, FiTrash} from "react-icons/fi";

import styles from "./SignupPage.module.css"; 
import Header from "../../components/Header/Header.jsx";
import Footer from "../../components/Footer/Footer.jsx";
import LoadingScreen from "../../components/LoadingScreen/LoadingScreen.jsx";

function SignupPage() 
{
  const navigate = useNavigate();

  const BACKEND_URL = import.meta.env.VITE_REACT_APP_BACKEND_URL;
  const [formData, setFormData] = useState({ username: "", email: "", password: ""});
  const [feedback, setFeedback] = useState(null); // holds {type, message, redirectLink?, permanentDelete?}
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => 
  {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value,}));
  };


  function validateForm({ username, email, password }) 
  {
    const errors = [];
    // Name validation: minlength 2, maxlength 50
    if (username.length < 2 || username.length > 50) 
    {
      errors.push("Name must be between 2 and 50 characters");
    }

    // Email validation: matches regex
    if (!/^\S+@\S+\.\S+$/.test(email)) 
    {
      errors.push("Invalid email format");
    }

    // Password validation: at least 8 chars, 1 uppercase, 1 lowercase, 1 number
    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(password)) {
      errors.push("Password should be at least 8 characters long and must contain at least 1 uppercase, 1 lowercase, and 1 number");
    }
    return errors;
  }
  
  const handleSubmit = async (e) => 
  {
    e.preventDefault();
    const { username, email, password } = formData; // destructure formData

    const errors = validateForm(formData);
    if (errors.length > 0) 
    {
      setFeedback({ type: "error", message: errors[0] });
      return;
    }

    try 
    {
      setLoading(true);
      const response = await axios.post(`${BACKEND_URL}/api/users/adduser`, {
        name: username,
        email: email,
        password: password
      });

      const message = response.data.message;
      const userId =  response.data.userId;

      setFeedback({ type: "success", message: message || "User signed up successfully redirecting to verification Page....." });
      navigate(`/verify?userId=${userId}&email=${encodeURIComponent(email)}&purpose=email_verification`);
      console.log('Signup success:', message);

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
    finally
    {
      setLoading(false);
    }
  }

  const googleLogin = useGoogleLogin({
    onSuccess: async ({ code }) => {
      try 
      {
        setLoading(true)
        const response = await axios.post(`${BACKEND_URL}/api/auth/google/signup`, {
          code,
        });

          const message = response.data.message;
      
        setFeedback({ type: "success", message: message || "User signed up successfully redirecting to login Page....." });
        setTimeout(() => { navigate('/login'); }, 2000);
        console.log('Signup success:', message);
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
      finally
      {
        setLoading(false);
      }
    },
  flow: 'auth-code',
  });


  function renderFeedback(fb) 
  {
    if (!fb) return null;
    return (
      <div style={{ color: fb.type === "error" ? "red" : "green" }}>
        <p className={styles.feedback}>{fb.message}</p>

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

  if (loading) 
  {
      return <LoadingScreen />;
  }

  return (
    <>
      <Header />
      <div className={styles.signupContainer}>
        <form className={styles.signupForm} onSubmit={handleSubmit}>
          <h2 className={styles.signupTitle}>Sign Up</h2>
          <input type="text" name="username" placeholder="Username" className={styles.signupInput} value={formData.username} onChange={handleChange} required minLength={2} maxLength={50}/>
          <input type="email" name="email" placeholder="Email" className={styles.signupInput} value={formData.email} onChange={handleChange} required/>
          <div className={styles.passwordWrapper}>
            <input type={showPassword ? "text" : "password"} name="password" placeholder="Password" className={styles.passwordInput} value={formData.password} onChange={handleChange} required minLength={8} maxLength={50}/>
            <button type="button" className={styles.passwordToggle} onClick={() => setShowPassword((prev) => !prev)}>{showPassword ? <FiEyeOff /> : <FiEye />}</button>
          </div>

          {renderFeedback(feedback)}

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



/*
🔐 Improvements to make it more secure:

✅ Enforce HTTPS in production.
✅ Never expose backend secrets in import.meta.env.
✅ Replace <a href={permanentDelete}> with a button that calls axios.delete(...) with auth headers.
✅ Don’t log tokens in console.
✅ Show generic error messages (don’t trust backend messages blindly).
✅ Let the backend enforce validation, not just frontend (frontend validation is bypassable).
*/