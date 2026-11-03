import React, { useEffect, useState } from 'react';
import {
  FeedCategory,
  CompanyFeedItem,
} from '@vac/shared';
import { useCompanyFeedStore } from '../../../store/useCompanyFeedStore';
import {
  Activity,
  Lightbulb,
  CheckSquare,
  Users,
  MessageSquare,
  ShieldAlert,
  Clock,
  ExternalLink,
  RefreshCw,
  Search,
  Filter,
} from 'lucide-react';

interface GlobalCompanyFeedProps {
  onSelectEmployee?: (employeeId: string) => void;
  onSelectTask?: (taskId: string) => void;
}

const CATEGORY_TABS: { id: FeedCategory; label: string; icon: React.FC<{ className?: string }> }[] = [
  { id: 'ALL', label: 'All', icon: Activity },
  { id: 'IDEAS', label: 'Ideas', icon: Lightbulb },
  { id: 'TASKS', label: 'Tasks', icon: CheckSquare },
  { id: 'MEETINGS', label: 'Meetings', icon: Users },
  { id: 'MESSAGES', label: 'Messages', icon: MessageSquare },
];

function formatTimeAgo(isoDate: string): string {
  try {
    const diffMs = Date.now() - new Date(isoDate).getTime();
    const diffSec = Math.floor(diffMs / 1000);
    if (diffSec < 45) return 'Just now';
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr}h ago`;
    const diffDays = Math.floor(diffHr / 24);
    return `${diffDays}d ago`;
  } catch {
    return 'Recently';
  }
}

export const GlobalCompanyFeed: React.FC<GlobalCompanyFeedProps> = ({
  onSelectEmployee,
  onSelectTask,
}) => {
  const {
    items,
    activeCategory,
    isLoading,
    error,
    fetchFeed,
    setCategory,
  } = useCompanyFeedStore();

  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchFeed();
  }, [fetchFeed]);

  const filteredItems = items.filter((item) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      item.title.toLowerCase().includes(q) ||
      (item.description && item.description.toLowerCase().includes(q)) ||
      (item.author?.name && item.author.name.toLowerCase().includes(q)) ||
      (item.author?.departmentName && item.author.departmentName.toLowerCase().includes(q))
    );
  });

  const getCategoryBadgeStyle = (category: string) => {
    switch (category) {
      case 'IDEAS':
        return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
      case 'TASKS':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'MEETINGS':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'MESSAGES':
        return 'bg-sky-500/10 text-sky-400 border-sky-500/20';
      case 'APPROVALS':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'ALERTS':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
      default:
        return 'bg-stone-500/10 text-stone-300 border-stone-500/20';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'IDEAS':
        return <Lightbulb className="w-3.5 h-3.5 text-purple-400" />;
      case 'TASKS':
        return <CheckSquare className="w-3.5 h-3.5 text-blue-400" />;
      case 'MEETINGS':
        return <Users className="w-3.5 h-3.5 text-emerald-400" />;
      case 'MESSAGES':
        return <MessageSquare className="w-3.5 h-3.5 text-sky-400" />;
      case 'APPROVALS':
        return <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />;
      default:
        return <Activity className="w-3.5 h-3.5 text-stone-400" />;
    }
  };

  const handleItemClick = (item: CompanyFeedItem) => {
    if (item.entityType === 'task' && onSelectTask) {
      onSelectTask(item.entityId);
    } else if (item.author?.id && onSelectEmployee) {
      onSelectEmployee(item.author.id);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#12141A] text-[#E6E8EC]">
      {/* Feed Header */}
      <div className="px-4 py-3 border-b border-[#242833] flex items-center justify-between bg-[#171A21]/70 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
              Live
            </span>
          </div>
          <h2 className="text-sm font-semibold text-white tracking-tight">
            Company Feed
          </h2>
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#202530] text-[#9AA1AF] font-mono">
            {items.length}
          </span>
        </div>

        <button
          onClick={() => fetchFeed()}
          disabled={isLoading}
          title="Refresh company feed"
          className="p-1.5 rounded-lg text-[#9AA1AF] hover:text-white hover:bg-[#202530] transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-emerald-400' : ''}`} />
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="px-3 pt-2.5 pb-1 border-b border-[#242833] bg-[#14171E]">
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pb-1.5">
          {CATEGORY_TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeCategory === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setCategory(tab.id)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-[#10B981] text-white shadow-sm font-semibold'
                    : 'text-[#9AA1AF] hover:text-[#E6E8EC] hover:bg-[#1E222B]'
                }`}
              >
                <Icon className="w-3 h-3" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Search Bar */}
        <div className="relative mt-2 mb-1.5">
          <Search className="w-3.5 h-3.5 text-[#6B7280] absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search feed activities..."
            className="w-full pl-8 pr-3 py-1.5 bg-[#1B1F28] border border-[#2A2F3A] rounded-lg text-xs text-[#E6E8EC] placeholder-[#6B7280] focus:outline-none focus:border-emerald-500/60 transition-colors"
          />
        </div>
      </div>

      {/* Feed List */}
      <div className="flex-1 overflow-y-auto divide-y divide-[#1D212A] p-2 space-y-1">
        {isLoading && items.length === 0 ? (
          <div className="py-12 flex flex-col items-center justify-center text-[#9AA1AF] text-xs space-y-2">
            <RefreshCw className="w-5 h-5 animate-spin text-emerald-400" />
            <span>Loading company activity stream...</span>
          </div>
        ) : error && items.length === 0 ? (
          <div className="py-10 px-4 text-center">
            <p className="text-xs text-rose-400 mb-2">{error}</p>
            <button
              onClick={() => fetchFeed()}
              className="text-xs text-emerald-400 hover:underline inline-flex items-center gap-1"
            >
              <RefreshCw className="w-3 h-3" /> Retry loading
            </button>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="py-12 text-center text-[#9AA1AF] text-xs">
            <Filter className="w-6 h-6 mx-auto mb-2 text-[#4B5563]" />
            <p>No activity found in this category.</p>
          </div>
        ) : (
          filteredItems.map((item) => (
            <div
              key={item.id}
              onClick={() => handleItemClick(item)}
              className="group p-2.5 rounded-lg bg-[#151821] hover:bg-[#1C202B] border border-transparent hover:border-[#2C3240] transition-all cursor-pointer relative"
            >
              {/* Category & Timestamp Row */}
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <div className="flex items-center gap-1.5">
                  <span
                    className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium border ${getCategoryBadgeStyle(
                      item.category,
                    )}`}
                  >
                    {getCategoryIcon(item.category)}
                    {item.category}
                  </span>

                  {item.author?.departmentName && (
                    <span className="text-[10px] text-[#8C93A3] font-mono">
                      • {item.author.departmentName}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1 text-[10px] text-[#6B7280]">
                  <Clock className="w-2.5 h-2.5" />
                  <span>{formatTimeAgo(item.timestamp)}</span>
                </div>
              </div>

              {/* Title */}
              <h3 className="text-xs font-semibold text-[#F1F3F6] group-hover:text-emerald-300 transition-colors line-clamp-1 mb-1">
                {item.title}
              </h3>

              {/* Content Snippet */}
              <p className="text-[11px] text-[#9AA1AF] leading-relaxed line-clamp-2 mb-2 font-normal">
                {item.description}
              </p>

              {/* Author Footer */}
              <div className="flex items-center justify-between pt-1 border-t border-[#1F2430]/70 text-[10px]">
                <div className="flex items-center gap-1.5 text-[#9AA1AF]">
                  {item.author?.avatarUrl ? (
                    <img
                      src={item.author.avatarUrl}
                      alt={item.author.name || 'User'}
                      className="w-4 h-4 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-4 h-4 rounded-full bg-[#262C3A] text-emerald-400 font-bold flex items-center justify-center text-[9px]">
                      {(item.author?.name || 'U').charAt(0)}
                    </div>
                  )}
                  <span className="font-medium text-[#C3C8D4] truncate max-w-[130px]">
                    {item.author?.name || 'System'}
                  </span>
                  {item.author?.role && (
                    <span className="text-[#6B7280] truncate max-w-[100px]">
                      ({item.author.role})
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1 text-[#6B7280] group-hover:text-emerald-400 transition-colors">
                  <span className="text-[10px] font-medium">Inspect</span>
                  <ExternalLink className="w-2.5 h-2.5" />
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
