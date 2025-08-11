import { Routes, Route } from 'react-router-dom';

import LandingPage from "./Conponents/LandingPage/LandingPage.jsx";
import LoginPage from "./Conponents/LoginPage/LoginPage.jsx";
import SignupPage from "./Conponents/SignupPage/SignupPage.jsx";

import GamePage from "./Conponents/GamePage/gamePage.jsx";
import MainPage from "./Conponents/LibraryPage/LibraryPage.jsx";
function App()
{
    return(
    <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/games/:gameName" element={<GamePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/library" element={<MainPage />} />
    </Routes>
    );
}

export default App;