# Development Guidelines

## Code Quality Standards

### File Headers and Comments
- Use descriptive comments at the top of files to indicate purpose (4/4 files)
- Example: `# routers/reports.py - start with simple endpoint`
- Keep inline comments concise and meaningful

### Code Formatting
- Use 4-space indentation consistently (4/4 files)
- Blank lines to separate logical sections and function definitions
- Multi-line strings for SQL queries with proper indentation
- Line breaks after commas in function parameters for readability

### Naming Conventions
- **Functions**: snake_case for all function names (4/4 files)
  - Examples: `get_connection()`, `health_check()`, `export_employees()`
- **Variables**: snake_case for all variables (4/4 files)
  - Examples: `csv_buffer`, `attendance_data`, `env_vars`
- **Constants**: UPPERCASE for environment variable names
  - Examples: `DB_HOST`, `DB_PORT`, `DB_NAME`
- **Modules**: lowercase with underscores (4/4 files)
  - Examples: `test_connection.py`, `database.py`

### Documentation Standards
- Docstrings for all public API endpoints using triple quotes (3/4 files)
- Format: `"""Brief description of endpoint purpose"""`
- Examples:
  ```python
  @router.get("/employees/export")
  async def export_employees(format: str = "csv"):
      """Export all employees as CSV or JSON file"""
  ```

## Structural Conventions

### Import Organization
Standard import order followed across all files (4/4 files):
1. Standard library imports
2. Third-party library imports
3. Local application imports

Example from routers/reports.py:
```python
from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from database import get_connection
import pandas as pd
import io
import logging
```

### Module-Level Configuration
- Load environment variables at module level using `load_dotenv()` (2/4 files)
- Configure logging at module level for routers (1/4 files)
```python
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)
```

### Router Pattern
- Create APIRouter instance at module level (1/4 files)
```python
router = APIRouter()
```
- Register routers in main.py with prefix and tags
```python
app.include_router(reports.router, prefix="/api/reports", tags=["Reports"])
```

## Practices and Patterns

### Error Handling
- Use try-except blocks for all database operations (4/4 files)
- Log errors before raising exceptions (3/4 files)
```python
try:
    conn = get_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Database connection failed")
    # ... operation
except Exception as e:
    logger.error(f"Error exporting employees: {str(e)}")
    raise HTTPException(status_code=500, detail=str(e))
```
- Return None on connection failure rather than raising exceptions in utility functions
```python
def get_connection():
    try:
        return mysql.connector.connect(...)
    except Exception as e:
        print(f"Database connection error: {e}")
        return None
```

### Database Connection Management
- Always check connection validity before use (3/4 files)
```python
conn = get_connection()
if not conn:
    raise HTTPException(status_code=500, detail="Database connection failed")
```
- Always close connections and cursors after use (3/4 files)
```python
cursor.close()
conn.close()
```
- Use dictionary cursors for JSON-friendly results
```python
cursor = conn.cursor(dictionary=True)
```

### Logging Pattern
- Log at INFO level for successful operations (3/4 files)
- Log at ERROR level for failures (3/4 files)
- Include relevant context in log messages
```python
logger.info(f"Employee export requested - format: {format}")
logger.info(f"CSV export generated: {len(employees)} employees")
logger.error(f"Error exporting employees: {str(e)}")
```

### Response Structure
- Consistent JSON response format for API endpoints (3/4 files)
```python
return {
    "success": True,
    "data": result_data,
    "metadata": {
        "total_records": len(result_data),
        "generated_at": pd.Timestamp.now().isoformat()
    }
}
```

### Async Endpoint Definitions
- Use async def for all API route handlers (3/4 files)
```python
@router.get("/employees/export")
async def export_employees(format: str = "csv"):
    ...
```

## Internal API Usage and Patterns

### FastAPI Endpoint Decorators
```python
# GET endpoints with path and optional query parameters
@router.get("/employees/export")
async def export_employees(format: str = "csv"):
    ...

@router.get("/attendance/summary")
async def attendance_summary(start_date: str = None, end_date: str = None):
    ...

# Health check pattern
@app.get("/health")
def health_check():
    return {"status": "healthy", "service": "EMS Reports Service"}
```

### HTTPException Usage
- Use HTTPException for API errors with appropriate status codes
```python
from fastapi import HTTPException

raise HTTPException(status_code=500, detail="Database connection failed")
raise HTTPException(status_code=500, detail=str(e))
```

### CORS Configuration
```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### Environment Variable Access
```python
from dotenv import load_dotenv
import os

load_dotenv()

# Access with defaults
port=int(os.getenv("DB_PORT", 3306))

# Direct access
host=os.getenv("DB_HOST")
```

### SQL Query Patterns
- Use multi-line strings for complex queries (3/4 files)
- Use LEFT JOIN for optional relationships
- Use parameterized queries for dynamic filters
```python
query = """
    SELECT 
        e.employee_code,
        e.first_name,
        d.dept_name as department
    FROM employees e
    LEFT JOIN departments d ON e.dept_id = d.dept_id
    ORDER BY e.emp_id
"""

# Dynamic query building
params = []
if start_date and end_date:
    query += " WHERE a.attendance_date BETWEEN %s AND %s"
    params = [start_date, end_date]

cursor.execute(query, params)
```

### Data Export Patterns
- CSV export using pandas and StreamingResponse
```python
import pandas as pd
import io
from fastapi.responses import StreamingResponse

df = pd.DataFrame(employees)
csv_buffer = io.StringIO()
df.to_csv(csv_buffer, index=False)
csv_buffer.seek(0)

return StreamingResponse(
    io.BytesIO(csv_buffer.getvalue().encode()),
    media_type="text/csv",
    headers={"Content-Disposition": "attachment; filename=employees_export.csv"}
)
```

## Code Idioms

### Conditional Aggregation in SQL
```python
# Calculate percentages and conditional counts
SUM(CASE WHEN a.attendance_status = 'Present' THEN 1 ELSE 0 END) as present
AVG(CASE WHEN e.status = 'Active' THEN 1 ELSE 0 END) * 100 as active_percentage
```

### Format String Logging
```python
# Use f-strings for log messages with variables
logger.info(f"Employee export requested - format: {format}")
logger.info(f"CSV export generated: {len(employees)} employees")
```

### Conditional Expressions
```python
# Ternary-style display for sensitive data
print(f"{var}: {'[SET]' if value else '[NOT SET]'}")
```

### Dictionary Unpacking for Metadata
```python
# Consistent metadata structure
"metadata": {
    "total_records": len(data),
    "generated_at": pd.Timestamp.now().isoformat(),
    "date_range": {"start": start_date, "end": end_date}
}
```

## Testing and Debugging

### Connection Testing Pattern
- Comprehensive environment variable checking
- Detailed error output with traceback
- Visual separators for test output
```python
if __name__ == "__main__":
    print("Database Connection Test")
    print("=" * 50)
    test_connection()
    print("=" * 50)
```

### Debug Information
- Print current working directory and file existence
- Mask sensitive values in output (`[SET]` vs `[NOT SET]`)
- Use traceback.print_exc() for full error details

## Best Practices Summary

1. **Always validate database connections** before executing queries
2. **Always close database resources** (cursors and connections)
3. **Use logging extensively** for debugging and monitoring
4. **Return consistent response structures** across all endpoints
5. **Handle errors gracefully** with appropriate HTTP status codes
6. **Use environment variables** for all configuration
7. **Document all public API endpoints** with docstrings
8. **Use async handlers** for API routes
9. **Parameterize SQL queries** to prevent injection
10. **Include metadata** in API responses for context
