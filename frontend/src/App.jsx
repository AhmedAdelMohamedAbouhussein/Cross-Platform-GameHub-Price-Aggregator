import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useContext, lazy, Suspense } from "react";
import AuthContext from "./contexts/AuthContext";

// Public pages
import LandingPage from "./pages/LandingPage/LandingPage";
import LoginPage from "./pages/LoginPage/LoginPage";
import SignupPage from "./pages/SignupPage/SignupPage";
import Verify from './pages/OTPPage/OTPPage';
import ResetPassword from './pages/ResetPassword/ResetPassword'

// Private pages (lazy loaded)
const SyncWithSteam = lazy(() => import("./pages/SyncWithSteam/SyncWithSteam"));
const SyncWithXbox = lazy(() => import("./pages/SyncWithXbox/SyncWithXbox"));
const GamePage = lazy(() => import("./pages/GamePage/gamePage"));
const LibraryPage = lazy(() => import("./pages/LibraryPage/LibraryPage"));
const OwnedGamesDetails = lazy(() => import("./pages/OwnedGamesDetails/OwnedGamesDetails"));

function App() 
{
    const { user } = useContext(AuthContext);
    const location = useLocation(); // 🔑 current location

    return (
        <Suspense fallback={<div className="text-center p-10">Loading...</div>}>
            <Routes>
                {/* Public pages */}
                <Route path="/" element={<LandingPage />} />
                <Route path="/games/:gameName" element={<GamePage />} />
                <Route path="/verify" element={<Verify />} />
                <Route path="/resetpassword" element={<ResetPassword />} />

                {/* Auth pages */}
                <Route
                    path="/login"
                    element={!user ? <LoginPage /> : <Navigate to="/" replace />}
                />
                <Route
                    path="/signup"
                    element={!user ? <SignupPage /> : <Navigate to="/" replace />}
                />

                {/* Private pages */}
                <Route
                    path="/library"
                    element={user ? <LibraryPage /> : <Navigate to="/login" replace state={{ from: location }} />}
                />
                <Route
                    path="/library/sync/steam"
                    element={user ? <SyncWithSteam /> : <Navigate to="/login" replace state={{ from: location }} />}
                />
                <Route
                    path="/library/sync/xbox"
                    element={user ? <SyncWithXbox /> : <Navigate to="/login" replace state={{ from: location }} />}
                />
                <Route
                    path="/ownedgamedetails"
                    element={user ? <OwnedGamesDetails /> : <Navigate to="/login" replace state={{ from: location }} />}
                />
            </Routes>
        </Suspense>
    );
}

export default App;