/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import {
  X,
  Upload,
  FileText,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import type { ResourceCategory, GSBadge, ResourceFormat } from '../types/index.ts';
import type { NewResourcePayload } from '../lib/db/repo.ts';

interface UploadResourceModalProps {
  open: boolean;
  onClose: () => void;
  onUpload: (payload: NewResourcePayload) => Promise<void>;
  defaultAuthor?: string;
}

export const UploadResourceModal: React.FC<UploadResourceModalProps> = ({
  open,
  onClose,
  onUpload,
  defaultAuthor = 'CivilEdge Faculty Bureau',
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<ResourceCategory>('standard');
  const [gsPaper, setGsPaper] = useState<GSBadge>('GS-2');
  const [format, setFormat] = useState<ResourceFormat>('pdf');
  const [author, setAuthor] = useState(defaultAuthor);
  const [pages, setPages] = useState<number | ''>(12);
  const [summary, setSummary] = useState('');
  const [topicsInput, setTopicsInput] = useState('');

  // Selected file state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewDataUrl, setPreviewDataUrl] = useState<string | null>(null);
  const [fileSizeText, setFileSizeText] = useState<string>('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  if (!open) return null;

  const handleFile = (file: File) => {
    setErrorMsg(null);
    const ext = file.name.split('.').pop()?.toLowerCase();
    let detectedFormat: ResourceFormat = 'pdf';

    if (ext === 'pdf') {
      detectedFormat = 'pdf';
    } else if (ext === 'jpg' || ext === 'jpeg' || ext === 'png' || ext === 'webp') {
      detectedFormat = 'jpg';
    } else {
      setErrorMsg('Please select a PDF document or JPG/PNG image.');
      return;
    }

    setSelectedFile(file);
    setFormat(detectedFormat);

    // Format file size
    if (file.size < 1024 * 1024) {
      setFileSizeText(`${Math.round(file.size / 1024)} KB`);
    } else {
      setFileSizeText(`${(file.size / (1024 * 1024)).toFixed(2)} MB`);
    }

    // Auto-fill title if empty
    if (!title.trim()) {
      const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ');
      setTitle(cleanName.charAt(0).toUpperCase() + cleanName.slice(1));
    }

    // For images, generate base64 data URL for preview; for PDFs, generate lightweight Object URL
    if (detectedFormat === 'jpg') {
      const reader = new FileReader();
      reader.onload = () => {
        setPreviewDataUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else if (typeof URL !== 'undefined' && typeof URL.createObjectURL === 'function') {
      setPreviewDataUrl(URL.createObjectURL(file));
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMsg('Please provide a resource title.');
      return;
    }
    if (!summary.trim()) {
      setErrorMsg('Please provide an analytical summary or table of contents overview.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const topics = topicsInput
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

      const payload: NewResourcePayload = {
        title: title.trim(),
        category,
        gsPaper,
        format,
        pages: typeof pages === 'number' && pages > 0 ? pages : null,
        authorOrSource: author.trim() || 'CivilEdge Faculty',
        summary: summary.trim(),
        topicsCovered: topics.length > 0 ? topics : [category.toUpperCase(), gsPaper],
        file: selectedFile,
        fileData: previewDataUrl ?? undefined,
        autoApprove: true,
      };

      await onUpload(payload);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to upload academic resource.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Upload Academic Resource"
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
    >
      <div className="w-full max-w-2xl bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden my-auto flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 bg-gradient-to-r from-amber-50/70 to-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-700">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-serif font-bold text-slate-900">
                Upload Academic Resource (PDF / JPG)
              </h2>
              <p className="text-xs text-slate-500">
                Add standard compendiums, high-yield infographics, and official syllabus handouts
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* File Dropzone */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
              Select Document or Visual Infographic File (.pdf, .jpg, .png)
            </label>
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-5 text-center cursor-pointer transition-all ${
                isDragging
                  ? 'border-amber-500 bg-amber-50'
                  : selectedFile
                  ? 'border-emerald-500 bg-emerald-50/50'
                  : 'border-slate-300 hover:border-amber-400 bg-slate-50/80'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.webp"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFile(e.target.files[0]);
                  }
                }}
                className="hidden"
              />

              {selectedFile ? (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-left">
                  <div className="flex items-center gap-3">
                    {format === 'jpg' ? (
                      previewDataUrl ? (
                        <img
                          src={previewDataUrl}
                          alt="Thumbnail preview"
                          className="w-14 h-14 object-cover rounded-xl border border-slate-200"
                        />
                      ) : (
                        <ImageIcon className="w-10 h-10 text-amber-600" />
                      )
                    ) : (
                      <div className="w-12 h-12 rounded-xl bg-red-50 border border-red-200 flex items-center justify-center text-red-600">
                        <FileText className="w-6 h-6" />
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-bold text-slate-900 truncate max-w-sm">
                        {selectedFile.name}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        <span className="uppercase font-bold text-amber-700">{format}</span> · {fileSizeText}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      fileInputRef.current?.click();
                    }}
                    className="text-xs text-amber-700 hover:text-amber-800 font-bold underline underline-offset-2 cursor-pointer"
                  >
                    Change File
                  </button>
                </div>
              ) : (
                <div className="space-y-2 py-2">
                  <div className="mx-auto w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center text-amber-700">
                    <Upload className="w-5 h-5" />
                  </div>
                  <p className="text-xs font-bold text-slate-800">
                    Click to browse or drag and drop your file here
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Supports <strong className="text-amber-700">PDF</strong> (Handouts, Book chapters) and{' '}
                    <strong className="text-amber-700">JPG / PNG</strong> (Maps, Infographics, Flowcharts) up to 25 MB
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Title & Format */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Resource Title <span className="text-amber-600">*</span>
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Laxmikanth 7th Edition: Constitutional Bodies Summary Matrix"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-amber-500 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Format
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setFormat('pdf')}
                  className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                    format === 'pdf'
                      ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-xs'
                      : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                  }`}
                >
                  PDF
                </button>
                <button
                  type="button"
                  onClick={() => setFormat('jpg')}
                  className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                    format === 'jpg'
                      ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-xs'
                      : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                  }`}
                >
                  JPG / Image
                </button>
              </div>
            </div>
          </div>

          {/* GS Paper & Category */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                GS Paper
              </label>
              <select
                value={gsPaper}
                onChange={(e) => setGsPaper(e.target.value as GSBadge)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-amber-500 focus:bg-white cursor-pointer"
              >
                <option value="GS-1">GS-1 (History, Geo, Society)</option>
                <option value="GS-2">GS-2 (Polity, Governance, IR)</option>
                <option value="GS-3">GS-3 (Economy, Env, Tech)</option>
                <option value="GS-4">GS-4 (Ethics, Integrity)</option>
                <option value="CSAT">CSAT (Paper II)</option>
                <option value="Current Affairs">Current Affairs</option>
                <option value="Essay">Essay Lab</option>
                <option value="Optional">Optional Subject</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Academic Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as ResourceCategory)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-amber-500 focus:bg-white cursor-pointer"
              >
                <option value="ncert">NCERT Essentials</option>
                <option value="standard">Standard Reference Book</option>
                <option value="yojana">Yojana & Kurukshetra</option>
                <option value="pib">PIB Policy Compendium</option>
                <option value="pyq">UPSC PYQ Archives</option>
                <option value="user">Faculty / Community Notes</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Pages / Slides
              </label>
              <input
                type="number"
                min={1}
                value={pages}
                onChange={(e) => setPages(e.target.value ? Number(e.target.value) : '')}
                placeholder="e.g. 16"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-amber-500 focus:bg-white"
              />
            </div>
          </div>

          {/* Author & Source */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Author / Source Attribution
            </label>
            <input
              type="text"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              placeholder="e.g. CivilEdge Academic Bureau / Prof. Menon"
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-amber-500 focus:bg-white"
            />
          </div>

          {/* Analytical Summary */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Analytical Summary & Key Insights <span className="text-amber-600">*</span>
            </label>
            <textarea
              rows={3}
              required
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="Concise overview of what aspirants will learn, statutory anchors, key articles, and exam relevance..."
              className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-amber-500 focus:bg-white leading-relaxed"
            />
          </div>

          {/* Topics Covered (Tags) */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Key Topics Covered (Comma-separated tags)
            </label>
            <input
              type="text"
              value={topicsInput}
              onChange={(e) => setTopicsInput(e.target.value)}
              placeholder="e.g. Article 280, Fiscal Devolution, Cesses, Punchhi Commission"
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-amber-500 focus:bg-white"
            />
          </div>

          {/* Error Message */}
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 flex items-center gap-2 text-xs text-rose-700">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}
        </form>

        {/* Footer */}
        <div className="border-t border-slate-200 px-6 py-4 bg-slate-50/80 flex items-center justify-between gap-4">
          <p className="text-[11px] text-slate-500 hidden sm:block">
            Resources are indexed with full-text search and offline export.
          </p>
          <div className="flex items-center gap-3 ml-auto">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-200 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-bold text-xs shadow-xs transition-all cursor-pointer inline-flex items-center gap-1.5"
            >
              {isSubmitting ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="w-3.5 h-3.5" />
                  Publish Resource
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
