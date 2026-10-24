import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { istInputToIso, isoToIstInput } from '../lib/format';
import {
  BROADCAST_SOURCES,
  BROADCAST_STATUSES,
  GS_BADGES,
  type BroadcastClass,
  type BroadcastSource,
  type BroadcastStatus,
  type GSBadge,
} from '../types';

interface ClassDetailsEditorModalProps {
  broadcast: BroadcastClass | null;
  onClose: () => void;
  onSave: (id: string, patch: Partial<BroadcastClass>) => Promise<void>;
}

export function ClassDetailsEditorModal({ broadcast, onClose, onSave }: ClassDetailsEditorModalProps) {
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState<GSBadge>('GS-2');
  const [faculty, setFaculty] = useState('');
  const [source, setSource] = useState<BroadcastSource>('custom');
  const [streamUrl, setStreamUrl] = useState('');
  const [scheduledIst, setScheduledIst] = useState('');
  const [durationMinutes, setDurationMinutes] = useState(90);
  const [status, setStatus] = useState<BroadcastStatus>('live');
  const [description, setDescription] = useState('');
  const [topicsText, setTopicsText] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!broadcast) return;
    setTitle(broadcast.title);
    setSubject(broadcast.subject);
    setFaculty(broadcast.faculty);
    setSource(broadcast.source);
    setStreamUrl(broadcast.streamUrl);
    setScheduledIst(isoToIstInput(broadcast.scheduledAt));
    setDurationMinutes(broadcast.durationMinutes);
    setStatus(broadcast.status);
    setDescription(broadcast.description ?? '');
    setTopicsText(broadcast.topicsCovered.join('\n'));
  }, [broadcast]);

  if (!broadcast) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await onSave(broadcast.id, {
        title: title.trim(),
        subject,
        faculty: faculty.trim(),
        source,
        streamUrl: streamUrl.trim(),
        scheduledAt: istInputToIso(scheduledIst),
        durationMinutes,
        status,
        description: description.trim() || undefined,
        topicsCovered: topicsText
          .split('\n')
          .map((t) => t.trim())
          .filter(Boolean),
      });
      onClose();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Edit Seminar Details"
      className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4"
    >
      <div className="w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-3xl border border-slate-200 bg-white p-6 space-y-4 shadow-2xl text-slate-900">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <h2 className="font-serif text-lg font-semibold text-slate-900">Edit Seminar Metadata</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Title</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-amber-500 focus:bg-white focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-medium text-slate-700 mb-1">Paper</label>
              <select
                value={subject}
                onChange={(e) => setSubject(e.target.value as GSBadge)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2 text-slate-900 focus:border-amber-500 focus:bg-white focus:outline-none cursor-pointer"
              >
                {GS_BADGES.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-medium text-slate-700 mb-1">Source</label>
              <select
                value={source}
                onChange={(e) => setSource(e.target.value as BroadcastSource)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2 text-slate-900 focus:border-amber-500 focus:bg-white focus:outline-none cursor-pointer"
              >
                {BROADCAST_SOURCES.map((s) => (
                  <option key={s} value={s}>
                    {s.toUpperCase()}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-medium text-slate-700 mb-1">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as BroadcastStatus)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2 text-slate-900 focus:border-amber-500 focus:bg-white focus:outline-none cursor-pointer"
              >
                {BROADCAST_STATUSES.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-slate-700 mb-1">Faculty</label>
              <input
                type="text"
                required
                value={faculty}
                onChange={(e) => setFaculty(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2 text-slate-900 focus:border-amber-500 focus:bg-white focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-medium text-slate-700 mb-1">Scheduled (IST)</label>
              <input
                type="datetime-local"
                required
                value={scheduledIst}
                onChange={(e) => setScheduledIst(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2 text-slate-900 focus:border-amber-500 focus:bg-white focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className="block font-medium text-slate-700 mb-1">Stream URL</label>
              <input
                type="url"
                required
                value={streamUrl}
                onChange={(e) => setStreamUrl(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2 text-slate-900 focus:border-amber-500 focus:bg-white focus:outline-none font-mono text-xs"
              />
            </div>
            <div>
              <label className="block font-medium text-slate-700 mb-1">Duration (m)</label>
              <input
                type="number"
                min={15}
                max={360}
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(Number(e.target.value))}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2 text-slate-900 focus:border-amber-500 focus:bg-white focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">Synopsis</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2 text-slate-900 focus:border-amber-500 focus:bg-white focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">Board Modules (one per line)</label>
            <textarea
              rows={3}
              value={topicsText}
              onChange={(e) => setTopicsText(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2 text-slate-900 focus:border-amber-500 focus:bg-white focus:outline-none font-mono text-xs"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={busy}
              className="rounded-xl bg-amber-500 px-4 py-2 text-xs font-semibold text-slate-950 hover:bg-amber-400 disabled:opacity-50 cursor-pointer shadow-xs"
            >
              {busy ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
