# PLANS.md — Execution Plan System

This file defines how to plan and execute multi-step engineering tasks in this repository.

Use this template BEFORE making any major changes.

---

# 🧠 EXECUTION PLAN: <TASK NAME>

## 1. Goal

Define the exact outcome in one or two sentences.

Example:
Refactor the FastAPI reports service into a clean, production-style structure without breaking existing endpoints.

---

## 2. Scope

Clearly define what is INCLUDED and EXCLUDED.

### Included:
- <feature / module / file>

### Excluded:
- <anything not to be touched>

---

## 3. Current State (MANDATORY)

Document what currently exists BEFORE changing anything.

- Entry point:
- Folder structure:
- Existing endpoints:
- Database connection method:
- Logging setup:
- Error handling:
- External integrations (Node API, etc):
- Export/report features:

Do NOT skip this section.

---

## 4. Key Dependencies

List important dependencies used in this task.

Example:
- FastAPI
- Pandas
- MySQL connector
- openpyxl

---

## 5. Files to Inspect (MANDATORY)

List all files that must be read before coding.

```text
<file paths here>
```

---

## 6. Files Likely to Change

List expected files to modify or create.

```text
<file paths here>
```

---

## 7. Constraints (STRICT RULES)

These rules must NOT be violated.

- Do not break existing endpoints
- Do not remove working features
- Do not hardcode secrets
- Do not duplicate logic
- Do not introduce unnecessary frameworks
- Keep Swagger working
- Keep `.env` configuration
- Keep code readable

---

## 8. Risks

Identify possible failure points.

Example:
- Import paths breaking after refactor
- DB connection failing after config changes
- Excel export breaking due to logic movement
- API contract mismatch with Node backend

---

## 9. Execution Steps

Break work into SMALL, SAFE steps.

### Step 1 — Audit
- Read all relevant files
- Understand flow
- Identify reusable code

### Step 2 — Plan Structure
- Define folder structure
- Map old files → new structure

### Step 3 — Implement Incrementally
- Move one module at a time
- Keep app runnable after each step

### Step 4 — Add Improvements
- Error handling
- Logging
- Validation

### Step 5 — Verify
- Run service
- Test endpoints
- Validate outputs

---

## 10. Verification Checklist (MANDATORY)

All must pass before marking complete:

- [ ] App starts without errors
- [ ] `/health` works
- [ ] `/docs` loads
- [ ] Existing endpoints still work
- [ ] No feature regression
- [ ] Errors return proper responses
- [ ] Logs are readable
- [ ] No secrets exposed
- [ ] No unused code remains

---

## 11. Rollback Plan

If something breaks:

1. Revert changed files
2. Restore previous working entry point
3. Re-test original endpoints
4. Re-apply changes in smaller steps

---

## 12. Definition of Done

Task is complete ONLY if:

- Functionality works
- No regressions
- Code is clean and readable
- Swagger works
- Manual testing is done
- Changes are minimal and intentional

---

## 13. Final Report Format (MANDATORY)

After completion, output:

```text
Task: <task name>

Status: Completed / Partial / Failed

Files Changed:
- file1
- file2

Endpoints Verified:
- GET /health
- GET /docs
- <others>

Summary:
- What was done
- What improved

Issues Remaining:
- <list>

How to Run:
<command>

How to Test:
<steps>
```
