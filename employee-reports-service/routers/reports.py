from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import StreamingResponse
from database import get_connection
from security import require_tenant_context
import pandas as pd
import io
import logging
from logging.handlers import RotatingFileHandler
import os
from datetime import datetime

router = APIRouter()

log_dir = 'logs'
os.makedirs(log_dir, exist_ok=True)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        RotatingFileHandler(os.path.join(log_dir, 'reports_service.log'), maxBytes=10485760, backupCount=5),
        logging.StreamHandler(),
    ],
)
logger = logging.getLogger(__name__)


def _validate_date_range(start_date: str = None, end_date: str = None) -> tuple:
    parsed_start = None
    parsed_end = None

    if start_date:
        try:
            parsed_start = datetime.strptime(start_date, '%Y-%m-%d').date()
        except ValueError as exc:
            raise HTTPException(status_code=400, detail='start_date must be in YYYY-MM-DD format') from exc

    if end_date:
        try:
            parsed_end = datetime.strptime(end_date, '%Y-%m-%d').date()
        except ValueError as exc:
            raise HTTPException(status_code=400, detail='end_date must be in YYYY-MM-DD format') from exc

    if parsed_start and parsed_end and parsed_end < parsed_start:
        raise HTTPException(status_code=400, detail='end_date cannot be earlier than start_date')

    return parsed_start, parsed_end


@router.get('/employees/export')
async def export_employees(format: str = 'csv', tenant_id: int = Depends(require_tenant_context)):
    logger.info(f'Employee export requested - tenant: {tenant_id} format: {format}')
    requested_format = format.lower()
    if requested_format not in {'json', 'csv'}:
        raise HTTPException(status_code=400, detail='format must be either json or csv')

    conn = None
    cursor = None
    try:
        conn = get_connection()
        if not conn:
            raise HTTPException(status_code=500, detail='Database connection failed')

        cursor = conn.cursor(dictionary=True)
        cursor.execute(
            '''
            SELECT
                e.employee_code,
                e.first_name,
                e.last_name,
                e.email,
                e.phone,
                e.hire_date,
                e.status,
                d.dept_name as department,
                p.position_title as position
            FROM employees e
            LEFT JOIN departments d ON e.tenant_id = d.tenant_id AND e.dept_id = d.dept_id
            LEFT JOIN positions p ON e.tenant_id = p.tenant_id AND e.position_id = p.position_id
            WHERE e.tenant_id = %s
            ORDER BY e.emp_id
            ''',
            (tenant_id,),
        )

        employees = cursor.fetchall()

        if requested_format == 'json':
            return {
                'success': True,
                'data': employees,
                'metadata': {
                    'total_records': len(employees),
                    'generated_at': pd.Timestamp.now().isoformat(),
                    'format': 'json',
                    'tenant_id': tenant_id,
                },
            }

        df = pd.DataFrame(employees)
        csv_buffer = io.StringIO()
        df.to_csv(csv_buffer, index=False)
        csv_buffer.seek(0)

        return StreamingResponse(
            io.BytesIO(csv_buffer.getvalue().encode()),
            media_type='text/csv',
            headers={'Content-Disposition': 'attachment; filename=employees_export.csv'},
        )
    except HTTPException:
        raise
    except Exception:
        logger.exception('Error exporting employees')
        raise HTTPException(status_code=500, detail='Database operation failed')
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()


@router.get('/departments/summary')
async def department_summary(tenant_id: int = Depends(require_tenant_context)):
    logger.info(f'Department summary requested - tenant: {tenant_id}')

    conn = None
    cursor = None
    try:
        conn = get_connection()
        if not conn:
            raise HTTPException(status_code=500, detail='Database connection failed')

        cursor = conn.cursor(dictionary=True)
        cursor.execute(
            '''
            SELECT
                d.dept_name,
                COUNT(e.emp_id) as employee_count,
                AVG(CASE WHEN e.status = 'Active' THEN 1 ELSE 0 END) * 100 as active_percentage
            FROM departments d
            LEFT JOIN employees e ON d.tenant_id = e.tenant_id AND d.dept_id = e.dept_id
            WHERE d.tenant_id = %s
            GROUP BY d.dept_name
            ORDER BY employee_count DESC
            ''',
            (tenant_id,),
        )

        departments = cursor.fetchall()

        return {
            'success': True,
            'data': departments,
            'metadata': {
                'total_departments': len(departments),
                'generated_at': pd.Timestamp.now().isoformat(),
                'tenant_id': tenant_id,
            },
        }
    except HTTPException:
        raise
    except Exception:
        logger.exception('Error generating department summary')
        raise HTTPException(status_code=500, detail='Database operation failed')
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()


@router.get('/attendance/summary')
async def attendance_summary(
    start_date: str = None,
    end_date: str = None,
    tenant_id: int = Depends(require_tenant_context),
):
    logger.info(f'Attendance summary requested - tenant: {tenant_id}, start: {start_date}, end: {end_date}')
    _validate_date_range(start_date=start_date, end_date=end_date)

    conn = None
    cursor = None
    try:
        conn = get_connection()
        if not conn:
            raise HTTPException(status_code=500, detail='Database connection failed')

        cursor = conn.cursor(dictionary=True)

        query = '''
            SELECT
                DATE(a.attendance_date) as date,
                COUNT(*) as total_records,
                SUM(CASE WHEN a.attendance_status = 'Present' THEN 1 ELSE 0 END) as present,
                SUM(CASE WHEN a.attendance_status = 'Absent' THEN 1 ELSE 0 END) as absent,
                SUM(CASE WHEN a.attendance_status = 'Half Day' THEN 1 ELSE 0 END) as half_day,
                d.dept_name as department
            FROM attendance a
            LEFT JOIN employees e ON a.tenant_id = e.tenant_id AND a.emp_id = e.emp_id
            LEFT JOIN departments d ON e.tenant_id = d.tenant_id AND e.dept_id = d.dept_id
            WHERE a.tenant_id = %s
        '''

        params = [tenant_id]
        if start_date and end_date:
            query += ' AND a.attendance_date BETWEEN %s AND %s'
            params.extend([start_date, end_date])
        elif start_date:
            query += ' AND a.attendance_date >= %s'
            params.append(start_date)
        elif end_date:
            query += ' AND a.attendance_date <= %s'
            params.append(end_date)

        query += ' GROUP BY DATE(a.attendance_date), d.dept_name ORDER BY date DESC'

        cursor.execute(query, params)
        attendance_data = cursor.fetchall()

        return {
            'success': True,
            'data': attendance_data,
            'metadata': {
                'total_records': len(attendance_data),
                'date_range': {'start': start_date, 'end': end_date},
                'generated_at': pd.Timestamp.now().isoformat(),
                'tenant_id': tenant_id,
            },
        }
    except HTTPException:
        raise
    except Exception:
        logger.exception('Error generating attendance summary')
        raise HTTPException(status_code=500, detail='Database operation failed')
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()


@router.get('/attendance/export')
async def export_attendance_csv(
    start_date: str = None,
    end_date: str = None,
    tenant_id: int = Depends(require_tenant_context),
):
    logger.info(f'Attendance CSV export requested - tenant: {tenant_id}, start: {start_date}, end: {end_date}')
    _validate_date_range(start_date=start_date, end_date=end_date)

    conn = None
    cursor = None
    try:
        conn = get_connection()
        if not conn:
            raise HTTPException(status_code=500, detail='Database connection failed')

        cursor = conn.cursor(dictionary=True)

        query = '''
            SELECT
                DATE(a.attendance_date) as date,
                d.dept_name as department,
                COUNT(*) as total_records,
                SUM(CASE WHEN a.attendance_status = 'Present' THEN 1 ELSE 0 END) as present,
                SUM(CASE WHEN a.attendance_status = 'Absent' THEN 1 ELSE 0 END) as absent,
                SUM(CASE WHEN a.attendance_status = 'Half Day' THEN 1 ELSE 0 END) as half_day
            FROM attendance a
            LEFT JOIN employees e ON a.tenant_id = e.tenant_id AND a.emp_id = e.emp_id
            LEFT JOIN departments d ON e.tenant_id = d.tenant_id AND e.dept_id = d.dept_id
            WHERE a.tenant_id = %s
        '''

        params = [tenant_id]
        if start_date and end_date:
            query += ' AND a.attendance_date BETWEEN %s AND %s'
            params.extend([start_date, end_date])
        elif start_date:
            query += ' AND a.attendance_date >= %s'
            params.append(start_date)
        elif end_date:
            query += ' AND a.attendance_date <= %s'
            params.append(end_date)

        query += ' GROUP BY DATE(a.attendance_date), d.dept_name ORDER BY date DESC'

        cursor.execute(query, params)
        attendance_data = cursor.fetchall()

        df = pd.DataFrame(attendance_data)
        csv_buffer = io.StringIO()
        df.to_csv(csv_buffer, index=False)
        csv_buffer.seek(0)

        date_suffix = f'{start_date}_to_{end_date}' if start_date and end_date else 'all'
        filename = f'attendance_report_{date_suffix}.csv'

        return StreamingResponse(
            io.BytesIO(csv_buffer.getvalue().encode()),
            media_type='text/csv',
            headers={'Content-Disposition': f'attachment; filename={filename}'},
        )
    except HTTPException:
        raise
    except Exception:
        logger.exception('Error exporting attendance CSV')
        raise HTTPException(status_code=500, detail='Database operation failed')
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()


@router.get('/employees/export-excel')
async def export_employees_excel(tenant_id: int = Depends(require_tenant_context)):
    logger.info(f'Employee Excel export requested - tenant: {tenant_id}')

    conn = None
    cursor = None
    try:
        conn = get_connection()
        if not conn:
            raise HTTPException(status_code=500, detail='Database connection failed')

        cursor = conn.cursor(dictionary=True)
        cursor.execute(
            '''
            SELECT
                e.employee_code,
                e.first_name,
                e.last_name,
                e.email,
                e.phone,
                e.hire_date,
                e.status,
                d.dept_name as department,
                p.position_title as position
            FROM employees e
            LEFT JOIN departments d ON e.tenant_id = d.tenant_id AND e.dept_id = d.dept_id
            LEFT JOIN positions p ON e.tenant_id = p.tenant_id AND e.position_id = p.position_id
            WHERE e.tenant_id = %s
            ORDER BY e.emp_id
            ''',
            (tenant_id,),
        )

        employees = cursor.fetchall()

        df = pd.DataFrame(employees)
        excel_buffer = io.BytesIO()
        with pd.ExcelWriter(excel_buffer, engine='openpyxl') as writer:
            df.to_excel(writer, sheet_name='Employees', index=False)
        excel_buffer.seek(0)

        return StreamingResponse(
            excel_buffer,
            media_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            headers={'Content-Disposition': 'attachment; filename=employees_export.xlsx'},
        )
    except HTTPException:
        raise
    except Exception:
        logger.exception('Error exporting employees to Excel')
        raise HTTPException(status_code=500, detail='Database operation failed')
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()


@router.get('/test')
def test_endpoint():
    return {'message': 'Reports API is working', 'status': 'healthy'}
