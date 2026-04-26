import { csrfSync } from "csrf-sync";

const {
  generateToken,
  csrfSynchronisedProtection,
} = csrfSync({
  getTokenFromRequest: (req) => req.headers['x-csrf-token'],
});

export { generateToken, csrfSynchronisedProtection };
