import { useEffect, useState } from "react";
import EmployeeTable from "../components/EmployeeTable";
import EmployeeForm from "../components/EmployeeForm";
import SearchBar from "../components/SearchBar";
import {
  getEmployees,
  createEmployee,
  deleteEmployee,
  updateEmployee,
} from "../api/employeeService";
import Pagination from "../components/Pagination";
import { useModal } from "../context/ModalContext";
import Modal from "../components/Modal";
import toast from "react-hot-toast";
import { useAuth } from '../context/AuthContext';
import axiosInstance from '../api/axiosInstance';

function EmployeesPage() {

  // ===============================
  // STATES
  // ===============================
  const { showConfirmDelete, showSuccess, showError } = useModal();
  const { isManager, isAdmin, isHR, isLoading: authLoading } = useAuth();
  const canManageEmployees = isAdmin() || isHR();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [editingEmployee, setEditingEmployee] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [allEmployees, setAllEmployees] = useState([]);

  // ===============================
  // FETCH EMPLOYEES
  // ===============================
  const fetchEmployees = async () => {
    try {
      setLoading(true);
      let employeeList = [];
      
      if (isManager()) {
        const response = await axiosInstance.get(
          '/employees/team'
        );
        employeeList = response.data.data || [];
      } else {
        const response = await getEmployees(1, 1000, "");
        employeeList = Array.isArray(response.data.data)
          ? response.data.data : [];
      }
      
      setAllEmployees(employeeList);
      setEmployees(employeeList);
    } catch (err) {
      console.error("Failed to fetch employees:", err);
      setError("Failed to fetch employees");
    } finally {
      setLoading(false);
    }
  };

  // ===============================
  // INITIAL LOAD
  // ===============================
  useEffect(() => {
    if (!authLoading) {
      fetchEmployees();
    }
  }, [authLoading]);

  // ===============================
  // Reset page when search changes
  useEffect(() => {
    setPage(1);
  }, [searchQuery]);

  const clearFilters = () => {
    setSearchQuery('');
    setPage(1);
  };

  // SEARCH FILTER LOGIC
  // ===============================
  const filteredEmployees = allEmployees.filter(item => {
    const query = searchQuery.toLowerCase();
    return (
      item.first_name?.toLowerCase().includes(query) ||
      item.last_name?.toLowerCase().includes(query) ||
      item.email?.toLowerCase().includes(query) ||
      item.employee_code?.toLowerCase().includes(query) ||
      item.phone?.toLowerCase().includes(query)
    );
  });

  // Reset page when search changes
  useEffect(() => {
    setPage(1);
  }, [searchQuery]);

  // Pagination for filtered results
  const itemsPerPage = 10;
  const totalPagesFiltered = Math.ceil(filteredEmployees.length / itemsPerPage);
  const paginatedEmployees = filteredEmployees.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  );

  // ===============================
  // ADD OR UPDATE EMPLOYEE
  // ===============================
  const handleSaveEmployee = async (employeeData) => {
    if (employeeData === null) {
      setEditingEmployee(null);
      setIsModalOpen(false);
      return;
    }
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      if (editingEmployee) {
        await updateEmployee(editingEmployee.emp_id, employeeData);
        toast.success('Employee updated successfully!', {
          duration: 4000,
          style: {
            background: '#10B981',
            color: '#fff',
            fontWeight: '600',
            borderRadius: '10px',
            padding: '16px 24px',
          }
        });
      } else {
        await createEmployee(employeeData);
        toast.success('Employee added successfully!', {
          duration: 4000,
          style: {
            background: '#10B981',
            color: '#fff',
            fontWeight: '600',
            borderRadius: '10px',
            padding: '16px 24px',
          }
        });
      }
      setSearchQuery('');
      setPage(1);
      await fetchEmployees();
      setEditingEmployee(null);
      setIsModalOpen(false);
    } catch (err) {
      const errorMessage = err.response?.data?.message || 
        err.message || "Failed to save employee";
      toast.error(errorMessage, {
        duration: 4000,
        style: {
          background: '#EF4444',
          color: '#fff',
          fontWeight: '600',
          borderRadius: '10px',
          padding: '16px 24px',
        }
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // ===============================
  // DELETE EMPLOYEE
  // ===============================
  const handleDeleteEmployee = async (id) => {
    const employee = employees.find(emp => emp.emp_id === id);
    const employeeName = employee ? `${employee.first_name} ${employee.last_name}` : 'this employee';
    
    showConfirmDelete(
      employeeName,
      async () => {
        try {
          await deleteEmployee(id);
          toast('Employee deleted!', {
            duration: 4000,
            icon: '🗑️',
            style: {
              background: '#F97316',
              color: '#fff',
              fontWeight: '600',
              borderRadius: '10px',
              padding: '16px 24px',
            }
          });
          // Reset search and page
          setSearchQuery('');
          setPage(1);
          await fetchEmployees();
        } catch (err) {
          const errorMessage = err.response?.data?.message || err.message || "Failed to delete employee";
          toast.error(errorMessage, {
            duration: 4000,
            style: {
              background: '#EF4444',
              color: '#fff',
              fontWeight: '600',
              borderRadius: '10px',
              padding: '16px 24px',
            }
          });
        }
      },
      `Employee ID: ${id}\nName: ${employeeName}\nEmail: ${employee?.email || 'N/A'}\nPosition: ${employee?.position || 'N/A'}`
    );
  };

  // ===============================
  // EDIT CLICK
  // ===============================
  const handleEditEmployee = (employee) => {
    setEditingEmployee(employee);
    setIsModalOpen(true);
  };

  // ===============================
  // ADD CLICK
  // ===============================
  const handleAddEmployee = () => {
    setEditingEmployee(null);
    setIsModalOpen(true);
  };

  // ===============================
  // UI
  // ===============================
  return (
    <div>

      {/* HEADER */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Employees</h2>
        {canManageEmployees && (
          <button
            onClick={handleAddEmployee}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Employee
          </button>
        )}
      </div>

      {/* SEARCH BAR */}
      <div className="flex justify-between items-center mb-4">
        <div className="text-sm text-gray-600">
          Showing {filteredEmployees.length} of {allEmployees.length} employees
        </div>
        <SearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search by name, email, or employee code..."
        />
      </div>

      {/* TABLE */}
      <div>
        {loading && (
          <p className="text-center py-8 text-gray-500">Loading employees...</p>
        )}

        {error && (
          <p className="text-center py-8 text-red-500">{error}</p>
        )}

        {!loading && !error && (
          <>
            {filteredEmployees.length === 0 && searchQuery && (
              <div className="text-center py-12 px-4">
                <p className="text-base text-gray-600 mb-2">
                  🔍 No results found for "{searchQuery}"
                </p>
                <p className="text-sm text-gray-500 mb-4">
                  Try different keywords or clear all filters
                </p>
                <button 
                  onClick={clearFilters}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Clear Filters
                </button>
              </div>
            )}

            {filteredEmployees.length > 0 && (
              <>
                <EmployeeTable
                  employees={paginatedEmployees}
                  onDelete={handleDeleteEmployee}
                  onEdit={handleEditEmployee}
                  loading={loading}
                />

                <div className="mt-6">
                  <Pagination
                    page={page}
                    totalPages={totalPagesFiltered}
                    onPageChange={setPage}
                  />
                </div>
              </>
            )}
          </>
        )}
      </div>

      {/* MODAL */}
      {canManageEmployees && (
        <Modal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setEditingEmployee(null);
          }}
          title={editingEmployee ? "Edit Employee" : "Add Employee"}
          size="lg"
        >
          <EmployeeForm
            onEmployeeAdded={handleSaveEmployee}
            editingEmployee={editingEmployee}
          />
        </Modal>
      )}
    </div>
  );
}

export default EmployeesPage;