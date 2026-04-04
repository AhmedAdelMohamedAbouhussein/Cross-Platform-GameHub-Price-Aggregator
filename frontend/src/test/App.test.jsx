import { describe, test, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { createContext } from 'react';

// ── Stub AuthContext so useContext(AuthContext) returns { user: null } ─────────
// App.jsx does: import AuthContext from "./contexts/AuthContext"
// and then:     const { user } = useContext(AuthContext)
// We provide a context with user=null (logged-out state).
vi.mock('../contexts/AuthContext', () => {
    const AuthContext = createContext({ user: null });
    return { default: AuthContext };
});

// ── Mock pages that make API calls or use heavy lazy-loaded deps ─────────────
vi.mock('../pages/LandingPage/LandingPage', () => ({
    default: () => <div data-testid="landing-page">Landing</div>,
}));
vi.mock('../pages/LoginPage/LoginPage', () => ({
    default: () => <div>Login</div>,
}));
vi.mock('../pages/SignupPage/SignupPage', () => ({
    default: () => <div>Signup</div>,
}));
vi.mock('../pages/OTPPage/OTPPage', () => ({
    default: () => <div>OTP</div>,
}));
vi.mock('../pages/ResetPassword/ResetPassword', () => ({
    default: () => <div>ResetPassword</div>,
}));

import App from '../App.jsx';

describe('App (smoke test)', () => {
    test('renders without crashing at root route', () => {
        const { container } = render(
            <MemoryRouter initialEntries={['/']}>
                <App />
            </MemoryRouter>
        );
        expect(container).toBeTruthy();
        expect(container.firstChild).not.toBeNull();
    });

    test('renders the LandingPage stub at "/"', () => {
        const { getByTestId } = render(
            <MemoryRouter initialEntries={['/']}>
                <App />
            </MemoryRouter>
        );
        expect(getByTestId('landing-page')).toBeInTheDocument();
    });
});
