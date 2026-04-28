import { useEffect, useState, useCallback } from "react";
import PositionTable from "../components/PositionTable";
import PositionForm from "../components/PositionForm";
import SearchBar from "../components/SearchBar";
import Pagination from "../components/Pagination";
import { useModal } from "../context/ModalContext";
import Modal from "../components/Modal";
import { formatCurrency } from "../utils/currencyFormatter";
import toast from "react-hot-toast";
import {
  getPositions,
  createPosition,
  updatePosition,
  deletePosition
} from "../api/positionService";
import { getDepartments } from "../api/departmentService";

function PositionsPage() {
  const [allPositions, setAllPositions] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [editingPosition, setEditingPosition] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { showConfirmDelete, showSuccess, showError } = useModal();

  const itemsPerPage = 10;

  const fetchDepartments = async () => {
    try {
      const response = await getDepartments();
      const deptList = Array.isArray(response.data.data)
        ? response.data.data
        : [];
      setDepartments(deptList);
    } catch (err) {
      console.error("Failed to fetch departments:", err);
    }
  };

  const fetchPositions = async () => {
    try {
      setLoading(true);
      const response = await getPositions();
      
      // Handle both response formats:
      const data = response.data || response || [];
      const positionList = Array.isArray(data) ? data : [];
      
      setAllPositions(positionList);
      
    } catch (err) {
      console.error("Failed to fetch positions:", err);
      setError("Failed to fetch positions");
      setAllPositions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartments();
    fetchPositions();
  }, []);

  // Search filter logic
  const filteredPositions = allPositions.filter(
    pos => pos.position_title
      .toLowerCase()
      .includes(searchQuery.toLowerCase()) ||
    (pos.dept_name && pos.dept_name
      .toLowerCase()
      .includes(searchQuery.toLowerCase()))
  );

  // Reset page when search changes
  useEffect(() => {
    setPage(1);
  }, [searchQuery]);

  // Pagination for filtered results
  const totalPagesFiltered = Math.ceil(filteredPositions.length / itemsPerPage);
  const paginatedPositions = filteredPositions.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  );

  const handleSave = async (data) => {
    try {
      if (editingPosition) {
        await updatePosition(editingPosition.position_id, data);
        setEditingPosition(null);
        toast.success('Position updated successfully!', {
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
        await createPosition(data);
        toast.success('Position added successfully!', {
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
      await fetchPositions();
      setIsModalOpen(false);

    } catch (error) {
      console.error("Save position error:", error);
      if (error.response?.data?.message) {
        if (error.response.data.message.includes('already exists')) {
          toast.error('Position title already exists!');
        } else {
          toast.error(error.response.data.message);
        }
      } else {
        toast.error('Failed to save position. Try again.', {
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
    }
  };

  const handleDelete = async (id) => {
    const position = allPositions.find(p => p.position_id === id);
    const positionDetails = position ? `${position.position_title} (${position.dept_name || 'No Department'})` : 'this position';
    
    showConfirmDelete(
      positionDetails,
      async () => {
        try {
          await deletePosition(id);
          toast('Position deleted successfully!', {
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
          await fetchPositions();
        } catch (error) {
          console.error("Delete position error:", error);
          if (error.response?.data?.message) {
            if (error.response.data.message.includes('assigned to employees')) {
              toast.error('Cannot delete - position is assigned to employees!');
            } else {
              toast.error(error.response.data.message);
            }
          } else {
            toast.error('Failed to delete position. Try again.', {
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
        }
      },
      `Position ID: ${id}\nTitle: ${position?.position_title || 'N/A'}\nDepartment: ${position?.dept_name || 'N/A'}\nMin Salary: ${position?.min_salary ? formatCurrency(position.min_salary) : 'N/A'}\nMax Salary: ${position?.max_salary ? formatCurrency(position.max_salary) : 'N/A'}`
    );
  };

  const handleEdit = (item) => {
    setEditingPosition(item);
    setIsModalOpen(true);
  };

  const handleAddPosition = () => {
    setEditingPosition(null);
    setIsModalOpen(true);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Positions</h2>
        <button
          onClick={handleAddPosition}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Position
        </button>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        {/* SEARCH BAR */}
        <div className="flex justify-between items-center mb-4">
          <div className="text-sm text-gray-600">
            Showing {filteredPositions.length} of {allPositions.length} positions
          </div>
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search by position title or department..."
          />
        </div>

        {loading ? (
          <div className="text-center py-8">Loading...</div>
        ) : error ? (
          <div className="text-center py-8 text-red-500">{error}</div>
        ) : (
          <>
            {filteredPositions.length === 0 && searchQuery && (
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

            {filteredPositions.length > 0 && (
              <>
                <PositionTable
                  positions={paginatedPositions}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
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

      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingPosition(null);
        }}
        title={editingPosition ? "Edit Position" : "Add Position"}
        size="md"
      >
        <PositionForm
          onSave={handleSave}
          editingPosition={editingPosition}
          departments={departments}
        />
      </Modal>
    </div>
  );
}

export default PositionsPage;