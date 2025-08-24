import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useContext } from "react";
import AuthContext from "./contexts/AuthContext";

import LandingPage from "./components/LandingPage/LandingPage";
import LoginPage from "./components/LoginPage/LoginPage";
import SignupPage from "./components/SignupPage/SignupPage";
import Verify from './components/OTPPage/OTPPage'

import GamePage from "./components/GamePage/gamePage";
import MainPage from "./components/LibraryPage/LibraryPage";

function App() 
{
    const { user } = useContext(AuthContext);
    const location = useLocation(); // 🔑 current location

    return (
    <Routes>
        {/* Public pages */}
        <Route path="/" element = {<LandingPage />}/>
        <Route path="/games/:gameName" element = {<GamePage />}/>
        <Route path="/verify" element={<Verify />} />

        {/* Auth pages */}
        <Route path="/login" element={!user ? <LoginPage /> : <Navigate to="/" replace />}/>
        <Route path="/signup" element={!user ? <SignupPage /> : <Navigate to="/" replace />}/>

        {/* Private pages */}
        <Route path="/library" element={user ? <MainPage /> : <Navigate to="/login" replace state={{ from: location }} />}/> //TODO
    </Routes>
    );
}

export default App;