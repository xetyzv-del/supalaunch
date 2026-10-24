/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Upload,
  Trash2,
  ImageIcon,
  X,
  Plus,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  CheckCircle2,
} from 'lucide-react';
import type { InfographicItem } from '../types/index.ts';
import { storeBlob, getBlob } from '../lib/db/blobStore';

interface DailyCruxCarouselProps {
  topicId: string;
  topicTitle: string;
  infographics: InfographicItem[];
  isStaff: boolean;
  onUpdateInfographics: (topicId: string, updated: InfographicItem[]) => Promise<void>;
}

export const DailyCruxCarousel: React.FC<DailyCruxCarouselProps> = ({
  topicId,
  topicTitle,
  infographics = [],
  isStaff,
  onUpdateInfographics,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxZoom, setLightboxZoom] = useState(1);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Upload modal state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [newTitle, setNewTitle] = useState('');
  const [newCaption, setNewCaption] = useState('');
  const [newSource, setNewSource] = useState('CivilEdge Editorial & Analytical Bureau');
  const [selectedFileDataUrl, setSelectedFileDataUrl] = useState<string | null>(null);
  const [selectedFileObj, setSelectedFileObj] = useState<File | null>(null);
  const [fileName, setFileName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Bounds check
  const total = infographics.length;
  const safeIndex = total > 0 ? Math.min(currentIndex, total - 1) : 0;
  const currentSlide = total > 0 ? infographics[safeIndex] : null;

  const [resolvedSlideUrl, setResolvedSlideUrl] = useState<string>('');

  useEffect(() => {
    let active = true;
    if (!currentSlide?.url) {
      setResolvedSlideUrl('');
      return;
    }
    if (currentSlide.url.startsWith('idb://')) {
      const key = currentSlide.url.replace('idb://', '');
      getBlob(key).then((blob) => {
        if (!active) return;
        if (blob) {
          setResolvedSlideUrl(URL.createObjectURL(blob));
        } else {
          setResolvedSlideUrl(currentSlide.url);
        }
      }).catch(() => {
        if (active) setResolvedSlideUrl(currentSlide.url);
      });
    } else {
      setResolvedSlideUrl(currentSlide.url);
    }
    return () => { active = false; };
  }, [currentSlide?.url]);

  const nextSlide = () => {
    if (total <= 1) return;
    setCurrentIndex((prev) => (prev + 1) % total);
  };

  const prevSlide = () => {
    if (total <= 1) return;
    setCurrentIndex((prev) => (prev - 1 + total) % total);
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (uploadModalOpen) return;
      if (e.key === 'ArrowRight') nextSlide();
      if (e.key === 'ArrowLeft') prevSlide();
      if (e.key === 'Escape' && lightboxOpen) setLightboxOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [total, lightboxOpen, uploadModalOpen]);

  const handleFileChange = (file: File) => {
    setUploadError(null);
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!['jpg', 'jpeg', 'png', 'webp', 'svg'].includes(ext || '')) {
      setUploadError('Please select a JPG, PNG, or SVG image.');
      return;
    }
    setSelectedFileObj(file);
    setFileName(file.name);
    if (!newTitle.trim()) {
      const clean = file.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ');
      setNewTitle(clean.charAt(0).toUpperCase() + clean.slice(1));
    }
    const reader = new FileReader();
    reader.onload = () => {
      setSelectedFileDataUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSaveInfographic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFileDataUrl) {
      setUploadError('Please choose an image file.');
      return;
    }
    if (!newTitle.trim()) {
      setUploadError('Please provide an infographic title.');
      return;
    }

    setIsSaving(true);
    setUploadError(null);

    try {
      const infoId = `info-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      if (selectedFileObj) {
        void storeBlob(`topic-info-${infoId}`, selectedFileObj);
      }
      const newSlide: InfographicItem = {
        id: infoId,
        url: selectedFileDataUrl,
        title: newTitle.trim(),
        caption: newCaption.trim() || undefined,
        source: newSource.trim() || undefined,
        uploadedAt: new Date().toISOString(),
      };

      const nextList = [...infographics, newSlide];
      await onUpdateInfographics(topicId, nextList);
      setCurrentIndex(nextList.length - 1);
      setUploadModalOpen(false);
      setNewTitle('');
      setNewCaption('');
      setSelectedFileDataUrl(null);
      setSelectedFileObj(null);
      setFileName('');
    } catch (err: any) {
      setUploadError(err.message || 'Failed to save infographic.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteSlide = async () => {
    if (!currentSlide) return;
    setIsDeleting(true);
    try {
      const nextList = infographics.filter((item) => item.id !== currentSlide.id);
      await onUpdateInfographics(topicId, nextList);
      setCurrentIndex((prev) => Math.max(0, prev - 1));
    } catch {
      // ignore
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Section Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-700">
            <ImageIcon className="w-4 h-4" />
          </div>
          <div>
            <h2 className="font-serif text-lg font-bold text-slate-900 flex items-center gap-2">
              Visual Synthesis &amp; Editorial Infographics
              {total > 0 && (
                <span className="text-xs font-mono font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
                  {safeIndex + 1} of {total}
                </span>
              )}
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              High-yield maps, flowcharts, institutional matrices &amp; economic diagrams
            </p>
          </div>
        </div>

        {isStaff && (
          <button
            type="button"
            onClick={() => {
              setUploadError(null);
              setUploadModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-xs transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Upload Infographic / Image</span>
          </button>
        )}
      </div>

      {/* Carousel Container */}
      {total > 0 && currentSlide ? (
        <div className="relative rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-xs group">
          {/* Main Slide Viewer */}
          <div className="relative min-h-[300px] sm:min-h-[420px] max-h-[580px] bg-gradient-to-b from-slate-100/70 to-slate-50 flex items-center justify-center p-3 sm:p-6 select-none overflow-hidden">
            <img
              src={resolvedSlideUrl || currentSlide.url}
              alt={currentSlide.title}
              className="max-h-[520px] w-auto max-w-full object-contain rounded-xl shadow-md transition-all duration-300 cursor-zoom-in border border-slate-200/80 bg-white"
              onClick={() => {
                setLightboxZoom(1);
                setLightboxOpen(true);
              }}
            />

            {/* Navigation Arrows */}
            {total > 1 && (
              <>
                <button
                  type="button"
                  onClick={prevSlide}
                  aria-label="Previous slide"
                  className="absolute left-3 top-1/2 -translate-y-1/2 p-2 sm:p-2.5 rounded-full bg-white/95 hover:bg-amber-500 hover:text-slate-950 text-slate-700 border border-slate-200 shadow-md transition-all opacity-90 hover:opacity-100 cursor-pointer"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  onClick={nextSlide}
                  aria-label="Next slide"
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-2 sm:p-2.5 rounded-full bg-white/95 hover:bg-amber-500 hover:text-slate-950 text-slate-700 border border-slate-200 shadow-md transition-all opacity-90 hover:opacity-100 cursor-pointer"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </>
            )}

            {/* Fullscreen Trigger */}
            <button
              type="button"
              onClick={() => {
                setLightboxZoom(1);
                setLightboxOpen(true);
              }}
              title="Expand into full screen"
              className="absolute top-3 right-3 p-2 rounded-xl bg-white/90 hover:bg-white text-slate-700 border border-slate-200 shadow-sm transition-colors cursor-pointer"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          </div>

          {/* Slide Details Bar */}
          <div className="border-t border-slate-200 bg-white p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1 min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wider">
                  Slide {safeIndex + 1} of {total}
                </span>
                {currentSlide.source && (
                  <>
                    <span className="text-slate-300">·</span>
                    <span className="text-xs text-slate-500 truncate font-medium">
                      Source: {currentSlide.source}
                    </span>
                  </>
                )}
              </div>
              <h3 className="text-sm sm:text-base font-serif font-bold text-slate-900">
                {currentSlide.title}
              </h3>
              {currentSlide.caption && (
                <p className="text-xs text-slate-600 leading-relaxed max-w-3xl">
                  {currentSlide.caption}
                </p>
              )}
            </div>

            {/* Controls & Dots */}
            <div className="flex items-center gap-4 shrink-0 self-end sm:self-center">
              {/* Pagination Dots */}
              {total > 1 && (
                <div className="flex items-center gap-1.5">
                  {infographics.map((item, idx) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setCurrentIndex(idx)}
                      title={`Go to slide ${idx + 1}`}
                      className={`h-2 rounded-full transition-all cursor-pointer ${
                        idx === safeIndex
                          ? 'w-6 bg-amber-500'
                          : 'w-2 bg-slate-200 hover:bg-slate-400'
                      }`}
                    />
                  ))}
                </div>
              )}

              {/* Admin delete slide */}
              {isStaff && (
                <button
                  type="button"
                  onClick={handleDeleteSlide}
                  disabled={isDeleting}
                  title="Remove this infographic slide"
                  className="p-2 rounded-lg border border-slate-200 bg-white text-slate-400 hover:text-rose-600 hover:border-rose-300 shadow-xs transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* Empty State */
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white/70 p-8 text-center space-y-3">
          <div className="mx-auto w-12 h-12 rounded-full bg-amber-50 flex items-center justify-center text-amber-700">
            <ImageIcon className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800">
              No Infographics Attached to this Crux Edition
            </h3>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
              Faculty and admins can upload visual flowcharts, GIS maps, and data cards to accelerate memory retention.
            </p>
          </div>
          {isStaff && (
            <button
              type="button"
              onClick={() => setUploadModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-xs transition-all cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5" />
              Upload First Daily Infographic
            </button>
          )}
        </div>
      )}

      {/* Fullscreen Lightbox Modal */}
      {lightboxOpen && currentSlide && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex flex-col justify-between p-4 sm:p-6"
        >
          {/* Lightbox Header */}
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
            <div>
              <span className="text-xs font-mono font-bold text-amber-400">
                {safeIndex + 1} / {total} · {topicTitle}
              </span>
              <h3 className="text-sm sm:text-base font-serif font-bold text-slate-100 truncate max-w-xl">
                {currentSlide.title}
              </h3>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setLightboxZoom((z) => Math.max(0.6, z - 0.25))}
                title="Zoom Out"
                className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors cursor-pointer"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <span className="text-xs font-mono text-slate-400 px-1">
                {Math.round(lightboxZoom * 100)}%
              </span>
              <button
                type="button"
                onClick={() => setLightboxZoom((z) => Math.min(3, z + 0.25))}
                title="Zoom In"
                className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors cursor-pointer"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setLightboxZoom(1)}
                title="Reset Zoom"
                className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setLightboxOpen(false)}
                className="p-2 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors cursor-pointer ml-2"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Lightbox Image Stage */}
          <div className="flex-1 overflow-auto flex items-center justify-center p-4">
            <img
              src={resolvedSlideUrl || currentSlide.url}
              alt={currentSlide.title}
              style={{ transform: `scale(${lightboxZoom})`, transformOrigin: 'center center' }}
              className="max-h-[82vh] max-w-full object-contain transition-transform duration-150 rounded-xl shadow-2xl"
            />
          </div>

          {/* Lightbox Footer Caption */}
          {currentSlide.caption && (
            <div className="border-t border-slate-800/80 pt-3 text-center">
              <p className="text-xs sm:text-sm text-slate-300 max-w-3xl mx-auto leading-relaxed">
                {currentSlide.caption}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Staff Upload Infographic Modal */}
      {uploadModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Upload Infographic"
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
        >
          <div className="w-full max-w-lg bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden my-auto flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 bg-gradient-to-r from-amber-50/60 to-slate-50">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-700">
                  <Upload className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-serif font-bold text-slate-900">
                    Upload Infographic to Daily Crux
                  </h3>
                  <p className="text-xs text-slate-500">
                    Add visual charts, maps, or flowcharts to this editorial
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setUploadModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveInfographic} className="p-6 space-y-4">
              {/* File Dropzone */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2">
                  Select Visual Image (.jpg, .png, .svg)
                </label>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    if (e.dataTransfer.files?.[0]) handleFileChange(e.dataTransfer.files[0]);
                  }}
                  className="border-2 border-dashed border-slate-300 hover:border-amber-500 bg-slate-50/80 rounded-2xl p-4 text-center cursor-pointer transition-all"
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".jpg,.jpeg,.png,.webp,.svg"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleFileChange(e.target.files[0]);
                      }
                    }}
                    className="hidden"
                  />

                  {selectedFileDataUrl ? (
                    <div className="flex items-center gap-3 text-left">
                      <img
                        src={selectedFileDataUrl}
                        alt="Preview"
                        className="w-16 h-16 object-cover rounded-xl border border-slate-200 shrink-0"
                      />
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-900 truncate">{fileName}</p>
                        <p className="text-[11px] text-emerald-600 font-semibold mt-0.5 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Ready for upload
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-1 py-2">
                      <Upload className="w-6 h-6 text-amber-600 mx-auto" />
                      <p className="text-xs font-bold text-slate-800">
                        Click to select an image file
                      </p>
                      <p className="text-[10px] text-slate-500">
                        Supports high-resolution diagrams, mindmaps, and GIS maps
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Infographic Title <span className="text-amber-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. RBI e-Rupee Cross-Border Settlement Rail Diagram"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-amber-500 focus:bg-white"
                />
              </div>

              {/* Caption */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Analytical Takeaway / Caption
                </label>
                <textarea
                  rows={2}
                  value={newCaption}
                  onChange={(e) => setNewCaption(e.target.value)}
                  placeholder="Explain the core institutional mechanism or data takeaway..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-amber-500 focus:bg-white leading-relaxed"
                />
              </div>

              {/* Source */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Source Attribution
                </label>
                <input
                  type="text"
                  value={newSource}
                  onChange={(e) => setNewSource(e.target.value)}
                  placeholder="e.g. BIS Innovation Hub & RBI Bulletin"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-amber-500 focus:bg-white"
                />
              </div>

              {uploadError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700">
                  {uploadError}
                </div>
              )}

              {/* Buttons */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setUploadModalOpen(false)}
                  disabled={isSaving}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-bold text-xs shadow-xs transition-all cursor-pointer inline-flex items-center gap-1.5"
                >
                  {isSaving ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="w-3.5 h-3.5" />
                      Save Infographic
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
