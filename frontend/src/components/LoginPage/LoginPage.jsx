import { useState, useContext } from "react";
import { useNavigate, useLocation, Link } from 'react-router-dom';
import {useGoogleLogin} from '@react-oauth/google';
import axios from 'axios';

import { FiEye, FiEyeOff, FiRotateCcw, FiTrash, FiMail} from "react-icons/fi";

import styles from "./LoginPage.module.css";
import Header from "../Header/Header.jsx";
import Footer from "../Footer/Footer.jsx";
import AuthContext from "../../contexts/AuthContext.jsx";
import LoadingScreen from "../LoadingScreen/LoadingScreen.jsx";

function LoginPage() 
{
  const BACKEND_URL = import.meta.env.VITE_REACT_APP_BACKEND_URL;
  const API_BASE =import.meta.env.MODE === "development"? ""  : BACKEND_URL;
  
  const navigate = useNavigate();
  const location = useLocation(); // 🔑 get previous location   //TODO

  const from = location.state?.from?.pathname;
  const redirectTo = (!from || ["/login", "/signup"].includes(from)) ? "/" : from;


  const { fetchUser } = useContext(AuthContext); // 👈 get from context  

  const [formData, setFormData] = useState({email: "", password: ""});
  const [isChecked, setIsChecked] = useState(false);
  const [feedback, setFeedback] = useState(null); // holds {type, message, redirectLink?, permanentDelete?}
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => 
  {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value,}));
  };
  
  const handleLoginSuccess = async (message) => 
  {
    setFeedback({ type: "success", message: message || "User logged in successfully" });
    setTimeout(async () => 
    {
      await fetchUser();
      navigate(redirectTo, { replace: true });
    }, 2000);
  };

  const handleSubmit = async (e) => 
  {
    e.preventDefault();
    const { email, password } = formData; // destructure formData
    
    try 
    {
      setLoading(true);
      
      const response = await axios.post(`${API_BASE}/api/users/login`, 
        {email: email.trim(), password: password , rememberMe: isChecked},
        { withCredentials: true } // 🔑 so cookies/sessions work
      );
      
      handleLoginSuccess(response.data.message);
    }
    catch (error) 
    {
      if (error.response?.data) 
      {
        console.log( error.response.data)
        const { message, verifyLink, restoreLink, permanentDelete } = error.response.data;

        if(verifyLink)
        {
          setFeedback({ type: "error", message: message || "Something went wrong",  verifyLink: verifyLink});
        }
        else if(restoreLink && permanentDelete)
        {
          setFeedback({ type: "error", message: message || "Something went wrong", restoreLink, permanentDelete,});
        }
        else
        {
          setFeedback({ type: "error", message: message || "Something went wrong"});
        }
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
  };

  const resetPassword = async () =>
  {
    try 
    {
      const {email} = formData; // destructure formData

      setLoading(true)
      const response = await axios.post(`${API_BASE}/api/users/getuseridbyemail`, 
        {email: email}
      );

      const userId =  response.data.userId;
      
      await axios.post(`${BACKEND_URL}/api/mail/sendotp`, { userId, email, purpose: "password_reset"  });

      navigate(`/verify?userId=${userId}&email=${encodeURIComponent(email)}&purpose=password_reset`);

    } 
    catch (error) 
    {
      if (error.response?.data) 
      {
        setFeedback({ type: "error", message: error.response.data.message || "Something went wrong" });
      }
      else
      {
        setFeedback({ type: "error", message: "Network error: Unable to reach server" });
      }
    }
    finally
    {
      setLoading(false)
    }
  }
  const verifyaccount = async () =>
  {
    try 
    {
      const {email} = formData; // destructure formData

      setLoading(true)
      const response = await axios.post(`${API_BASE}/api/users/getuseridbyemail`, 
        {email: email}
      );

      const userId =  response.data.userId;
      
      await axios.post(`${BACKEND_URL}/api/mail/sendotp`, { userId, email, purpose: "email_verification"  });

      navigate(`/verify?userId=${userId}&email=${encodeURIComponent(email)}&purpose=email_verification`);

    } 
    catch (error) 
    {
      if (error.response?.data) 
      {
        setFeedback({ type: "error", message: error.response.data.message || "Something went wrong" });
      }
      else
      {
        setFeedback({ type: "error", message: "Network error: Unable to reach server" });
      }
    }
    finally
    {
      setLoading(true);
    }
  }

  const googleLogin = useGoogleLogin({
    onSuccess: async ({ code }) => {
      try 
      {
        setLoading(true)
        const response = await axios.post(`${API_BASE}/api/auth/google/login`, 
          {code, rememberMe: isChecked},
          { withCredentials: true } // 🔑 so cookies/sessions work
        );

        handleLoginSuccess(response.data.message);
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

        {fb.verifyLink && (
            <div>
                <a onClick={verifyaccount} style={{ color: "blue" }}><FiMail/>Verify Account</a>
            </div>
        )}

        {fb.restoreLink && (
          <div>
            <Link to = {fb.restoreLink}><FiRotateCcw/>Restore Account</Link>
          </div>
        )}

        {fb.permanentDelete && (
          <div style={{ marginTop: "5px" }}>
            <Link to = {fb.permanentDelete} style={{ color: "red" }}><FiTrash />Permanently Delete Account</Link>
          </div>
        )}
      </div>
    );
  }

  const rememberCheckBox = (e) =>
  {
    setIsChecked(e.target.checked);
  }

    if (loading) 
    {
        return <LoadingScreen />;
    }

  return (
    <>
      <Header />
      <div className={styles.loginContainer}>
        <form className={styles.loginForm} onSubmit={handleSubmit}>
          <h2 className={styles.title}>Login</h2>
          <input type="email" name="email" placeholder="Email" className={styles.input} value={formData.email} onChange={handleChange} required/>
          
          <div className={styles.passwordWrapper}>
            <input type={showPassword ? "text" : "password"} name="password" placeholder="Password" className={styles.passwordInput} value={formData.password} onChange={handleChange} required maxLength={50} minLength={8}/>
            <button type="button" className={styles.passwordToggle} onClick={() => setShowPassword((prev) => !prev)}>{showPassword ? <FiEyeOff /> : <FiEye />}</button>
          </div>
          
          <div className={styles.checkboxContainer}>
            <span><input type="checkbox" checked={isChecked} onChange={rememberCheckBox}/>Remember Me</span>
            <a className={styles.forgotPasswordLink} onClick={resetPassword}>Forgot password</a>
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
