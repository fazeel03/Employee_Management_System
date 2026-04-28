# Project Structure

## Directory Organization

```
employee-reports-service/
├── routers/              # API route handlers
│   └── reports.py        # Reports endpoint implementations
├── .amazonq/             # Amazon Q configuration
│   └── rules/            # Project rules and documentation
│       └── memory-bank/  # Memory Bank documentation
├── main.py               # Application entry point and FastAPI setup
├── database.py           # Database connection management
├── test_connection.py    # Database connectivity testing
└── .env                  # Environment configuration
```

## Core Components

### Application Layer (main.py)
- FastAPI application initialization
- Router registration and URL prefix configuration
- CORS middleware setup for cross-origin requests
- Health check endpoint for service monitoring
- Central configuration point for the service

### Data Access Layer (database.py)
- MySQL database connection factory
- Environment-based configuration loading
- Connection error handling and logging
- Reusable connection management for all database operations

### API Layer (routers/)
- **reports.py**: Contains all report-related endpoints
- Modular router structure for scalability
- Organized by functional domain (reports)
- Tagged for API documentation

### Configuration (.env)
- Database connection parameters (host, port, credentials)
- Service configuration (port number)
- Environment-specific settings
- Sensitive data isolation from codebase

### Testing (test_connection.py)
- Database connectivity validation
- Development and debugging utilities
- Connection troubleshooting support

## Architectural Patterns

### Microservice Architecture
- Standalone service focused on reporting functionality
- Independent deployment and scaling
- RESTful API for service communication

### Layered Architecture
- Clear separation between application, API, and data layers
- Modular design for maintainability
- Single responsibility principle per module

### Router Pattern
- FastAPI router-based endpoint organization
- Prefix-based URL structuring (/api/reports)
- Tag-based API documentation grouping

### Configuration Management
- Environment variable-based configuration
- Dotenv for local development
- Separation of configuration from code

## Component Relationships

```
main.py (FastAPI App)
    ├── Includes → routers/reports.py (API Endpoints)
    │                   └── Uses → database.py (DB Connection)
    ├── Configures → CORS Middleware
    └── Exposes → /health endpoint
```

The application follows a clean dependency flow where the main application orchestrates routers, routers handle HTTP requests/responses, and the database module provides data access functionality.
