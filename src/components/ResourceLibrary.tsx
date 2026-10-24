import React, { useState, useMemo } from 'react';
import {
  BookOpen,
  Search,
  Filter,
  Download,
  Eye,
  FileText,
  Star,
  Upload,
  CheckCircle,
  Tag,
  ExternalLink,
  Image as ImageIcon,
} from 'lucide-react';
import type { ResourceItem, ResourceCategory, GSBadge } from '../types/index.ts';
import { UploadResourceModal } from './UploadResourceModal';

interface ResourceLibraryProps {
  resources: ResourceItem[];
  isStaff?: boolean;
  onOpenResource?: (resource: ResourceItem) => Promise<any> | void;
  onOpenReader?: (resource: ResourceItem) => void;
  onDownloadResource?: (resource: ResourceItem) => Promise<void>;
  onUploadResource?: (newResource: any) => Promise<any>;
  onModerateResource?: (id: string, status: any) => Promise<any>;
  onDeleteResource?: (id: string) => Promise<any>;
}

export const ResourceLibrary: React.FC<ResourceLibraryProps> = ({
  resources,
  isStaff,
  onOpenResource,
  onOpenReader,
  onDownloadResource,
  onUploadResource,
  onModerateResource,
  onDeleteResource,
}) => {
  const openHandler = onOpenResource || onOpenReader;
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedPaper, setSelectedPaper] = useState<string>('all');
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);

  const categories: { label: string; value: string }[] = [
    { label: 'All Resources', value: 'all' },
    { label: 'NCERT Essentials', value: 'ncert' },
    { label: 'Standard References', value: 'standard' },
    { label: 'Yojana & Kurukshetra', value: 'yojana' },
    { label: 'PIB Compendiums', value: 'pib' },
    { label: 'UPSC PYQ Archives', value: 'pyq' },
    { label: 'Faculty & Notes', value: 'user' },
  ];

  const papers = ['all', 'GS-1', 'GS-2', 'GS-3', 'GS-4', 'CSAT', 'Current Affairs', 'Essay', 'Optional'];

  const filteredResources = useMemo(() => {
    return resources.filter((res) => {
      if (selectedCategory !== 'all' && res.category !== selectedCategory) return false;
      if (selectedPaper !== 'all' && res.gsPaper !== selectedPaper) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = res.title.toLowerCase().includes(q);
        const matchSource = res.authorOrSource.toLowerCase().includes(q);
        const matchSummary = res.summary.toLowerCase().includes(q);
        const matchTopics = res.topicsCovered.some((t) => t.toLowerCase().includes(q));
        if (!matchTitle && !matchSource && !matchSummary && !matchTopics) return false;
      }
      return true;
    });
  }, [resources, selectedCategory, selectedPaper, searchQuery]);

  const handleDownload = async (res: ResourceItem) => {
    setDownloadingId(res.id);
    try {
      if (onDownloadResource) {
        await onDownloadResource(res);
      }
    } finally {
      setDownloadingId(null);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024 * 1024) {
      return `${Math.round(bytes / 1024)} KB`;
    }
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
      {/* Top Banner */}
      <div className="bg-gradient-to-br from-white via-amber-50/40 to-slate-50 text-slate-900 rounded-3xl p-6 sm:p-8 border border-amber-200/90 shadow-xs relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-amber-400/10 via-orange-300/10 to-transparent rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100/90 border border-amber-300/80 text-amber-900 text-xs font-semibold uppercase tracking-wider mb-3">
              <BookOpen className="w-3.5 h-3.5 text-amber-700" />
              CivilEdge Knowledge Compendium
            </div>
            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-slate-900 tracking-tight">
              Standard Reference Compendiums &amp; Handouts
            </h2>
            <p className="mt-2 text-slate-600 text-sm max-w-2xl leading-relaxed">
              Curated NCERT highlights, standard book summaries (Laxmikanth, Spectrum, Shankar IAS),
              visual infographics, monthly Yojana synopses, and PIB policy archives in PDF/JPG format.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="bg-white/90 p-3.5 rounded-2xl border border-slate-200 shadow-xs text-center min-w-[130px]">
              <div className="text-xs text-slate-500 font-medium">Total Compendiums</div>
              <div className="text-2xl font-serif font-bold text-slate-900 mt-0.5">
                {resources.length}
              </div>
            </div>

            {isStaff ? (
              <button
                type="button"
                onClick={() => setUploadModalOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs sm:text-sm shadow-md transition-all cursor-pointer shrink-0"
              >
                <Upload className="w-4 h-4" />
                <span>+ Upload Resource (PDF / JPG)</span>
              </button>
            ) : null}
          </div>
        </div>
      </div>

      {/* Search & Filter Header */}
      <div className="space-y-4">
        {/* Search Bar */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search compendiums by subject, keyword (e.g. 'Basic Structure', 'Ramsar', 'Monetary Policy'), or author..."
            className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 shadow-xs"
          />
        </div>

        {/* Categories Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
          <div className="flex flex-wrap items-center gap-2 overflow-x-auto max-w-full pb-1 sm:pb-0">
            {categories.map((c) => (
              <button
                key={c.value}
                onClick={() => setSelectedCategory(c.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  selectedCategory === c.value
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs text-slate-500 font-medium uppercase tracking-wider">
              Paper:
            </span>
            <select
              value={selectedPaper}
              onChange={(e) => setSelectedPaper(e.target.value)}
              className="text-xs font-medium bg-white border border-slate-200 text-slate-700 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-amber-500 cursor-pointer shadow-xs"
            >
              {papers.map((p) => (
                <option key={p} value={p}>
                  {p === 'all' ? 'All Papers' : p}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Resources Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredResources.map((res) => (
          <div
            key={res.id}
            className="group bg-white rounded-2xl border border-slate-200 hover:border-amber-400 hover:shadow-md transition-all p-5 flex flex-col justify-between"
          >
            <div>
              {/* Header tags */}
              <div className="flex items-center justify-between gap-2 mb-3">
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-800 border border-slate-200">
                  {res.gsPaper}
                </span>
                <span
                  className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                    res.format === 'jpg' || res.format === 'png'
                      ? 'bg-amber-100 text-amber-900 border border-amber-300'
                      : 'bg-slate-100 text-slate-600 border border-slate-200'
                  }`}
                >
                  {res.format === 'jpg' || res.format === 'png' ? (
                    <ImageIcon className="w-3 h-3 text-amber-700" />
                  ) : (
                    <FileText className="w-3 h-3 text-slate-500" />
                  )}
                  {res.format.toUpperCase()} • {formatFileSize(res.sizeBytes)}
                </span>
              </div>

              {/* Thumbnail if visual image */}
              {(res.format === 'jpg' || res.format === 'png') && res.fileData ? (
                <div
                  onClick={() => openHandler?.(res)}
                  className="mb-3 rounded-xl overflow-hidden border border-slate-200 bg-slate-100 max-h-36 flex items-center justify-center cursor-pointer group/img relative"
                >
                  <img
                    src={res.fileData}
                    alt={res.title}
                    className="w-full h-32 object-cover group-hover/img:scale-105 transition-transform duration-200"
                  />
                  <div className="absolute inset-0 bg-slate-950/20 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-semibold">
                    Click to Enlarge
                  </div>
                </div>
              ) : null}

              {/* Title */}
              <h3 className="font-serif font-bold text-base text-slate-900 group-hover:text-amber-700 transition-colors leading-snug">
                {res.title}
              </h3>
              <p className="text-xs text-slate-500 mt-1 font-medium">
                {res.authorOrSource}
              </p>

              {/* Summary */}
              <p className="text-xs text-slate-600 mt-3 leading-relaxed line-clamp-3">
                {res.summary}
              </p>

              {/* Topic Pills */}
              <div className="flex flex-wrap gap-1.5 mt-4">
                {res.topicsCovered.slice(0, 3).map((topic, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-50 border border-slate-200 text-[10px] text-slate-600"
                  >
                    <Tag className="w-2.5 h-2.5 text-slate-400" />
                    {topic}
                  </span>
                ))}
                {res.topicsCovered.length > 3 && (
                  <span className="text-[10px] text-slate-400 self-center">
                    +{res.topicsCovered.length - 3} more
                  </span>
                )}
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
              <div className="flex items-center gap-1 text-slate-500">
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                <span className="font-bold text-slate-800">{res.rating.toFixed(1)}</span>
                <span className="text-slate-400">({res.downloads} reads)</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => openHandler?.(res)}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold transition-colors cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5" />
                  Read
                </button>
                <button
                  onClick={() => handleDownload(res)}
                  disabled={downloadingId === res.id}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-amber-500 hover:text-slate-950 text-white font-semibold transition-all cursor-pointer shadow-xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  {downloadingId === res.id ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredResources.length === 0 && (
        <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 shadow-xs">
          <BookOpen className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <h4 className="font-serif text-lg font-medium text-slate-800">
            No compendiums matching your criteria
          </h4>
          <p className="text-slate-500 text-sm mt-1">
            Try adjusting your search query or selecting 'All Resources'.
          </p>
        </div>
      )}

      {/* Upload Resource Modal for Admin/Faculty */}
      <UploadResourceModal
        open={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        onUpload={async (payload) => {
          if (onUploadResource) {
            await onUploadResource(payload);
          }
        }}
      />
    </div>
  );
};
