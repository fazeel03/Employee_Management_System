import { useEffect, useState } from "react";
import LeaveForm from "../components/LeaveForm";
import LeaveTable from "../components/LeaveTable";
import SearchBar from "../components/SearchBar";
import Pagination from "../components/Pagination";
import { useModal } from "../context/ModalContext";
import Modal from "../components/Modal";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";
import {
  getLeaveRequests,
  createLeaveRequest,
  updateLeaveRequest,
  deleteLeaveRequest,
  approveLeaveRequest,
  rejectLeaveRequest
} from "../api/leaveService";
import { getEmployees } from "../api/employeeService";
import axiosInstance from "../api/axiosInstance";

function LeavePage() {
  const [allLeaveRequests, setAllLeaveRequests] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const { showConfirmDelete, showSuccess, showError } = useModal();
  const [searchQuery, setSearchQuery] = useState("");
  const [editingLeave, setEditingLeave] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { isAdmin, isHR, isManager, isUser } = useAuth();
  const canManageAll = isAdmin() || isHR();
  const canApprove = isAdmin() || isHR() || isManager();

  const itemsPerPage = 10;

  const fetchEmployees = async () => {
    try {
      if (!canManageAll) return;
      const res = await getEmployees(1, 1000, "");
      setEmployees(Array.isArray(res.data.data) 
        ? res.data.data : []);
    } catch (err) {
      console.error('Failed to fetch employees:', err);
    }
  };

  const fetchLeaveRequests = async () => {
    try {
      setLoading(true);
      const response = await getLeaveRequests(1, 1000, ""); // Backend filters by role automatically
      
      const leaveList = Array.isArray(response.data.data)
        ? response.data.data
        : [];
      
      setAllLeaveRequests(leaveList);
      
    } catch (err) {
      console.error('Failed to fetch leave requests:', err);
      setError("Failed to fetch leave requests");
      setAllLeaveRequests([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (canManageAll) fetchEmployees();
    fetchLeaveRequests();
  }, [canManageAll]);

  // Search filter logic
  const filteredLeaveRequests = allLeaveRequests.filter(item => {
    const query = searchQuery.toLowerCase();
    return (
      item.first_name?.toLowerCase().includes(query) ||
      item.last_name?.toLowerCase().includes(query) ||
      item.leave_type?.toLowerCase().includes(query) ||
      item.approval_status?.toLowerCase().includes(query)
    );
  });

  // Reset page when search changes
  useEffect(() => {
    setPage(1);
  }, [searchQuery]);

  const clearFilters = () => {
    setSearchQuery('');
    setPage(1);
  };

  // Pagination for filtered results
  const totalPagesFiltered = Math.ceil(filteredLeaveRequests.length / itemsPerPage);
  const paginatedLeaveRequests = filteredLeaveRequests.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  );

  const handleSaveLeave = async (data) => {
    try {
      if (editingLeave) {
        await updateLeaveRequest(editingLeave.leave_id, data);
        setEditingLeave(null);
        toast.success('Leave request updated successfully!', {
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
        await createLeaveRequest(data);
        toast.success('Leave request submitted successfully!', {
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
      await fetchLeaveRequests();
      setIsModalOpen(false);

    } catch (error) {
      toast.error('Failed to process request. Try again.', {
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

  const handleDeleteLeave = async (id) => {
    const leaveRequest = allLeaveRequests.find(lr => lr.leave_id === id);
    const leaveDetails = leaveRequest ? `${leaveRequest.leave_type} leave for ${leaveRequest.first_name || ''} ${leaveRequest.last_name || ''} (${leaveRequest.start_date?.split('T')[0]} to ${leaveRequest.end_date?.split('T')[0]})` : 'this leave request';
    
    showConfirmDelete(
      leaveDetails,
      async () => {
        try {
          await deleteLeaveRequest(id);
          toast('Leave request cancelled!', {
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
          await fetchLeaveRequests();
        } catch (error) {
          toast.error('Failed to process request. Try again.', {
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
      `Leave ID: ${id}\nEmployee: ${leaveRequest?.first_name || ''} ${leaveRequest?.last_name || ''}\nType: ${leaveRequest?.leave_type || 'N/A'}\nPeriod: ${leaveRequest?.start_date?.split('T')[0] || 'N/A'} to ${leaveRequest?.end_date?.split('T')[0] || 'N/A'}\nReason: ${leaveRequest?.reason || 'N/A'}\nStatus: ${leaveRequest?.approval_status || 'N/A'}`
    );
  };

  const handleEditLeave = (item) => {
    setEditingLeave(item);
    setIsModalOpen(true);
  };

  const handleAddLeave = () => {
    setEditingLeave(null);
    setIsModalOpen(true);
  };

  const handleApproveLeave = async (id) => {
    try {
      await approveLeaveRequest(id, 1); // Assuming manager ID is 1 for now
      toast.success('Leave request approved!', {
        duration: 4000,
        style: {
          background: '#10B981',
          color: '#fff',
          fontWeight: '600',
          borderRadius: '10px',
          padding: '16px 24px',
        }
      });
      // Reset search and page
      setSearchQuery('');
      setPage(1);
      await fetchLeaveRequests();
    } catch (error) {
      toast.error('Failed to process request. Try again.', {
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

  const handleRejectLeave = async (id) => {
    try {
      await rejectLeaveRequest(id, 1); // Assuming manager ID is 1 for now
      toast('Leave request rejected!', {
        duration: 4000,
        icon: '❌',
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
      await fetchLeaveRequests();
    } catch (error) {
      toast.error('Failed to process request. Try again.', {
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

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Leave Requests</h2>
        <button
          onClick={handleAddLeave}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Apply Leave
        </button>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        {/* SEARCH BAR */}
        <div className="flex justify-between items-center mb-4">
          <div className="text-sm text-gray-600">
            Showing {filteredLeaveRequests.length} of {allLeaveRequests.length} leave requests
          </div>
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search by employee name, leave type or status..."
          />
        </div>

        {loading ? (
          <div className="text-center py-8">Loading...</div>
        ) : error ? (
          <div className="text-center py-8 text-red-500">{error}</div>
        ) : (
          <>
            {filteredLeaveRequests.length === 0 && searchQuery && (
              <div style={{
                textAlign: 'center',
                padding: '48px',
                color: '#6B7280'
              }}>
                <p style={{ fontSize: '16px' }}>
                  🔍 No results found for "{searchQuery}"
                </p>
                <p style={{ fontSize: '14px' }}>
                  Try different keywords or clear all filters
                </p>
                <button 
                  onClick={clearFilters}
                  className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Clear Filters
                </button>
              </div>
            )}

            {filteredLeaveRequests.length > 0 && (
              <>
                <LeaveTable
                  leaveRequests={paginatedLeaveRequests}
                  employees={employees}
                  onEdit={handleEditLeave}
                  onDelete={handleDeleteLeave}
                  onApprove={handleApproveLeave}
                  onReject={handleRejectLeave}
                  canApprove={canApprove}
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
          setEditingLeave(null);
        }}
        title={editingLeave ? "Update Leave Request" : "Apply for Leave"}
        size="md"
      >
        <LeaveForm
          onSave={handleSaveLeave}
          editingLeave={editingLeave}
          employees={employees}
          canManageAll={canManageAll}
        />
      </Modal>
    </div>
  );
}

export default LeavePage;