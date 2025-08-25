import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useContext } from "react";
import AuthContext from "./contexts/AuthContext";

import LandingPage from "./components/LandingPage/LandingPage";
import LoginPage from "./components/LoginPage/LoginPage";
import SignupPage from "./components/SignupPage/SignupPage";
import Verify from './components/OTPPage/OTPPage';
import ResetPassword from './components/ResetPassword/ResetPassword'
import SyncWithSteam from "./components/SyncWithSteam/SyncWithSteam";
import SyncWithXbox from "./components/SyncWithXbox/SyncWithXbox";

import GamePage from "./components/GamePage/gamePage";
import LibraryPage from "./components/LibraryPage/LibraryPage";

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
        <Route path="/resetpassword" element={<ResetPassword/>} />

        {/* Auth pages */}
        <Route path="/login" element={!user ? <LoginPage /> : <Navigate to="/" replace />}/>
        <Route path="/signup" element={!user ? <SignupPage /> : <Navigate to="/" replace />}/>

        {/* Private pages */}
        <Route path="/library" element={user ? <LibraryPage /> : <Navigate to="/login" replace state={{ from: location }} />}/>
        <Route path="/library/sync/steam" element={user ? <SyncWithSteam /> : <Navigate to="/login" replace state={{ from: location }} />}/>
        <Route path="/library/sync/xbox" element={user ? <SyncWithXbox /> : <Navigate to="/login" replace state={{ from: location }} />}/>
    </Routes>
    );
}

export default App;