import { useEffect, useState, useCallback } from "react";
import EmployeeProjectForm from "../components/EmployeeProjectForm";
import EmployeeProjectTable from "../components/EmployeeProjectTable";
import SearchBar from "../components/SearchBar";
import Pagination from "../components/Pagination";
import { useModal } from "../context/ModalContext";
import Modal from "../components/Modal";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";

import {
  getEmployeeProjects,
  createEmployeeProject,
  updateEmployeeProject,
  deleteEmployeeProject
} from "../api/employeeProjectService";
import { getEmployees } from "../api/employeeService";
import { getProjects } from "../api/projectService";

function EmployeeProjectsPage() {
  const { isAdmin, isManager, isHR } = useAuth();
  const canManageAssignments = isAdmin() || isHR() || isManager();
  const [assignments, setAssignments] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [projects, setProjects] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    emp_id: '',
    project_id: '',
    role_name: '',
    allocation_percent: 100,
    assigned_on: '',
    released_on: ''
  });
  const { showConfirmDelete, showSuccess, showError } = useModal();

  const itemsPerPage = 10;

  // Fetch all data on mount
  useEffect(() => {
    const fetchAll = async () => {
      try {
        setLoading(true);
        const [assignRes, empRes, projRes] = await Promise.all([
          getEmployeeProjects(),
          getEmployees(),
          getProjects()
        ]);
        
        setAssignments(assignRes.data?.data || assignRes.data || []);
        setEmployees(empRes.data?.data || empRes.data || []);
        setProjects(projRes.data?.data || projRes.data || []);
      } catch (err) {
        console.error('Failed to load data:', err);
        toast.error('Failed to load data');
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  // Search filter logic
  const filteredAssignments = assignments.filter(a => {
    const term = searchTerm.toLowerCase();
    return (
      `${a.first_name} ${a.last_name}`.toLowerCase().includes(term) ||
      a.project_name?.toLowerCase().includes(term) ||
      a.employee_code?.toLowerCase().includes(term) ||
      a.role_name?.toLowerCase().includes(term)
    );
  });

  // Reset page on search
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  // Pagination
  const totalPages = Math.ceil(filteredAssignments.length / itemsPerPage);
  const paginated = filteredAssignments.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleSave = async (data) => {
    console.log('SAVE DATA:', data, 'isEditing:', isEditing, 'editingId:', editingId);
    try {
      if (isEditing) {
        await updateEmployeeProject(editingId, data);
        setIsEditing(false);
        setEditingId(null);
        toast.success('Assignment updated successfully!', {
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
        await createEmployeeProject(data);
        toast.success('Employee assigned successfully!', {
          duration: 4000,
          style: {
            background: '#10B981',
            color: '#fff',
            fontWeight: '600',
            borderRadius: '10px',
            padding: '16px 24px',
          }
        });
        setCurrentPage(1);
      }

      setFormData({
        emp_id: '',
        project_id: '',
        role_name: '',
        allocation_percent: 100,
        assigned_on: '',
        released_on: ''
      });
      
      const assignRes = await getEmployeeProjects();
      setAssignments(assignRes.data?.data || assignRes.data || []);
      setIsModalOpen(false);

    } catch (error) {
      console.error('Save assignment error:', error);
      toast.error('Failed to process. Try again.', {
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

  const handleEdit = (assignment) => {
    setIsEditing(true);
    setEditingId(assignment.assignment_id);
    setFormData({
      emp_id: assignment.emp_id,
      project_id: assignment.project_id,
      role_name: assignment.role_name || '',
      allocation_percent: assignment.allocation_percent || 100,
      assigned_on: assignment.assigned_on || '',
      released_on: assignment.released_on || ''
    });
    setIsModalOpen(true);
  };

  const handleAddAssignment = () => {
    setIsEditing(false);
    setEditingId(null);
    setFormData({
      emp_id: '',
      project_id: '',
      role_name: '',
      allocation_percent: 100,
      assigned_on: '',
      released_on: ''
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    const assignment = assignments.find(a => a.assignment_id === id);
    const assignmentDetails = assignment ? 
      `${assignment.first_name} ${assignment.last_name} - ${assignment.project_name}` : 
      'this assignment';
    
    showConfirmDelete(
      assignmentDetails,
      async () => {
        try {
          await deleteEmployeeProject(id);
          toast('Assignment removed successfully!', {
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
          
          // Update local state
          setAssignments(assignments.filter(a => a.assignment_id !== id));
          
        } catch (error) {
          console.error('Delete assignment error:', error);
          toast.error('Failed to process. Try again.', {
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
      `Assignment ID: ${id}\nEmployee: ${assignment?.first_name || 'N/A'} ${assignment?.last_name || 'N/A'}\nProject: ${assignment?.project_name || 'N/A'}\nRole: ${assignment?.role_name || 'N/A'}\nAllocation: ${assignment?.allocation_percent || 'N/A'}%\nAssigned: ${assignment?.assigned_on || 'N/A'}\nReleased: ${assignment?.released_on || 'Active'}`
    );
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditingId(null);
    setFormData({
      emp_id: '',
      project_id: '',
      role_name: '',
      allocation_percent: 100,
      assigned_on: '',
      released_on: ''
    });
  };



  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Employee Project Assignments</h2>
        <button
          onClick={handleAddAssignment}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Assign to Project
        </button>
      </div>

      {/* SEARCH BAR */}
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <div className="text-sm text-gray-600">
            Showing {filteredAssignments.length} of {assignments.length} assignments
          </div>
          <SearchBar
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="Search by employee name, project, code, or role..."
          />
        </div>
      </div>

      {/* TABLE */}
      {filteredAssignments.length === 0 && searchTerm ? (
        <div className="bg-white shadow rounded-lg p-6">
          <div style={{
            textAlign: 'center',
            padding: '48px',
            color: '#6B7280'
          }}>
            <p style={{ fontSize: '16px' }}>
              🔍 No results found for "{searchTerm}"
            </p>
            <p style={{ fontSize: '14px' }}>
              Try different keywords or clear the search
            </p>
            <button 
              onClick={() => setSearchTerm('')}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Clear Search
            </button>
          </div>
        </div>
      ) : (
        <>
          <EmployeeProjectTable
            assignments={paginated}
            onEdit={handleEdit}
            onDelete={handleDelete}
            loading={loading}
          />
          
          {filteredAssignments.length > 0 && (
            <div className="mt-6">
              <Pagination
                page={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            </div>
          )}
        </>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          handleCancelEdit();
        }}
        title={isEditing ? "Update Assignment" : "Assign Employee to Project"}
        size="lg"
      >
        <EmployeeProjectForm
          onSave={handleSave}
          editingAssignment={isEditing ? assignments.find(a => a.assignment_id === editingId) : null}
          onCancel={handleCancelEdit}
        />
      </Modal>
    </div>
  );
}
export default EmployeeProjectsPage;