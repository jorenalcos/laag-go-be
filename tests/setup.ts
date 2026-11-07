// Use dedicated secrets and configuration for automated tests.
process.env.NODE_ENV = "test";
process.env.JWT_SECRET =
  "test-only-laaggo-jwt-secret-at-least-32-characters";

process.env.ADMIN_EMAILS = "admin@laaggo.com";
process.env.DEFAULT_ORGANIZATION_SLUG = "cj-cebu-adventures";