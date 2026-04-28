# AGENTS.md — Employee Reports Service

## Role

Act as a senior Python backend engineer working on a production-style FastAPI microservice.

Be strict, practical, and audit-first. Do not make broad changes without understanding the existing code.

---

## Repository Purpose

This service is the Python reporting and analytics microservice for the Employee Management System.

It is responsible for:

- Employee reports
- Attendance reports
- Excel exports
- Data analytics using Python/Pandas
- Future ML/AI features
- Integration with the main Node.js employee-api backend

---

## Expected Tech Stack

- Python
- FastAPI
- Uvicorn
- Pydantic
- Pandas
- MySQL connector / SQLAlchemy if already present
- python-dotenv
- openpyxl for Excel export
- Structured logging

Do not replace the stack unless explicitly requested.

---

## Engineering Rules

Before changing code:

1. Read the full project structure.
2. Identify existing working endpoints.
3. Identify existing database logic.
4. Identify existing export/report logic.
5. Reuse existing code where possible.
6. Do not duplicate systems.
7. Do not remove working functionality.
8. Do not rename endpoints unless explicitly asked.
9. Do not hardcode secrets, credentials, ports, or database values.
10. Keep `.env` based configuration.

---

## Code Standards

Use:

- Type hints
- Clear function names
- Small service functions
- Pydantic schemas for request/response validation
- Centralized configuration
- Centralized database connection logic
- Centralized error handling
- Structured logging

Avoid:

- Large functions
- Inline SQL scattered everywhere
- Hardcoded database config
- Silent error swallowing
- Duplicate route logic
- Unused imports
- Over-engineering

---

## Preferred Structure

Use this structure unless the existing repo strongly requires otherwise:

```text
app/
  main.py
  core/
    config.py
    logging.py
    exceptions.py
  db/
    connection.py
  routes/
    health.py
    reports.py
    analytics.py
  services/
    report_service.py
    analytics_service.py
  schemas/
    report_schema.py
  utils/
    excel_exporter.py
requirements.txt
.env.example
README.md