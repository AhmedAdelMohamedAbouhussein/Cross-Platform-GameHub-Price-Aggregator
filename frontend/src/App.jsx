import { Routes, Route } from 'react-router-dom';

import LoginPage from "./Conponents/LoginPage/LoginPage.jsx";
import SignupPage from "./Conponents/SignupPage/SignupPage.jsx";
import LandingPage from "./Conponents/LandingPage/LandingPage.jsx";
function App()
{
    return(
    <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
    </Routes>
    );
}

export default App;