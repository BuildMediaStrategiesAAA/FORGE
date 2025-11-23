import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import type { Job } from '../../services/jobs.service';

interface JobDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  job?: Job | null;
  onSave: (input: {
    title: string;
    site_address?: string;
    start_date?: string;
    expected_end_date?: string;
  }) => Promise<void>;
}

export function JobDialog({ open, onOpenChange, job, onSave }: JobDialogProps) {
  const [title, setTitle] = useState('');
  const [siteAddress, setSiteAddress] = useState('');
  const [startDate, setStartDate] = useState('');
  const [expectedEndDate, setExpectedEndDate] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (open) {
      if (job) {
        setTitle(job.title);
        setSiteAddress(job.site_address || '');
        setStartDate(job.start_date || '');
        setExpectedEndDate(job.expected_end_date || '');
      } else {
        setTitle('');
        setSiteAddress('');
        setStartDate('');
        setExpectedEndDate('');
      }
    }
  }, [open, job]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;

    try {
      setIsSaving(true);
      await onSave({
        title: title.trim(),
        site_address: siteAddress.trim() || undefined,
        start_date: startDate || undefined,
        expected_end_date: expectedEndDate || undefined,
      });
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to save job:', error);
      alert(`Failed to save job: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSaving(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="neumorphic-card border border-[#2d2d2d] bg-[#1a1a1a] w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-[#2d2d2d]">
          <h2 className="text-2xl font-black text-white">
            {job ? 'Edit Job' : 'Create Job'}
          </h2>
          <button
            onClick={() => onOpenChange(false)}
            className="p-2 hover:bg-[#252525] rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-[#e5e5e5]" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-white mb-2">
              Job Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-3 bg-[#252525] border border-[#2d2d2d] rounded-lg text-white placeholder-[#808080] focus:outline-none focus:ring-2 focus:ring-white/20"
              placeholder="Enter job title"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-white mb-2">
              Site Address
            </label>
            <input
              type="text"
              value={siteAddress}
              onChange={(e) => setSiteAddress(e.target.value)}
              className="w-full px-4 py-3 bg-[#252525] border border-[#2d2d2d] rounded-lg text-white placeholder-[#808080] focus:outline-none focus:ring-2 focus:ring-white/20"
              placeholder="Enter site address"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-white mb-2">
              Start Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-4 py-3 bg-[#252525] border border-[#2d2d2d] rounded-lg text-white placeholder-[#808080] focus:outline-none focus:ring-2 focus:ring-white/20"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-white mb-2">
              Expected End Date
            </label>
            <input
              type="date"
              value={expectedEndDate}
              onChange={(e) => setExpectedEndDate(e.target.value)}
              className="w-full px-4 py-3 bg-[#252525] border border-[#2d2d2d] rounded-lg text-white placeholder-[#808080] focus:outline-none focus:ring-2 focus:ring-white/20"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="flex-1 px-6 py-3 text-[#e5e5e5] hover:bg-[#252525] rounded-lg font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving || !title.trim()}
              className="flex-1 neumorphic-button px-6 py-3 text-white font-semibold disabled:opacity-50"
            >
              {isSaving ? 'Saving...' : job ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
