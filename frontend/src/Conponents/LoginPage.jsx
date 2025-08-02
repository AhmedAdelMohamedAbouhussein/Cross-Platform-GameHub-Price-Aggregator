const LoginPage = () => {
  return (
    <div className="login-container">
      <form className="login-form">
        <h2 className="login-title">Login</h2>

        <label htmlFor="email" className="login-label"> Email </label>
        <input type="email" id="email" name="email" placeholder="Enter your email" className="login-input" required/>

        <label htmlFor="password" className="login-label">
          Password
        </label>
        <input type="password" id="password" name="password" placeholder="Enter your password" className="login-input" required/>

        <button type="submit" className="login-button"> Login </button>
      </form>
    </div>
  );
};

export default LoginPage;