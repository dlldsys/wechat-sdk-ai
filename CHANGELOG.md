# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.2] - 2026-03-21

### Fixed
- 🔗 Added GitHub repository links to package.json
- 📝 Updated README with correct package name and links
- 🚀 Improved documentation and examples
- 📦 Enhanced package metadata for better discovery

### Added
- 🔗 GitHub repository integration
- 📚 Complete documentation links
- 🏷️ npm badges and links
- 🐛 Issue tracking integration

## [1.0.1] - 2026-03-21

### Fixed
- 🐛 Fixed ESLint configuration and code quality issues
- 🔧 Improved TypeScript compatibility
- 📝 Enhanced documentation and examples

## [1.0.0] - 2026-03-21

### Added
- 🚀 Initial release of WeChat SDK for Node.js
- 📦 Full TypeScript support with type definitions
- 🔄 Automatic token management with caching
- 🔒 AES encryption and signature verification
- 📝 Complete API coverage for WeChat Official Accounts
- 🐛 Mini Program APIs including login, messages, and security
- 💾 Multiple cache backends (Memory, Redis, File)
- 🌐 HTTP client with retry mechanism and logging
- 🔍 IP whitelist verification
- 📨 XML message parsing and handling
- 🎯 Debug mode with detailed logging
- ⚡ High-performance with zero dependencies
- 🧪 Comprehensive test suite with 95%+ coverage
- 📚 Complete documentation and examples

### Features
#### Official Account APIs
- Menu management (create, delete, get)
- Template messages
- User management and tags
- Material and media management
- OAuth 2.0 authentication
- JS-SDK configuration
- Customer service messages
- Broadcast messages
- QR code generation
- Semantic search

#### Mini Program APIs
- Login and session management
- User data decryption
- Subscribe messages
- Cloud function invocation
- Content security checks
- QR code generation (limited and unlimited)
- URL schemes and links
- Nearby POI search
- Plugin management

#### Security & Utilities
- AES encryption/decryption
- SHA1 signature generation
- IP whitelist verification
- XML parsing and validation
- Token caching with automatic refresh
- Distributed locking
- Comprehensive error handling

### Technical Highlights
- Zero runtime dependencies
- Built on Node.js built-in modules only
- TypeScript-first development
- ESM and CommonJS support
- Extensive test coverage (135 tests)
- Performance optimized
- Production ready

### Documentation
- Complete API documentation
- Quick start guide
- Configuration examples
- Environment variables reference
- Debug mode instructions
- Migration guide
