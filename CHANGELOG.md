# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- **Account Recovery**: Implemented complete flow for password reset via WhatsApp/SMS tokens.
- **Concierge Role**: Added new role 'concierge' with specific dashboard and permissions.
- **Mobile-First Dashboard**: Created dedicated layout for guards/concierges.

### Fixed
- **Worker Logging**: Fixed `logger.error` call signature in cron worker to correctly handle error objects.
- **Security**: Added rate limiting to login endpoints.
- **Security**: Enforced account verification before login.
- **Type Safety**: Fixed various TypeScript errors in `authStore`, `scripts/create-concierge.ts`, and `admin/stats.ts`.

### Changed
- **Dependencies**: Updated `package.json` to include necessary types.
- **Configuration**: Updated `.cursorrules` to reflect new agentic workflows.
