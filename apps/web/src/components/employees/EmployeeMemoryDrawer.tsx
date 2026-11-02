import React, { useState, useEffect } from 'react';
import {
  X,
  Brain,
  Clock,
  Layers,
  Database,
  Archive,
  Trash2,
  Lock,
  Globe,
  FolderGit2,
  Search,
  Sparkles,
  AlertCircle,
  Tag,
  Eye,
} from 'lucide-react';
import { Memory, MemoryCategory, Employee } from '@vac/shared';
import { api } from '../../services/api';

interface EmployeeMemoryDrawerProps {
  employee: Employee | null;
  isOpen: boolean;
  onClose: () => void;
}

export const EmployeeMemoryDrawer: React.FC<EmployeeMemoryDrawerProps> = ({
  employee,
  isOpen,
  onClose,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [memories, setMemories] = useState<Memory[]>([]);
  const [activeCategory, setActiveCategory] = useState<MemoryCategory | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && employee) {
      loadMemories();
    }
  }, [isOpen, employee]);

  const loadMemories = async () => {
    if (!employee) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.getEmployeeMemories(employee.id);
      setMemories(res.all || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load employee memories');
    } finally {
      setLoading(false);
    }
  };

  const handleArchive = async (memoryId: string) => {
    setActionLoading(memoryId);
    try {
      await api.archiveMemory(memoryId, 'Archived via employee memory drawer');
      await loadMemories();
    } catch (err: any) {
      alert(`Failed to archive memory: ${err.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (memoryId: string) => {
    if (!confirm('Are you sure you want to delete this memory?')) return;
    setActionLoading(memoryId);
    try {
      await api.deleteMemory(memoryId, false);
      await loadMemories();
    } catch (err: any) {
      alert(`Failed to delete memory: ${err.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  if (!isOpen || !employee) return null;

  const filteredMemories = memories.filter((m) => {
    const matchesCategory = activeCategory === 'ALL' || m.category === activeCategory;
    const matchesQuery =
      searchQuery.trim() === '' ||
      m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (m.tags && Array.isArray(m.tags) && m.tags.some((t: string) => t.toLowerCase().includes(searchQuery.toLowerCase())));
    return matchesCategory && matchesQuery;
  });

  const getScopeBadge = (scope: string) => {
    switch (scope) {
      case 'EMPLOYEE_PRIVATE':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-purple-500/10 text-purple-300 border border-purple-500/20">
            <Lock className="w-2.5 h-2.5" />
            PRIVATE
          </span>
        );
      case 'PROJECT_SHARED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
            <FolderGit2 className="w-2.5 h-2.5" />
            PROJECT
          </span>
        );
      case 'COMPANY_SHARED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
            <Globe className="w-2.5 h-2.5" />
            COMPANY
          </span>
        );
      case 'TASK_SCOPED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-amber-500/10 text-amber-300 border border-amber-500/20">
            <Clock className="w-2.5 h-2.5" />
            TASK
          </span>
        );
      default:
        return null;
    }
  };

  const getCategoryBadge = (category: MemoryCategory) => {
    switch (category) {
      case 'WORKING':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-amber-500/15 text-amber-300 border border-amber-500/30">
            <Clock className="w-2.5 h-2.5" />
            WORKING
          </span>
        );
      case 'EPISODIC':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-blue-500/15 text-blue-300 border border-blue-500/30">
            <Layers className="w-2.5 h-2.5" />
            EPISODIC
          </span>
        );
      case 'SEMANTIC':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
            <Database className="w-2.5 h-2.5" />
            SEMANTIC
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-2xl bg-slate-900 border-l border-slate-800 flex flex-col h-full shadow-2xl">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <Brain className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-semibold text-white">
                  {employee.firstName} {employee.lastName}
                </h2>
                <span className="text-xs font-mono text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
                  {employee.employeeCode}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Cognitive Intelligence & Memory Bank · {employee.role}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toolbar: Category Filters & Search */}
        <div className="p-4 border-b border-slate-800/80 space-y-3 bg-slate-950/40">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1 p-1 bg-slate-950 rounded-lg border border-slate-800">
              {(['ALL', 'SEMANTIC', 'EPISODIC', 'WORKING'] as const).map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition ${
                    activeCategory === cat
                      ? 'bg-purple-600/30 text-purple-200 border border-purple-500/40'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
            <div className="text-xs text-slate-400 font-mono">
              {filteredMemories.length} item{filteredMemories.length !== 1 ? 's' : ''}
            </div>
          </div>

          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search employee memory bank (title, contents, tags)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
            />
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-3">
              <div className="w-8 h-8 rounded-full border-2 border-purple-500/30 border-t-purple-400 animate-spin" />
              <span className="text-xs text-slate-400 font-mono">Retrieving neural memory graph...</span>
            </div>
          ) : error ? (
            <div className="p-4 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          ) : filteredMemories.length === 0 ? (
            <div className="text-center py-16 space-y-2">
              <Sparkles className="w-8 h-8 text-slate-600 mx-auto" />
              <p className="text-sm text-slate-400">No memories found</p>
              <p className="text-xs text-slate-500">
                Memories are automatically ingested upon task execution, lessons learned, and knowledge ingestion.
              </p>
            </div>
          ) : (
            filteredMemories.map((mem) => (
              <div
                key={mem.id}
                className="p-4 rounded-xl bg-slate-800/40 border border-slate-800 hover:border-slate-700 transition space-y-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      {getCategoryBadge(mem.category)}
                      {getScopeBadge(mem.scope)}
                      <span className="text-[10px] text-slate-400 font-mono">
                        Imp: {(mem.importance * 100).toFixed(0)}% · Conf: {(mem.confidence * 100).toFixed(0)}%
                      </span>
                      {mem.status === 'ARCHIVED' && (
                        <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded border border-slate-700">
                          ARCHIVED
                        </span>
                      )}
                    </div>
                    <h3 className="text-sm font-semibold text-white">{mem.title}</h3>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    {mem.status === 'ACTIVE' && (
                      <button
                        onClick={() => handleArchive(mem.id)}
                        disabled={actionLoading === mem.id}
                        title="Archive memory"
                        className="p-1.5 text-slate-400 hover:text-amber-300 hover:bg-slate-800 rounded transition"
                      >
                        <Archive className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(mem.id)}
                      disabled={actionLoading === mem.id}
                      title="Delete memory"
                      className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <p className="text-xs text-slate-300 whitespace-pre-line leading-relaxed font-sans bg-slate-950/60 p-3 rounded-lg border border-slate-900">
                  {mem.content}
                </p>

                {mem.tags && Array.isArray(mem.tags) && mem.tags.length > 0 && (
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {mem.tags.map((tag: string, i: number) => (
                      <span
                        key={i}
                        className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded bg-slate-800/80 text-slate-400 border border-slate-700/60"
                      >
                        <Tag className="w-2.5 h-2.5" />
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 pt-1 border-t border-slate-800/60">
                  <span className="flex items-center gap-1">
                    <Eye className="w-3 h-3 text-slate-600" />
                    Accessed: {mem.accessCount} time{mem.accessCount !== 1 ? 's' : ''}
                  </span>
                  <span>
                    Created: {new Date(mem.createdAt).toLocaleDateString()} {new Date(mem.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
