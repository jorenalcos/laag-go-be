// Use a dedicated secret for automated tests.
// Never use the production JWT secret in tests.

process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "test-only-laaggo-jwt-secret-at-least-32-characters";