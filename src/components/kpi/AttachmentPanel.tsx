import React, { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Paperclip,
  Image,
  FileText,
  X,
  Upload,
  ExternalLink,
  Loader2,
} from 'lucide-react';
import { storage } from '@/shared/utils';

export interface Attachment {
  url: string;
  caption: string;
  originalName?: string;
  mimetype?: string;
}

interface Props {
  attachment: Attachment | null;
  onChange: (a: Attachment | null) => void;
  disabled?: boolean;
}

function isImage(a: Attachment) {
  const ext = a.url.split('.').pop()?.toLowerCase() ?? '';
  const mime = a.mimetype ?? '';
  return mime.startsWith('image/') || ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext);
}

export function AttachmentPanel({ attachment, onChange, disabled }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const handleFile = async (file: File) => {
    setError('');
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { Authorization: `Bearer ${storage.getAuthToken()}` },
        body: fd,
      });
      const d = await res.json();
      if (!d.success) throw new Error(d.message ?? 'Upload failed');
      onChange({ url: d.url, caption: attachment?.caption ?? '', originalName: d.originalName, mimetype: d.mimetype });
    } catch (e: any) {
      setError(e.message ?? 'Upload error');
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  };

  if (disabled) {
    if (!attachment) return <span className="text-xs text-gray-300">—</span>;
    return (
      <a
        href={attachment.url}
        target="_blank"
        rel="noreferrer"
        className="inline-flex items-center gap-1.5 text-xs text-blue-600 hover:underline">
        {isImage(attachment) ? (
          <Image className="w-3.5 h-3.5" />
        ) : (
          <FileText className="w-3.5 h-3.5" />
        )}
        {attachment.originalName ?? attachment.caption ?? 'View file'}
        <ExternalLink className="w-3 h-3 opacity-50" />
      </a>
    );
  }

  return (
    <div className="flex flex-col gap-1.5">
      {attachment ? (
        <div className="flex items-start gap-2 p-2 bg-gray-50 rounded-lg border border-gray-100">
          {/* Preview for image */}
          {isImage(attachment) && (
            <a href={attachment.url} target="_blank" rel="noreferrer" className="shrink-0">
              <img
                src={attachment.url}
                alt={attachment.caption}
                className="w-12 h-12 object-cover rounded-md border border-gray-200"
              />
            </a>
          )}
          {!isImage(attachment) && (
            <a href={attachment.url} target="_blank" rel="noreferrer" className="shrink-0">
              <div className="w-12 h-12 rounded-md border border-gray-200 bg-white flex items-center justify-center">
                <FileText className="w-5 h-5 text-blue-500" />
              </div>
            </a>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-gray-700 truncate">
              {attachment.originalName ?? 'Attached file'}
            </p>
            <Input
              className="h-6 text-xs mt-1 bg-white border-gray-200"
              value={attachment.caption}
              onChange={(e) => onChange({ ...attachment, caption: e.target.value })}
              placeholder="Caption (optional)"
            />
          </div>
          <button
            onClick={() => onChange(null)}
            className="shrink-0 text-gray-400 hover:text-red-500 transition-colors mt-0.5">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        <div
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          onClick={() => !uploading && fileRef.current?.click()}
          className="flex items-center gap-2 px-3 py-2 rounded-lg border border-dashed border-gray-200 bg-gray-50/60 hover:bg-gray-50 hover:border-gray-300 cursor-pointer transition-colors group">
          {uploading ? (
            <Loader2 className="w-3.5 h-3.5 text-gray-400 animate-spin" />
          ) : (
            <Paperclip className="w-3.5 h-3.5 text-gray-400 group-hover:text-gray-600" />
          )}
          <span className="text-xs text-gray-400 group-hover:text-gray-600">
            {uploading ? 'Uploading…' : 'Attach file / image'}
          </span>
        </div>
      )}
      {error && <p className="text-[10px] text-red-500">{error}</p>}
      <input
        ref={fileRef}
        type="file"
        className="hidden"
        accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
          e.target.value = '';
        }}
      />
    </div>
  );
}
