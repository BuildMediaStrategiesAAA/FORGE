import { useState, useEffect } from 'react';
import { Briefcase, Plus, MapPin, Calendar, MoreVertical, Edit, Trash, Image } from 'lucide-react';
import { getJobs, createJob, updateJob, deleteJob, type Job } from '../../services/jobs.service';
import { JobDialog } from './JobDialog';

type FilterTab = 'all' | 'active' | 'planning' | 'completed';

interface JobsPageProps {
  onSelectJob?: (jobId: string) => void;
}

export function JobsPage({ onSelectJob }: JobsPageProps = {}) {
  const [activeFilter, setActiveFilter] = useState<FilterTab>('all');
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<Job | null>(null);
  const [showActions, setShowActions] = useState<string | null>(null);

  useEffect(() => {
    loadJobs();
  }, []);

  async function loadJobs() {
    try {
      setIsLoading(true);
      const data = await getJobs();
      setJobs(data);
    } catch (error) {
      console.error('Failed to load jobs:', error);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleCreateJob(input: { title: string; site_address?: string; start_date?: string; expected_end_date?: string }) {
    try {
      await createJob(input);
      await loadJobs();
      setDialogOpen(false);
    } catch (error) {
      console.error('Failed to create job:', error);
      throw error;
    }
  }

  async function handleUpdateJob(id: string, input: any) {
    try {
      await updateJob(id, input);
      await loadJobs();
      setDialogOpen(false);
      setEditingJob(null);
    } catch (error) {
      console.error('Failed to update job:', error);
      throw error;
    }
  }

  async function handleDeleteJob(id: string) {
    if (!confirm('Are you sure you want to delete this job?')) return;
    try {
      await deleteJob(id);
      await loadJobs();
      setShowActions(null);
    } catch (error) {
      console.error('Failed to delete job:', error);
    }
  }

  async function handleStatusChange(id: string, status: 'draft' | 'active' | 'complete') {
    try {
      await updateJob(id, { status });
      await loadJobs();
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  }

  function openEditDialog(job: Job) {
    setEditingJob(job);
    setDialogOpen(true);
    setShowActions(null);
  }

  function openCreateDialog() {
    setEditingJob(null);
    setDialogOpen(true);
  }

  const filteredJobs = jobs.filter(job => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'active') return job.status === 'active';
    if (activeFilter === 'planning') return job.status === 'draft';
    if (activeFilter === 'completed') return job.status === 'complete';
    return true;
  });

  const filterTabs: { id: FilterTab; label: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'active', label: 'Active' },
    { id: 'planning', label: 'Planning' },
    { id: 'completed', label: 'Completed' }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white">Jobs</h1>
          <p className="text-[#e5e5e5] mt-1 font-medium">Manage your scaffolding projects</p>
        </div>
        <button onClick={openCreateDialog} className="neumorphic-button flex items-center gap-2 px-6 py-3 text-white font-semibold">
          <Plus className="w-5 h-5" />
          New Job
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {filterTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveFilter(tab.id)}
            className={`px-6 py-2.5 rounded-full text-sm font-semibold transition-all duration-200 ${
              activeFilter === tab.id
                ? 'neumorphic-button text-white'
                : 'text-[#e5e5e5] hover:text-white hover:bg-[#252525]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="neumorphic-card border border-[#2d2d2d] bg-[#1a1a1a] p-12 text-center">
          <p className="text-[#e5e5e5]">Loading jobs...</p>
        </div>
      ) : filteredJobs.length === 0 ? (
        <div className="neumorphic-card border border-[#2d2d2d] bg-[#1a1a1a]">
          <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
            <div className="neumorphic-icon-box p-6 mb-6">
              <Briefcase className="w-12 h-12 text-white" />
            </div>
            <h2 className="text-2xl font-black text-white mb-2">No Jobs Yet</h2>
            <p className="text-[#e5e5e5] mb-6 max-w-md">
              Create your first scaffolding project
            </p>
            <button onClick={openCreateDialog} className="neumorphic-button flex items-center gap-2 px-8 py-3 text-white font-semibold">
              <Plus className="w-5 h-5" />
              Create First Job
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredJobs.map((job) => (
            <div key={job.id} className="neumorphic-card border border-[#2d2d2d] bg-[#1a1a1a] p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-xl font-black text-white mb-1">{job.title}</h3>
                  {job.site_address && (
                    <div className="flex items-center gap-2 text-[#e5e5e5] text-sm">
                      <MapPin className="w-4 h-4" />
                      <span>{job.site_address}</span>
                    </div>
                  )}
                </div>
                <div className="relative">
                  <button
                    onClick={() => setShowActions(showActions === job.id ? null : job.id)}
                    className="p-2 hover:bg-[#252525] rounded-lg transition-colors"
                  >
                    <MoreVertical className="w-5 h-5 text-[#e5e5e5]" />
                  </button>
                  {showActions === job.id && (
                    <div className="absolute right-0 mt-2 w-48 neumorphic-card border border-[#2d2d2d] bg-[#1a1a1a] rounded-lg overflow-hidden z-10">
                      <button
                        onClick={() => {
                          if (onSelectJob) onSelectJob(job.id);
                          setShowActions(null);
                        }}
                        className="w-full flex items-center gap-2 px-4 py-3 text-[#e5e5e5] hover:bg-[#252525] transition-colors"
                      >
                        <Image className="w-4 h-4" />
                        Photos & Dimensions
                      </button>
                      <button
                        onClick={() => openEditDialog(job)}
                        className="w-full flex items-center gap-2 px-4 py-3 text-[#e5e5e5] hover:bg-[#252525] transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteJob(job.id)}
                        className="w-full flex items-center gap-2 px-4 py-3 text-red-400 hover:bg-[#252525] transition-colors"
                      >
                        <Trash className="w-4 h-4" />
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-3 mb-4">
                {job.start_date && (
                  <div className="flex items-center gap-2 text-[#e5e5e5] text-sm">
                    <Calendar className="w-4 h-4" />
                    <span>Start: {new Date(job.start_date).toLocaleDateString()}</span>
                  </div>
                )}
                {job.expected_end_date && (
                  <div className="flex items-center gap-2 text-[#e5e5e5] text-sm">
                    <Calendar className="w-4 h-4" />
                    <span>End: {new Date(job.expected_end_date).toLocaleDateString()}</span>
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => handleStatusChange(job.id, 'draft')}
                  className={`flex-1 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                    job.status === 'draft'
                      ? 'neumorphic-button text-white'
                      : 'text-[#e5e5e5] hover:bg-[#252525]'
                  }`}
                >
                  Draft
                </button>
                <button
                  onClick={() => handleStatusChange(job.id, 'active')}
                  className={`flex-1 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                    job.status === 'active'
                      ? 'neumorphic-button text-white'
                      : 'text-[#e5e5e5] hover:bg-[#252525]'
                  }`}
                >
                  Active
                </button>
                <button
                  onClick={() => handleStatusChange(job.id, 'complete')}
                  className={`flex-1 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                    job.status === 'complete'
                      ? 'neumorphic-button text-white'
                      : 'text-[#e5e5e5] hover:bg-[#252525]'
                  }`}
                >
                  Complete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <JobDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        job={editingJob}
        onSave={editingJob ? (input) => handleUpdateJob(editingJob.id, input) : handleCreateJob}
      />
    </div>
  );
}
