import { useEffect, useState } from "react";
import SalaryForm from "../components/SalaryForm";
import SalaryTable from "../components/SalaryTable";
import SearchBar from "../components/SearchBar";
import Pagination from "../components/Pagination";
import { useModal } from "../context/ModalContext";
import Modal from "../components/Modal";
import { formatCurrency } from "../utils/currencyFormatter";
import toast from "react-hot-toast";
import {
  getSalaryHistory,
  createSalaryHistory,
  updateSalaryHistory,
  deleteSalaryHistory
} from "../api/salaryService";
import { getEmployees } from "../api/employeeService";
import { useAuth } from "../context/AuthContext";

function SalaryPage() {
  const [allSalaryHistory, setAllSalaryHistory] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const { showConfirmDelete } = useModal();
  const [searchQuery, setSearchQuery] = useState("");
  const [editingSalary, setEditingSalary] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { isAdmin, isHR } = useAuth();
  const canManageAll = isAdmin() || isHR();

  const itemsPerPage = 10;

  const clearFilters = () => {
    setSearchQuery('');
    setPage(1);
  };

  const fetchEmployees = async () => {
    try {
      if (!canManageAll) return;
      const response = await getEmployees(1, 1000, "");
      const employeeList = Array.isArray(response.data.data)
        ? response.data.data
        : [];
      setEmployees(employeeList);
    } catch (err) {
      setError("Failed to fetch employees");
    }
  };

  const fetchSalaryHistory = async () => {
    try {
      setLoading(true);
      const response = await getSalaryHistory(1, 1000, ""); // Backend filters by role automatically
      const salaryList = Array.isArray(response.data.data)
        ? response.data.data
        : [];
      setAllSalaryHistory(salaryList);
    } catch (err) {
      console.error('Failed to fetch salary history:', err);
      setError("Failed to fetch salary history");
      setAllSalaryHistory([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
    fetchSalaryHistory();
  }, []);

  useEffect(() => {
    setPage(1);
  }, [searchQuery]);

  const filteredSalaryHistory = allSalaryHistory.filter(item => {
    const query = searchQuery.toLowerCase();
    return (
      item.first_name?.toLowerCase().includes(query) ||
      item.last_name?.toLowerCase().includes(query) ||
      item.change_reason?.toLowerCase().includes(query)
    );
  });

  const totalPagesFiltered = Math.ceil(filteredSalaryHistory.length / itemsPerPage);
  const paginatedSalaryHistory = filteredSalaryHistory.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  );

  const handleSaveSalary = async (data) => {
    try {
      if (editingSalary) {
        await updateSalaryHistory(editingSalary.salary_id, data);
        setEditingSalary(null);
        toast.success('Salary record updated successfully!', {
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
        await createSalaryHistory(data);
        toast.success('Salary record added successfully!', {
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
      await fetchSalaryHistory();
      setIsModalOpen(false);
    } catch (error) {
      toast.error('Failed to save salary record. Try again.', {
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
  };

  const handleDeleteSalary = async (id) => {
    const salaryRecord = allSalaryHistory.find(sr => sr.salary_id === id);
    const salaryDetails = salaryRecord
      ? `Salary for ${salaryRecord.first_name || ''} ${salaryRecord.last_name || ''} (${formatCurrency(salaryRecord.salary_amount)})`
      : 'this salary record';

    showConfirmDelete(
      salaryDetails,
      async () => {
        try {
          await deleteSalaryHistory(id);
          toast.success('Salary record deleted successfully!', {
            duration: 4000,
            style: {
              background: '#10B981',
              color: '#fff',
              fontWeight: '600',
              borderRadius: '10px',
              padding: '16px 24px',
            }
          });
          setSearchQuery('');
          setPage(1);
          await fetchSalaryHistory();
        } catch (error) {
          toast.error('Failed to delete salary record. Try again.', {
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
      `Salary ID: ${id}\nEmployee: ${salaryRecord?.first_name || ''} ${salaryRecord?.last_name || ''}\nAmount: ${formatCurrency(salaryRecord?.salary_amount)}\nEffective Date: ${salaryRecord?.effective_date?.split('T')[0] || 'N/A'}\nPayment Method: ${salaryRecord?.payment_method || 'N/A'}\nStatus: ${salaryRecord?.status || 'N/A'}`
    );
  };

  const handleEditSalary = (item) => {
    setEditingSalary(item);
    setIsModalOpen(true);
  };

  const handleAddSalary = () => {
    setEditingSalary(null);
    setIsModalOpen(true);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Salary History</h2>
        {canManageAll && (
          <button
            onClick={handleAddSalary}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Salary Record
          </button>
        )}
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <div className="text-sm text-gray-600">
            Showing {filteredSalaryHistory.length} of {allSalaryHistory.length} salary records
          </div>
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search by employee name or reason..."
          />
        </div>

        {loading ? (
          <div className="text-center py-8">Loading...</div>
        ) : error ? (
          <div className="text-center py-8 bg-red-100 border border-red-400 text-red-700 p-4 rounded">
            <p className="font-semibold">Error:</p>
            <p>{error.message || error}</p>
          </div>
        ) : (
          <>
            {filteredSalaryHistory.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '48px', color: '#6B7280' }}>
                <div className="mb-4">
                  <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                
                {searchQuery ? (
                  <>
                    <p style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px' }}>
                      No salary records found
                    </p>
                    <p style={{ fontSize: '14px', marginBottom: '16px' }}>
                      No results match your search for "{searchQuery}"
                    </p>
                    <button
                      onClick={clearFilters}
                      className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                      Clear Search
                    </button>
                  </>
                ) : (
                  <>
                    <p style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px' }}>
                      {canManageAll ? 'No salary records available' : 'No salary history available'}
                    </p>
                    <p style={{ fontSize: '14px', marginBottom: '16px', lineHeight: '1.5' }}>
                      {canManageAll 
                        ? 'Start by adding salary records for employees. Salary history will appear here once records are created.'
                        : 'Your salary history will appear here once your salary records are added to the system.'
                      }
                    </p>
                    {canManageAll && (
                      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <p style={{ fontSize: '14px', color: '#1E40AF', marginBottom: '8px' }}>
                          <strong>💡 Pro Tip:</strong> Keep accurate salary records to track compensation changes, 
                          annual reviews, and maintain compliance with financial reporting standards.
                        </p>
                      </div>
                    )}
                    {!canManageAll && (
                      <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                        <p style={{ fontSize: '14px', color: '#6B7280', marginBottom: '8px' }}>
                          <strong>📋 Note:</strong> If you believe this is an error, please contact your 
                          HR department or system administrator for assistance.
                        </p>
                      </div>
                    )}
                  </>
                )}
              </div>
            ) : (
              <>
                <SalaryTable
                  salaryHistory={paginatedSalaryHistory}
                  employees={employees}
                  onEdit={handleEditSalary}
                  onDelete={handleDeleteSalary}
                  canManageAll={canManageAll}
                />
                <Pagination
                  page={page}
                  totalPages={totalPagesFiltered}
                  onPageChange={setPage}
                />
              </>
            )}
          </>
        )}
      </div>

      {canManageAll && (
        <Modal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setEditingSalary(null);
          }}
          title={editingSalary ? "Edit Salary Record" : "Add Salary Record"}
          size="lg"
        >
          <SalaryForm
            onSave={handleSaveSalary}
            editingSalary={editingSalary}
            employees={employees}
          />
        </Modal>
      )}
    </div>
  );
}

export default SalaryPage;