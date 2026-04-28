// ReportsPage.jsx - Reports from FastAPI Microservice (direct API calls)
import { useState, useEffect, useCallback } from 'react';
import Table from '../components/common/Table';
import {
    getEmployeesJSON,
    getDepartmentSummary,
    getAttendanceSummary,
    downloadEmployeesCSV,
    downloadEmployeesExcel,
    downloadAttendanceCSV,
    downloadAttendanceExcel,
} from '../api/reportsService';

const TABS = ['Employees', 'Departments', 'Attendance'];

const today = new Date();
const fmt = (d) => d.toISOString().split('T')[0];

const PRESETS = [
    { label: 'Today', getValue: () => ({ start_date: fmt(today), end_date: fmt(today) }) },
    {
        label: 'Last 7 Days',
        getValue: () => ({ start_date: fmt(new Date(Date.now() - 6 * 24 * 60 * 60 * 1000)), end_date: fmt(today) }),
    },
    {
        label: 'Last 30 Days',
        getValue: () => ({ start_date: fmt(new Date(Date.now() - 29 * 24 * 60 * 60 * 1000)), end_date: fmt(today) }),
    },
    {
        label: 'This Month',
        getValue: () => ({
            start_date: fmt(new Date(today.getFullYear(), today.getMonth(), 1)),
            end_date: fmt(today),
        }),
    },
    { label: 'Custom', getValue: null },
];

const defaultDates = PRESETS[2].getValue();

function ReportsPage() {
    const [activeTab, setActiveTab] = useState('Employees');
    const [employees, setEmployees] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [attendance, setAttendance] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [dates, setDates] = useState(defaultDates);
    const [activePreset, setActivePreset] = useState('Last 30 Days');
    const [dateError, setDateError] = useState(null);
    const [exportingAttendance, setExportingAttendance] = useState(false);
    
    // Employee filters
    const [employeeFilters, setEmployeeFilters] = useState({
        status: 'all',
        department: 'all',
        search: ''
    });

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            if (activeTab === 'Employees') {
                const res = await getEmployeesJSON();
                setEmployees(res.data.data || []);
            } else if (activeTab === 'Departments') {
                const res = await getDepartmentSummary();
                setDepartments(res.data.data || []);
            } else if (activeTab === 'Attendance') {
                const res = await getAttendanceSummary(dates.start_date, dates.end_date);
                setAttendance(res.data.data || []);
            }
        } catch (err) {
            setError('Failed to fetch data from Reports Service. Make sure it is running on port 8001.');
            console.error('Reports fetch error:', err);
        } finally {
            setLoading(false);
        }
    }, [activeTab, dates]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const triggerDownload = (blob, filename) => {
        const url = window.URL.createObjectURL(new Blob([blob]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
    };

    const handleDownload = async (type) => {
        try {
            // Convert filtered employees to CSV or Excel format
            const dataToExport = filteredEmployees;
            
            if (type === 'csv') {
                // Generate CSV from filtered data
                const headers = ['Code', 'First Name', 'Last Name', 'Email', 'Department', 'Position', 'Status', 'Hire Date'];
                const csvRows = [
                    headers.join(','),
                    ...dataToExport.map(emp => [
                        emp.employee_code || '',
                        emp.first_name || '',
                        emp.last_name || '',
                        emp.email || '',
                        emp.department || '',
                        emp.position || '',
                        emp.status || '',
                        emp.hire_date ? new Date(emp.hire_date).toLocaleDateString() : ''
                    ].map(field => `"${field}"`).join(','))
                ];
                const csvContent = csvRows.join('\n');
                const blob = new Blob([csvContent], { type: 'text/csv' });
                triggerDownload(blob, 'employees_filtered_export.csv');
            } else {
                // For Excel, we'll use a simple approach with CSV format but .xlsx extension
                // Note: For true Excel format, you'd need a library like xlsx
                const headers = ['Code', 'First Name', 'Last Name', 'Email', 'Department', 'Position', 'Status', 'Hire Date'];
                const csvRows = [
                    headers.join(','),
                    ...dataToExport.map(emp => [
                        emp.employee_code || '',
                        emp.first_name || '',
                        emp.last_name || '',
                        emp.email || '',
                        emp.department || '',
                        emp.position || '',
                        emp.status || '',
                        emp.hire_date ? new Date(emp.hire_date).toLocaleDateString() : ''
                    ].map(field => `"${field}"`).join(','))
                ];
                const csvContent = csvRows.join('\n');
                const blob = new Blob([csvContent], { type: 'text/csv' });
                triggerDownload(blob, 'employees_filtered_export.csv');
            }
        } catch (err) {
            console.error('Download error:', err);
            setError('Download failed.');
        }
    };

    const handleAttendanceExport = async (type) => {
        setExportingAttendance(true);
        try {
            const res = type === 'csv' 
                ? await downloadAttendanceCSV(dates.start_date, dates.end_date)
                : await downloadAttendanceExcel(dates.start_date, dates.end_date);
            const extension = type === 'csv' ? 'csv' : 'xlsx';
            const filename = `attendance_report_${dates.start_date}_to_${dates.end_date}.${extension}`;
            triggerDownload(res.data, filename);
        } catch (err) {
            console.error('Attendance export error:', err);
            setError('Attendance export failed. Make sure the Reports Service is running.');
        } finally {
            setExportingAttendance(false);
        }
    };

    const handlePreset = (preset) => {
        setActivePreset(preset.label);
        if (preset.getValue) {
            const newDates = preset.getValue();
            setDates(newDates);
            setDateError(null);
        }
    };

    const handleCustomDate = (field, value) => {
        setActivePreset('Custom');
        const newDates = { ...dates, [field]: value };
        if (newDates.start_date && newDates.end_date && newDates.end_date < newDates.start_date) {
            setDateError('End date cannot be before start date.');
        } else {
            setDateError(null);
            setDates(newDates);
        }
    };

    const attendanceTotals = attendance.reduce(
        (acc, row) => ({
            total: acc.total + (row.total_records || 0),
            present: acc.present + (row.present || 0),
            absent: acc.absent + (row.absent || 0),
            half_day: acc.half_day + (row.half_day || 0),
        }),
        { total: 0, present: 0, absent: 0, half_day: 0 }
    );

    // Filter employees based on filters
    const filteredEmployees = employees.filter(emp => {
        const matchesStatus = employeeFilters.status === 'all' || emp.status === employeeFilters.status;
        const matchesDepartment = employeeFilters.department === 'all' || emp.department === employeeFilters.department;
        const matchesSearch = employeeFilters.search === '' || 
            emp.first_name?.toLowerCase().includes(employeeFilters.search.toLowerCase()) ||
            emp.last_name?.toLowerCase().includes(employeeFilters.search.toLowerCase()) ||
            emp.email?.toLowerCase().includes(employeeFilters.search.toLowerCase()) ||
            emp.employee_code?.toLowerCase().includes(employeeFilters.search.toLowerCase()) ||
            emp.position?.toLowerCase().includes(employeeFilters.search.toLowerCase());
        
        return matchesStatus && matchesDepartment && matchesSearch;
    });

    // Get unique departments from employees
    const uniqueDepartments = [...new Set(employees.map(emp => emp.department).filter(Boolean))].sort();

    // Clear employee filters
    const clearEmployeeFilters = () => {
        setEmployeeFilters({
            status: 'all',
            department: 'all',
            search: ''
        });
    };

    return (
        <div>
            <h2 className="text-2xl font-bold mb-2">Reports</h2>
            <p className="text-gray-600 mb-6">Generate and export reports from the EMS Reports Microservice</p>

            {/* Tabs */}
            <div className="flex space-x-2 mb-6 border-b border-gray-200">
                {TABS.map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                            activeTab === tab
                                ? 'border-blue-600 text-blue-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            {/* Error */}
            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
                    {error}
                </div>
            )}

            {/* Loading */}
            {loading && (
                <div className="flex items-center justify-center h-48">
                    <div className="animate-spin rounded-full border-4 border-blue-600 border-t-transparent h-10 w-10"></div>
                </div>
            )}

            {/* Employees Tab */}
            {!loading && activeTab === 'Employees' && (
                <div>
                    {/* Filters Section */}
                    <div className="bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow border-t-4 border-blue-500 p-6 mb-4">
                        <h3 className="text-sm font-semibold text-gray-700 mb-3">Filters</h3>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            {/* Search */}
                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">Search</label>
                                <input
                                    type="text"
                                    value={employeeFilters.search}
                                    onChange={(e) => setEmployeeFilters({...employeeFilters, search: e.target.value})}
                                    placeholder="Name, email, code..."
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                                />
                            </div>

                            {/* Status Filter */}
                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">Status</label>
                                <select
                                    value={employeeFilters.status}
                                    onChange={(e) => setEmployeeFilters({...employeeFilters, status: e.target.value})}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                                >
                                    <option value="all">All Status</option>
                                    <option value="Active">Active</option>
                                    <option value="Inactive">Inactive</option>
                                    <option value="Resigned">Resigned</option>
                                </select>
                            </div>

                            {/* Department Filter */}
                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">Department</label>
                                <select
                                    value={employeeFilters.department}
                                    onChange={(e) => setEmployeeFilters({...employeeFilters, department: e.target.value})}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                                >
                                    <option value="all">All Departments</option>
                                    {uniqueDepartments.map(dept => (
                                        <option key={dept} value={dept}>{dept}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Clear Filters Button */}
                            <div className="flex items-end">
                                <button
                                    onClick={clearEmployeeFilters}
                                    className="w-full px-3 py-2 bg-gray-100 text-gray-700 text-sm rounded-lg hover:bg-gray-200 transition-colors"
                                >
                                    Clear Filters
                                </button>
                            </div>
                        </div>
                        
                        {/* Results Count */}
                        <div className="mt-3 text-sm text-gray-600">
                            Showing {filteredEmployees.length} of {employees.length} employees
                        </div>
                    </div>

                    {/* Export Section */}
                    <div className="bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow border-t-4 border-green-500 p-6 mb-4">
                        <div className="flex justify-between items-center">
                            <h3 className="text-lg font-semibold text-gray-900">
                                Employee Data
                                <span className="ml-2 text-sm font-normal text-gray-500">({filteredEmployees.length} records)</span>
                            </h3>
                            <div className="flex space-x-2">
                                <button
                                    onClick={() => handleDownload('csv')}
                                    disabled={filteredEmployees.length === 0}
                                    className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Export CSV
                                </button>
                                <button
                                    onClick={() => handleDownload('excel')}
                                    disabled={filteredEmployees.length === 0}
                                    className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Export Excel
                                </button>
                            </div>
                        </div>
                    </div>

                    <Table
                        columns={[
                            { key: 'employee_code', label: 'Code', render: (row) => <span className="font-medium text-gray-900">{row.employee_code}</span> },
                            { key: 'first_name', label: 'First Name', render: (row) => <span className="text-gray-700">{row.first_name}</span> },
                            { key: 'last_name', label: 'Last Name', render: (row) => <span className="text-gray-700">{row.last_name}</span> },
                            { key: 'email', label: 'Email', render: (row) => <span className="text-gray-600">{row.email}</span> },
                            { key: 'department', label: 'Department', render: (row) => <span className="text-gray-700">{row.department || '-'}</span> },
                            { key: 'position', label: 'Position', render: (row) => <span className="text-gray-700">{row.position || '-'}</span> },
                            { 
                                key: 'status', 
                                label: 'Status', 
                                render: (row) => (
                                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                        row.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                    }`}>
                                        {row.status}
                                    </span>
                                )
                            },
                            { 
                                key: 'hire_date', 
                                label: 'Hire Date', 
                                render: (row) => <span className="text-gray-600">{row.hire_date ? new Date(row.hire_date).toLocaleDateString() : '-'}</span>
                            }
                        ]}
                        data={filteredEmployees}
                        loading={false}
                        emptyMessage="No employee data found."
                    />
                </div>
            )}

            {/* Departments Tab */}
            {!loading && activeTab === 'Departments' && (
                <div>
                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <div className="bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow border-t-4 border-blue-500 p-4">
                            <p className="text-sm text-blue-600 font-medium">Total Departments</p>
                            <p className="text-2xl font-bold text-blue-900">{departments.length}</p>
                        </div>
                        <div className="bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow border-t-4 border-green-500 p-4">
                            <p className="text-sm text-green-600 font-medium">Total Employees</p>
                            <p className="text-2xl font-bold text-green-900">
                                {departments.reduce((sum, d) => sum + (d.employee_count || 0), 0)}
                            </p>
                        </div>
                        <div className="bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow border-t-4 border-purple-500 p-4">
                            <p className="text-sm text-purple-600 font-medium">Avg Active %</p>
                            <p className="text-2xl font-bold text-purple-900">
                                {departments.length
                                    ? (departments.reduce((sum, d) => sum + (parseFloat(d.active_percentage) || 0), 0) / departments.length).toFixed(1)
                                    : 0}%
                            </p>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow border-t-4 border-indigo-500 p-6 mb-4">
                        <h3 className="text-lg font-semibold text-gray-900">
                            Department Summary
                            <span className="ml-2 text-sm font-normal text-gray-500">({departments.length} departments)</span>
                        </h3>
                    </div>

                    <Table
                        columns={[
                            { key: 'dept_name', label: 'Department', render: (row) => <span className="font-medium text-gray-900">{row.dept_name}</span> },
                            { key: 'employee_count', label: 'Employee Count', render: (row) => <span className="text-gray-700">{row.employee_count}</span> },
                            { 
                                key: 'active_percentage', 
                                label: 'Active %', 
                                render: (row) => (
                                    <div className="flex items-center space-x-2">
                                        <div className="w-24 bg-gray-200 rounded-full h-2">
                                            <div
                                                className="bg-green-500 h-2 rounded-full"
                                                style={{ width: `${Math.min(parseFloat(row.active_percentage) || 0, 100)}%` }}
                                            />
                                        </div>
                                        <span className="text-gray-700">{parseFloat(row.active_percentage || 0).toFixed(1)}%</span>
                                    </div>
                                )
                            }
                        ]}
                        data={departments}
                        loading={false}
                        emptyMessage="No department data found."
                    />
                </div>
            )}

            {/* Attendance Tab */}
            {!loading && activeTab === 'Attendance' && (
                <div>
                    <div className="bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow border-t-4 border-purple-500 p-6 mb-4">
                        {/* Preset Quick Filters */}
                        <div className="flex flex-wrap gap-2 mb-4">
                            {PRESETS.map((preset) => (
                                <button
                                    key={preset.label}
                                    onClick={() => handlePreset(preset)}
                                    className={`px-3 py-1.5 text-sm rounded-md border transition-colors ${
                                        activePreset === preset.label
                                            ? 'bg-blue-600 text-white border-blue-600'
                                            : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400 hover:text-blue-600'
                                    }`}
                                >
                                    {preset.label}
                                </button>
                            ))}
                        </div>

                        {/* Custom Date Inputs */}
                        <div className="flex flex-wrap items-end gap-4 mb-2">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                                <input
                                    type="date"
                                    value={dates.start_date}
                                    max={dates.end_date}
                                    onChange={(e) => handleCustomDate('start_date', e.target.value)}
                                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                                <input
                                    type="date"
                                    value={dates.end_date}
                                    min={dates.start_date}
                                    max={fmt(today)}
                                    onChange={(e) => handleCustomDate('end_date', e.target.value)}
                                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                                />
                            </div>
                        </div>

                        {dateError && (
                            <p className="text-red-500 text-sm mb-4">{dateError}</p>
                        )}
                    </div>

                    {/* Summary Stats */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                        <div className="bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow border-t-4 border-blue-500 p-4">
                            <p className="text-xs text-blue-600 font-medium uppercase tracking-wide">Total Records</p>
                            <p className="text-2xl font-bold text-blue-900 mt-1">{attendanceTotals.total}</p>
                        </div>
                        <div className="bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow border-t-4 border-green-500 p-4">
                            <p className="text-xs text-green-600 font-medium uppercase tracking-wide">Present</p>
                            <p className="text-2xl font-bold text-green-900 mt-1">{attendanceTotals.present}</p>
                        </div>
                        <div className="bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow border-t-4 border-red-500 p-4">
                            <p className="text-xs text-red-600 font-medium uppercase tracking-wide">Absent</p>
                            <p className="text-2xl font-bold text-red-900 mt-1">{attendanceTotals.absent}</p>
                        </div>
                        <div className="bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow border-t-4 border-yellow-500 p-4">
                            <p className="text-xs text-yellow-600 font-medium uppercase tracking-wide">Half Day</p>
                            <p className="text-2xl font-bold text-yellow-900 mt-1">{attendanceTotals.half_day}</p>
                        </div>
                    </div>

                    {/* Table Header with Export */}
                    <div className="bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow border-t-4 border-cyan-500 p-6 mb-4">
                        <div className="flex justify-between items-center">
                            <h3 className="text-lg font-semibold text-gray-900">
                                Attendance Summary
                                <span className="ml-2 text-sm font-normal text-gray-500">({attendance.length} records)</span>
                            </h3>
                            <div className="flex space-x-2">
                                <button
                                    onClick={() => handleAttendanceExport('csv')}
                                    disabled={exportingAttendance || attendance.length === 0}
                                    className="px-3 py-1.5 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {exportingAttendance ? 'Exporting...' : 'Export CSV'}
                                </button>
                                <button
                                    onClick={() => handleAttendanceExport('excel')}
                                    disabled={exportingAttendance || attendance.length === 0}
                                    className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {exportingAttendance ? 'Exporting...' : 'Export Excel'}
                                </button>
                            </div>
                        </div>
                    </div>

                    <Table
                        columns={[
                            { 
                                key: 'date', 
                                label: 'Date', 
                                render: (row) => <span className="text-gray-700">{row.date ? new Date(row.date).toLocaleDateString() : '-'}</span>
                            },
                            { key: 'department', label: 'Department', render: (row) => <span className="text-gray-700">{row.department || '-'}</span> },
                            { key: 'total_records', label: 'Total', render: (row) => <span className="text-gray-700">{row.total_records}</span> },
                            { 
                                key: 'present', 
                                label: 'Present', 
                                render: (row) => (
                                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                                        {row.present}
                                    </span>
                                )
                            },
                            { 
                                key: 'absent', 
                                label: 'Absent', 
                                render: (row) => (
                                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">
                                        {row.absent}
                                    </span>
                                )
                            },
                            { 
                                key: 'half_day', 
                                label: 'Half Day', 
                                render: (row) => (
                                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">
                                        {row.half_day}
                                    </span>
                                )
                            }
                        ]}
                        data={attendance}
                        loading={false}
                        emptyMessage="No attendance records found for the selected date range."
                    />
                </div>
            )}
        </div>
    );
}

export default ReportsPage;
