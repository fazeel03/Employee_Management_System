import { useEffect, useState, useCallback } from "react";
import toast from "react-hot-toast";
import DepartmentTable from "../components/DepartmentTable";
import DepartmentForm from "../components/DepartmentForm";
import SearchBar from "../components/SearchBar";
import Pagination from "../components/Pagination";
import { useModal } from "../context/ModalContext";
import Modal from "../components/Modal";
import {
  getDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment
} from "../api/departmentService";

function DepartmentsPage() {
  const [allDepartments, setAllDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [editingDepartment, setEditingDepartment] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [page, setPage] = useState(1); 
  const { showConfirmDelete } = useModal();

  const itemsPerPage = 10;

  // Fetch all departments
  const fetchDepartments = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await getDepartments(1, 1000, ""); // Fetch all for frontend filtering
       console.log('FETCH DEPARTMENTS RESPONSE:', response.data); 
      if (!response?.data?.success) {
        throw new Error(response?.data?.message || "Invalid response from server");
      }
      
      const data = response.data.data || [];
      setAllDepartments(Array.isArray(data) ? data : []);
      
    } catch (err) {
      console.error("Department fetch error:", err);
      setError(err.message || "Failed to fetch departments");
      setAllDepartments([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Search filter logic
  const filteredDepartments = allDepartments.filter(item => {
    const query = searchQuery.toLowerCase();
    return (
      item.dept_name?.toLowerCase().includes(query) ||
      item.location?.toLowerCase().includes(query)
    );
  });

  // Reset page when search changes
  useEffect(() => {
    setPage(1);
  }, [searchQuery]);

  // Pagination for filtered results
  const totalPagesFiltered = Math.ceil(filteredDepartments.length / itemsPerPage);
  const paginatedDepartments = filteredDepartments.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  );

  // Save department
  const handleSaveDepartment = useCallback(async (departmentData) => {
    if (!departmentData) {
      setEditingDepartment(null);
      setIsModalOpen(false);
      return;
    }

    try {
      if (editingDepartment) {
        await updateDepartment(editingDepartment.dept_id, departmentData);
        toast.success('Department updated successfully!', {
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
        await createDepartment(departmentData);
        toast.success('Department added successfully!', {
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

      // Reset search and page
      setSearchQuery('');
      setPage(1);
      await fetchDepartments();
      setEditingDepartment(null);
      setIsModalOpen(false);

    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || "Failed to save department";
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
  }, [editingDepartment, fetchDepartments]);

  // Delete department
  const handleDeleteDepartment = useCallback(async (id) => {
    const department = allDepartments.find(dept => dept.dept_id === id);
    const departmentName = department ? department.dept_name : 'this department';
    
    showConfirmDelete(
      departmentName,
      async () => {
        try {
          await deleteDepartment(id);
          toast('Department deleted!', {
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
          await fetchDepartments();
        } catch (err) {
          const errorMessage = err.response?.data?.message || err.message || "Failed to delete department";
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
      `Department ID: ${id}\nName: ${departmentName}\nLocation: ${department?.location || 'Not specified'}\nBudget: ${department?.budget ? '$' + parseFloat(department.budget).toLocaleString('en-US', { minimumFractionDigits: 2 }) : '$0.00'}`
    );
  }, [allDepartments, fetchDepartments, showConfirmDelete]);

  const handleEditDepartment = useCallback((dept) => {
    setEditingDepartment(dept);
    setIsModalOpen(true);
  }, []);

  const handleAddDepartment = () => {
    setEditingDepartment(null);
    setIsModalOpen(true);
  };

  // Initial load
  useEffect(() => {
    fetchDepartments();
  }, [fetchDepartments]);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Departments</h2>
        <button
          onClick={handleAddDepartment}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Department
        </button>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        {/* SEARCH BAR */}
        <div className="flex justify-between items-center mb-4">
          <div className="text-sm text-gray-600">
            Showing {filteredDepartments.length} of {allDepartments.length} departments
          </div>
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search by department name or location..."
          />
        </div>

        {/* STATE DISPLAY */}
        {loading && (
          <p className="text-gray-500">Loading departments...</p>
        )}

        {error && (
          <p className="text-red-500">{error}</p>
        )}

        {!loading && !error && (
          <>
            {filteredDepartments.length === 0 && searchQuery && (
              <div style={{
                textAlign: 'center',
                padding: '48px',
                color: '#6B7280'
              }}>
                <p style={{ fontSize: '16px' }}>
                  🔍 No results found for "{searchQuery}"
                </p>
                <p style={{ fontSize: '14px' }}>
                  Try different keywords or clear the search
                </p>
                <button 
                  onClick={() => setSearchQuery('')}
                  className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Clear Search
                </button>
              </div>
            )}

            {filteredDepartments.length > 0 ? (
              <>
                <DepartmentTable
                  departments={paginatedDepartments}
                  onDelete={handleDeleteDepartment}
                  onEdit={handleEditDepartment}
                />

                <Pagination
                  page={page}
                  totalPages={totalPagesFiltered}
                  onPageChange={setPage}
                />
              </>
            ) : (
              !searchQuery && !loading && (
                <p className="text-center py-8 text-gray-500">
                  No departments found. Add one above.
                </p>
              )
            )}
          </>
        )}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingDepartment(null);
        }}
        title={editingDepartment ? "Edit Department" : "Add Department"}
        size="md"
      >
        <DepartmentForm
          onSave={handleSaveDepartment}
          editingDepartment={editingDepartment}
        />
      </Modal>
    </div>
  );
}

export default DepartmentsPage;