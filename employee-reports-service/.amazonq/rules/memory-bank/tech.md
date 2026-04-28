# Technology Stack

## Programming Language
- **Python 3.x**: Primary development language for the service

## Web Framework
- **FastAPI**: Modern, high-performance web framework for building APIs
  - Automatic API documentation (Swagger/OpenAPI)
  - Built-in data validation with Pydantic
  - Async support for high concurrency
  - Type hints and editor support

## Database
- **MySQL**: Relational database management system
  - Version: Compatible with MySQL 5.7+
  - Connection library: mysql-connector-python
  - Database: employee_management_system

## Key Dependencies

### Core Libraries
- **fastapi**: Web framework for API development
- **mysql-connector-python**: MySQL database driver
- **python-dotenv**: Environment variable management
- **uvicorn**: ASGI server for running FastAPI applications

### Middleware
- **CORSMiddleware**: Cross-Origin Resource Sharing support
  - Configured for frontend at http://localhost:5173
  - Allows credentials and all methods/headers

## Configuration Management
- **Environment Variables** (.env file):
  - `DB_HOST`: Database server hostname (default: localhost)
  - `DB_PORT`: Database server port (default: 3306)
  - `DB_NAME`: Database name (employee_management_system)
  - `DB_USER`: Database username (default: root)
  - `DB_PASSWORD`: Database password
  - `DATABASE_URL`: Full connection string
  - `SERVICE_PORT`: Service port (8001)

## Development Commands

### Running the Service
```bash
# Start the FastAPI service with uvicorn
uvicorn main:app --reload --port 8001

# Or use the configured port from .env
uvicorn main:app --reload --port ${SERVICE_PORT}
```

### Testing Database Connection
```bash
# Run the connection test script
python test_connection.py
```

### Installing Dependencies
```bash
# Install required packages
pip install fastapi uvicorn mysql-connector-python python-dotenv
```

## API Documentation
- **Swagger UI**: Available at http://localhost:8001/docs
- **ReDoc**: Available at http://localhost:8001/redoc
- Automatically generated from FastAPI route definitions

## Development Environment
- **Port**: 8001 (configurable via SERVICE_PORT)
- **Frontend Integration**: Configured for localhost:5173 (typical Vite dev server)
- **Hot Reload**: Enabled with --reload flag for development

## Architecture Style
- **RESTful API**: Standard HTTP methods and status codes
- **Microservice**: Independent service with focused responsibility
- **Synchronous**: Traditional request-response pattern with MySQL connector
