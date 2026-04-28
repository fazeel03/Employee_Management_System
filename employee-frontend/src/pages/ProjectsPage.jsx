import { useEffect, useState, useCallback } from "react";
import ProjectForm from "../components/ProjectForm";
import ProjectTable from "../components/ProjectTable";
import SearchBar from "../components/SearchBar";
import Pagination from "../components/Pagination";
import Modal from "../components/Modal";
import {
  getProjects,
  createProject,
  updateProject,
  deleteProject
} from "../api/projectService";
import { projectFilters } from "../api/managerService";
import { useModal } from "../context/ModalContext";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";

function ProjectsPage() {
  const { isAdmin, isManager, isHR } = useAuth();
  const canCreateProject = isAdmin() || isManager();
  const [allProjects, setAllProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [editingProject, setEditingProject] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formKey, setFormKey] = useState(0);
  const { showConfirmDelete, showSuccess, showError } = useModal();

  const itemsPerPage = 10;

  // Calculate active projects count using centralized filter
  const activeProjectsCount = allProjects.filter(projectFilters.isActive).length;

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const response = await getProjects(1, 1000, ""); // Fetch all for frontend filtering
      
      const projectsData = Array.isArray(response.data.data)
        ? response.data.data
        : [];
      
      setAllProjects(projectsData);
      
    } catch (err) {
      console.error("Fetch projects error:", err);
      setError("Failed to fetch projects");
      setAllProjects([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  // Search filter logic
  const filteredProjects = allProjects.filter(item => {
    const query = searchQuery.toLowerCase();
    return (
      item.project_name?.toLowerCase().includes(query) ||
      item.status?.toLowerCase().includes(query)
    );
  });

  // Reset page when search changes
  useEffect(() => {
    setPage(1);
  }, [searchQuery]);

  // Pagination for filtered results
  const totalPagesFiltered = Math.ceil(filteredProjects.length / itemsPerPage);
  const paginatedProjects = filteredProjects.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  );

  const handleSave = async (data) => {
    try {
      
      const budget = data.budget !== undefined && data.budget !== null && data.budget !== ""
        ? parseFloat(data.budget)
        : null;

      const processedData = {
        project_name: data.project_name?.toString().trim() || "",
        start_date: data.start_date || "",
        end_date: data.end_date || "",
        budget: budget,
        status: data.status || "Planned",
        project_manager_id: data.project_manager_id?.toString().trim() !== "" && !isNaN(parseInt(data.project_manager_id)) ? parseInt(data.project_manager_id) : 0
      };

      if (editingProject) {
        await updateProject(editingProject.project_id, processedData);
        setEditingProject(null);
        toast.success('Project updated successfully!', {
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
        const result = await createProject(processedData);
        
        setFormKey(prev => prev + 1);
        toast.success('Project added successfully!', {
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
      await fetchProjects();
      setIsModalOpen(false);
    } catch (error) {
      console.error("Frontend save error:", error);
      toast.error('Failed to save project. Try again.', {
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

  const handleDelete = async (id) => {
    const project = allProjects.find(p => p.project_id === id);
    const projectName = project ? project.project_name : 'this project';
    
    showConfirmDelete(
      projectName,
      async () => {
        try {
          await deleteProject(id);
          toast('Project deleted successfully!', {
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
          await fetchProjects();
        } catch (error) {
          toast.error('Failed to delete project. Try again.', {
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
      `Project ID: ${id}\nName: ${projectName}\nStatus: ${project?.status || 'Unknown'}`
    );
  };

  const handleEdit = (project) => {
    setEditingProject(project);
    setIsModalOpen(true);
  };

  const handleAddProject = () => {
    setEditingProject(null);
    setIsModalOpen(true);
  };

  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
    setPage(1);
  };

  const debouncedSearch = useCallback(
    (searchValue) => {
      const timer = setTimeout(() => {
        fetchProjects(1, searchValue);
      }, 500);
      return () => clearTimeout(timer);
    },
    []
  );

  useEffect(() => {
    if (searchQuery.trim() === "") {
      fetchProjects(1, "");
    } else {
      const cleanup = debouncedSearch(searchQuery);
      return cleanup;
    }
  }, [searchQuery, debouncedSearch]);

  const handlePageChange = (pageNumber) => {
    setPage(pageNumber);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Projects</h2>
        {canCreateProject && (
          <button
            onClick={handleAddProject}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Project
          </button>
        )}
      </div>
      
      <div className="bg-white shadow rounded-lg p-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            <span className="font-semibold text-green-600">Active Projects: {activeProjectsCount}</span> 
            <span className="mx-2">|</span>
            <span>Total Projects: {allProjects.length}</span>
          </div>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        {/* SEARCH BAR */}
        <div className="flex justify-between items-center mb-4">
          <div className="text-sm text-gray-600">
            Showing {filteredProjects.length} of {allProjects.length} projects
          </div>
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search by project name or status..."
          />
        </div>

        {loading ? (
          <div className="text-center py-8">Loading...</div>
        ) : error ? (
          <div className="text-center py-8 text-red-500">{error}</div>
        ) : (
          <>
            {filteredProjects.length === 0 && searchQuery && (
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

            {filteredProjects.length > 0 && (
              <>
                <ProjectTable
                  projects={paginatedProjects}
                  onDelete={handleDelete}
                  onEdit={handleEdit}
                />
                
                <Pagination
                  page={page}
                  totalPages={totalPagesFiltered}
                  onPageChange={handlePageChange}
                />
              </>
            )}
          </>
        )}
      </div>

      {canCreateProject && (
        <Modal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setEditingProject(null);
          }}
          title={editingProject ? "Edit Project" : "Add Project"}
          size="lg"
        >
          <ProjectForm
            key={formKey}
            onSave={handleSave}
            editingProject={editingProject}
          />
        </Modal>
      )}
    </div>
  );
}

export default ProjectsPage;