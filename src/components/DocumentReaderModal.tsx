import { useState } from 'react';
import { Check, Copy, Download, FileText, Image as ImageIcon, ZoomIn, ZoomOut, RotateCcw, X } from 'lucide-react';
import { triggerBlobDownload } from '../lib/format';
import type { DocumentOpenPayload } from '../lib/db/repo';

interface DocumentReaderModalProps {
  doc: DocumentOpenPayload | null;
  onClose: () => void;
}

export function DocumentReaderModal({ doc, onClose }: DocumentReaderModalProps) {
  const [copied, setCopied] = useState(false);
  const [zoomLevel, setZoomLevel] = useState<number>(1);

  if (!doc) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(doc.markdownContent);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      // ignore
    }
  };

  const isImage =
    doc.format === 'jpg' ||
    doc.format === 'png' ||
    Boolean(doc.imageUrl) ||
    Boolean(doc.signedUrl?.startsWith('data:image'));

  const imageSrc = doc.imageUrl || (doc.signedUrl?.startsWith('data:image') ? doc.signedUrl : null);

  const handleDownload = () => {
    if (doc.signedUrl) {
      const link = document.createElement('a');
      link.href = doc.signedUrl;
      const cleanName = doc.downloadFilename?.replace(/\.md$/, '') || `${doc.title.replace(/[^a-zA-Z0-9_-]/g, '_')}.pdf`;
      link.download = cleanName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else if (isImage && imageSrc) {
      const link = document.createElement('a');
      link.href = imageSrc;
      link.download = doc.downloadFilename || 'Academic_Infographic.jpg';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      triggerBlobDownload(doc.downloadFilename, doc.markdownContent);
    }
  };

  const lines = doc.markdownContent.split('\n');

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={doc.title}
      className="fixed inset-0 z-50 bg-slate-950/45 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6"
    >
      <div className="w-full max-w-4xl max-h-[90vh] flex flex-col rounded-3xl border border-slate-200 bg-white shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-6 py-4 bg-gradient-to-r from-amber-50/40 via-white to-slate-50/70">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-amber-700 tracking-wide uppercase">
                {doc.format ? doc.format.toUpperCase() : 'DOCUMENT'}
              </span>
              <span className="text-slate-400">·</span>
              <p className="text-xs font-medium text-slate-500 truncate">{doc.subtitle}</p>
            </div>
            <h2 className="mt-1 font-serif text-lg sm:text-xl font-bold text-slate-900 truncate">
              {doc.title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close reader"
            className="rounded-xl p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          {/* Visual Image / Infographic View */}
          {isImage && imageSrc ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span className="inline-flex items-center gap-1.5 font-semibold text-amber-800">
                  <ImageIcon className="w-4 h-4 text-amber-600" />
                  High-Resolution Visual Infographic Preview
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setZoomLevel((z) => Math.max(0.6, z - 0.2))}
                    title="Zoom Out"
                    className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                  >
                    <ZoomOut className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-[11px] font-mono text-slate-600 px-1 font-semibold">
                    {Math.round(zoomLevel * 100)}%
                  </span>
                  <button
                    type="button"
                    onClick={() => setZoomLevel((z) => Math.min(2.5, z + 0.2))}
                    title="Zoom In"
                    className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                  >
                    <ZoomIn className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setZoomLevel(1)}
                    title="Reset Zoom"
                    className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="overflow-auto max-h-[55vh] rounded-2xl border border-slate-200 bg-slate-50/80 p-4 flex items-center justify-center">
                <img
                  src={imageSrc}
                  alt={doc.title}
                  style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'top center' }}
                  className="max-w-full h-auto object-contain transition-transform duration-150 rounded-xl shadow-md"
                />
              </div>
            </div>
          ) : doc.signedUrl ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span className="inline-flex items-center gap-1.5 font-medium">
                  <FileText className="w-3.5 h-3.5 text-amber-600" />
                  Attached Document Preview
                </span>
                <a
                  href={doc.signedUrl}
                  download={doc.downloadFilename.replace(/\.md$/, '')}
                  className="text-amber-700 hover:text-amber-800 font-semibold underline underline-offset-4"
                >
                  Save Original Attachment
                </a>
              </div>
              <iframe
                title={doc.title}
                src={doc.signedUrl}
                className="w-full h-96 rounded-2xl border border-slate-200 bg-slate-50"
              />
            </div>
          ) : null}

          {/* Markdown Text Notes */}
          <article className="space-y-3 text-sm text-slate-700 leading-relaxed border-t border-slate-100 pt-4">
            {lines.map((line, idx) => {
              if (line.startsWith('# ')) {
                return (
                  <h3 key={idx} className="font-serif text-xl font-bold text-slate-900 pt-1">
                    {line.slice(2)}
                  </h3>
                );
              }
              if (line.startsWith('## ')) {
                return (
                  <h4 key={idx} className="font-serif text-base font-semibold text-amber-900 pt-3">
                    {line.slice(3)}
                  </h4>
                );
              }
              if (line.startsWith('### ')) {
                return (
                  <h5 key={idx} className="text-sm font-semibold text-slate-900 pt-2">
                    {line.slice(4)}
                  </h5>
                );
              }
              if (line === '---') {
                return <hr key={idx} className="border-slate-200 my-3" />;
              }
              if (line.startsWith('- ')) {
                return (
                  <p key={idx} className="pl-4 text-slate-700">
                    <span className="text-amber-600 mr-2 font-bold">•</span>
                    {line.slice(2).replace(/\*\*/g, '')}
                  </p>
                );
              }
              if (/^\d+\.\s/.test(line)) {
                return (
                  <p key={idx} className="pl-2 text-slate-800 font-medium">
                    {line}
                  </p>
                );
              }
              if (!line.trim()) {
                return <div key={idx} className="h-1" />;
              }
              return (
                <p key={idx} className="text-slate-700">
                  {line.replace(/\*\*/g, '')}
                </p>
              );
            })}
          </article>
        </div>

        {/* Footer Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 bg-slate-50/70 px-6 py-3.5">
          <span className="text-xs text-slate-500">
            CivilEdge Academic Compendium · Indexed for Offline Revision
          </span>
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 shadow-xs transition-colors cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
              {copied ? 'Copied Notes' : 'Copy Notes'}
            </button>
            <button
              type="button"
              onClick={handleDownload}
              className="inline-flex items-center gap-1.5 rounded-xl bg-amber-500 px-3.5 py-1.5 text-xs font-bold text-slate-950 hover:bg-amber-400 shadow-xs transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              Download {isImage ? 'Infographic Image' : 'Academic Brief'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
