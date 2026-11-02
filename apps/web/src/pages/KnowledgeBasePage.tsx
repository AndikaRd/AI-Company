import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Search,
  Plus,
  ShieldCheck,
  Tag,
  User,
  Building,
  FileText,
  X,
  Sparkles,
  ChevronRight,
  AlertCircle,
  Database,
  Code2,
  Cpu,
  CheckCircle2,
} from 'lucide-react';
import { KnowledgeDocument, KnowledgeCategory, Employee } from '@vac/shared';
import { api } from '../services/api';

const CATEGORIES: { label: string; value: KnowledgeCategory | 'ALL'; icon: any }[] = [
  { label: 'All Knowledge', value: 'ALL', icon: BookOpen },
  { label: 'Coding Standards', value: 'CODING_STANDARDS', icon: Code2 },
  { label: 'Architecture Guidelines', value: 'ARCHITECTURE_GUIDELINES', icon: Cpu },
  { label: 'QA Verification', value: 'QA_VERIFICATION', icon: CheckCircle2 },
  { label: 'Company Policy', value: 'COMPANY_POLICY', icon: Building },
  { label: 'Security Practices', value: 'SECURITY_PRACTICES', icon: ShieldCheck },
  { label: 'Product Specs', value: 'PRODUCT_SPECIFICATION', icon: FileText },
];

export const KnowledgeBasePage: React.FC = () => {
  const [documents, setDocuments] = useState<KnowledgeDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<KnowledgeCategory | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDoc, setSelectedDoc] = useState<KnowledgeDocument | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([]);

  // Form state
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [formCategory, setFormCategory] = useState<KnowledgeCategory>('CODING_STANDARDS');
  const [content, setContent] = useState('');
  const [summary, setSummary] = useState('');
  const [authorId, setAuthorId] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadKnowledge();
    loadEmployees();
  }, []);

  const loadEmployees = async () => {
    try {
      const emps = await api.getEmployees();
      setEmployees(emps);
      if (emps.length > 0) {
        setAuthorId(emps[0].id);
      }
    } catch (err) {
      console.warn('Failed to fetch employees for knowledge docs', err);
    }
  };

  const loadKnowledge = async () => {
    setLoading(true);
    setError(null);
    try {
      const docs = await api.getKnowledgeDocuments();
      setDocuments(docs);
    } catch (err: any) {
      setError(err.message || 'Failed to load knowledge documents');
    } finally {
      setLoading(false);
    }
  };

  const handleTitleChange = (val: string) => {
    setTitle(val);
    const autoSlug = val
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');
    setSlug(autoSlug);
  };

  const handleCreateDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim() || !slug.trim()) {
      alert('Please fill out title, slug, and content.');
      return;
    }

    setSubmitting(true);
    try {
      const tags = tagsInput
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

      await api.createKnowledgeDocument({
        title,
        slug,
        category: formCategory,
        content,
        summary: summary || undefined,
        authorEmployeeId: authorId || undefined,
        tags,
      });

      setIsCreateOpen(false);
      setTitle('');
      setSlug('');
      setContent('');
      setSummary('');
      setTagsInput('');
      await loadKnowledge();
    } catch (err: any) {
      alert(`Failed to create knowledge document: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const filteredDocs = documents.filter((doc) => {
    const matchesCategory = activeCategory === 'ALL' || doc.category === activeCategory;
    const matchesQuery =
      searchQuery.trim() === '' ||
      doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (doc.summary && doc.summary.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (doc.tags && Array.isArray(doc.tags) && doc.tags.some((t: string) => t.toLowerCase().includes(searchQuery.toLowerCase())));
    return matchesCategory && matchesQuery;
  });

  const getCategoryColor = (cat: KnowledgeCategory) => {
    switch (cat) {
      case 'CODING_STANDARDS':
        return 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20';
      case 'ARCHITECTURE_GUIDELINES':
        return 'text-purple-400 bg-purple-500/10 border-purple-500/20';
      case 'QA_VERIFICATION':
        return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
      case 'COMPANY_POLICY':
        return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
      case 'SECURITY_PRACTICES':
        return 'text-rose-400 bg-rose-500/10 border-rose-500/20';
      case 'PRODUCT_SPECIFICATION':
        return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
      default:
        return 'text-slate-400 bg-slate-500/10 border-slate-500/20';
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-surface-border pb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-white tracking-tight">Company Knowledge Base</h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full font-mono bg-purple-500/15 text-purple-300 border border-purple-500/30">
              Sprint 5
            </span>
          </div>
          <p className="text-slate-400 text-sm mt-1">
            Authoritative intelligence repository ingested for autonomous multi-agent reasoning and policy alignment.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsCreateOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-lg text-sm font-medium shadow-glow-purple transition"
          >
            <Plus className="w-4 h-4" />
            <span>Add Knowledge Doc</span>
          </button>
        </div>
      </div>

      {/* Categories & Filter Bar */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto p-1 bg-surface-elevated/40 border border-surface-border rounded-xl">
          {CATEGORIES.map((c) => {
            const Icon = c.icon;
            const active = activeCategory === c.value;
            return (
              <button
                key={c.value}
                onClick={() => setActiveCategory(c.value)}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition ${
                  active
                    ? 'bg-purple-600/30 text-purple-200 border border-purple-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-surface-elevated'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{c.label}</span>
              </button>
            );
          })}
        </div>

        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search company knowledge..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-surface-elevated/60 border border-surface-border rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition"
          />
        </div>
      </div>

      {/* Main Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 space-y-3">
          <div className="w-8 h-8 rounded-full border-2 border-purple-500/30 border-t-purple-400 animate-spin" />
          <span className="text-xs text-slate-400 font-mono">Loading company knowledge base...</span>
        </div>
      ) : error ? (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm flex items-center gap-2">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      ) : filteredDocs.length === 0 ? (
        <div className="text-center py-20 bg-surface/50 rounded-2xl border border-surface-border space-y-3">
          <Database className="w-10 h-10 text-slate-600 mx-auto" />
          <p className="text-base text-slate-300 font-medium">No knowledge documents match your filter</p>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Use the "Add Knowledge Doc" button to contribute corporate guidelines, policies, or technical standards.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredDocs.map((doc) => (
            <div
              key={doc.id}
              onClick={() => setSelectedDoc(doc)}
              className="group cursor-pointer p-5 bg-surface/60 hover:bg-surface-elevated/70 border border-surface-border hover:border-purple-500/40 rounded-2xl transition-all duration-200 flex flex-col justify-between space-y-4 hover:shadow-glow-purple/10"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-semibold uppercase tracking-wider border ${getCategoryColor(
                      doc.category,
                    )}`}
                  >
                    {doc.category.replace(/_/g, ' ')}
                  </span>
                  <div className="flex items-center gap-1 text-[11px] text-emerald-400 font-mono bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                    <ShieldCheck className="w-3 h-3" />
                    <span>v{doc.version}.0</span>
                  </div>
                </div>

                <h3 className="text-base font-semibold text-white group-hover:text-purple-300 transition line-clamp-2">
                  {doc.title}
                </h3>

                <p className="text-xs text-slate-400 line-clamp-3 leading-relaxed">
                  {doc.summary || doc.content}
                </p>
              </div>

              <div className="space-y-3 pt-3 border-t border-surface-border/60">
                {doc.tags && Array.isArray(doc.tags) && doc.tags.length > 0 && (
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {doc.tags.slice(0, 3).map((tag: string, i: number) => (
                      <span
                        key={i}
                        className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded bg-slate-800/60 text-slate-400 border border-slate-700/60"
                      >
                        <Tag className="w-2.5 h-2.5" />
                        {tag}
                      </span>
                    ))}
                    {doc.tags.length > 3 && (
                      <span className="text-[10px] text-slate-500">+{doc.tags.length - 3}</span>
                    )}
                  </div>
                )}

                <div className="flex items-center justify-between text-xs text-slate-500">
                  <div className="flex items-center gap-1.5 truncate">
                    <User className="w-3.5 h-3.5 text-slate-600" />
                    <span className="truncate">
                      {doc.authorEmployee
                        ? `${doc.authorEmployee.firstName} ${doc.authorEmployee.lastName}`
                        : 'Elena Rostova (COO)'}
                    </span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-purple-400 group-hover:translate-x-0.5 transition" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Document View Modal */}
      {selectedDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-3xl max-h-[85vh] bg-slate-900 border border-slate-800 rounded-2xl flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-800 flex items-start justify-between bg-slate-900/90">
              <div className="space-y-2 max-w-xl">
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wider border ${getCategoryColor(
                      selectedDoc.category,
                    )}`}
                  >
                    {selectedDoc.category.replace(/_/g, ' ')}
                  </span>
                  <span className="text-xs text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" />
                    <span>Verified Knowledge</span>
                  </span>
                </div>
                <h2 className="text-xl font-bold text-white leading-snug">{selectedDoc.title}</h2>
                <div className="flex items-center gap-4 text-xs text-slate-400">
                  <span>Slug: <code className="text-purple-300 font-mono">{selectedDoc.slug}</code></span>
                  <span>Version: v{selectedDoc.version}.0</span>
                  <span>Date: {new Date(selectedDoc.createdAt).toLocaleDateString()}</span>
                </div>
              </div>

              <button
                onClick={() => setSelectedDoc(null)}
                className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {selectedDoc.summary && (
                <div className="p-4 rounded-xl bg-purple-950/30 border border-purple-800/40 text-purple-200 text-xs leading-relaxed space-y-1">
                  <div className="font-semibold text-purple-300 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Executive Summary</span>
                  </div>
                  <p>{selectedDoc.summary}</p>
                </div>
              )}

              <div className="p-5 rounded-xl bg-slate-950/80 border border-slate-800/80 font-mono text-xs text-slate-300 whitespace-pre-line leading-relaxed selection:bg-purple-900 selection:text-white">
                {selectedDoc.content}
              </div>

              {selectedDoc.tags && Array.isArray(selectedDoc.tags) && (
                <div className="flex items-center gap-2 flex-wrap pt-2">
                  <span className="text-xs text-slate-500 font-medium">Keywords:</span>
                  {selectedDoc.tags.map((tag: string, i: number) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-md bg-slate-800 text-slate-300 border border-slate-700"
                    >
                      <Tag className="w-3 h-3 text-purple-400" />
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between text-xs text-slate-400">
              <span>Author: {selectedDoc.authorEmployee ? `${selectedDoc.authorEmployee.firstName} ${selectedDoc.authorEmployee.lastName}` : 'Elena Rostova (COO)'}</span>
              <button
                onClick={() => setSelectedDoc(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-medium transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Knowledge Doc Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl flex flex-col shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-white">Create Knowledge Document</h2>
                <p className="text-xs text-slate-400">Publish validated institutional knowledge for AI agents</p>
              </div>
              <button
                onClick={() => setIsCreateOpen(false)}
                className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateDocument} className="p-6 space-y-4 overflow-y-auto max-h-[75vh]">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Document Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Frontend Architecture and Component Guidelines"
                  value={title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Slug / Identifier</label>
                  <input
                    type="text"
                    required
                    placeholder="frontend-architecture-guidelines"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-purple-300 font-mono placeholder-slate-500 focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Category</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as KnowledgeCategory)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                  >
                    <option value="CODING_STANDARDS">Coding Standards</option>
                    <option value="ARCHITECTURE_GUIDELINES">Architecture Guidelines</option>
                    <option value="QA_VERIFICATION">QA Verification</option>
                    <option value="COMPANY_POLICY">Company Policy</option>
                    <option value="SECURITY_PRACTICES">Security Practices</option>
                    <option value="PRODUCT_SPECIFICATION">Product Specification</option>
                    <option value="GENERAL">General</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Author Employee</label>
                <select
                  value={authorId}
                  onChange={(e) => setAuthorId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                >
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.firstName} {emp.lastName} ({emp.role})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Executive Summary (Optional)</label>
                <input
                  type="text"
                  placeholder="One or two sentences outlining the standard"
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Content / Specification</label>
                <textarea
                  required
                  rows={6}
                  placeholder="Detailed technical specifications, guidelines, rules, and procedures..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-white font-mono placeholder-slate-500 focus:outline-none focus:border-purple-500 leading-relaxed"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Tags (Comma-separated)</label>
                <input
                  type="text"
                  placeholder="react, typescript, testing, tailwind"
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="pt-4 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-medium transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white rounded-lg text-xs font-medium shadow-glow-purple transition"
                >
                  {submitting ? 'Publishing...' : 'Publish Knowledge Document'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default KnowledgeBasePage;
