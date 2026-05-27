'use client';

import { useRef, useState } from 'react';
import { Camera, Loader2, X } from 'lucide-react';
import { uploadBusinessLogo } from '@/lib/upload';

interface BusinessLogoFieldProps {
  businessId: string;
  businessName: string;
  logoUrl: string;
  onChange: (url: string) => void;
  disabled?: boolean;
}

export function BusinessLogoField({
  businessId,
  businessName,
  logoUrl,
  onChange,
  disabled,
}: BusinessLogoFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = async (file: File | null) => {
    if (!file || disabled) return;
    setError(null);
    setUploading(true);
    try {
      const url = await uploadBusinessLogo(businessId, file);
      onChange(url);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to upload logo');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <label className="label">Logo</label>
      <div className="flex items-center gap-4">
        <div className="relative w-20 h-20 rounded-2xl overflow-hidden bg-gray-800 shrink-0 border border-gray-700">
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logoUrl} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-violet-400 text-xl font-bold">
              {businessName.trim().slice(0, 2).toUpperCase() || '?'}
            </div>
          )}
          {uploading && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <Loader2 className="w-5 h-5 text-white animate-spin" />
            </div>
          )}
        </div>
        <div className="flex flex-col gap-2">
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="hidden"
            disabled={disabled || uploading}
            onChange={(e) => {
              void handleFile(e.target.files?.[0] ?? null);
              e.target.value = '';
            }}
          />
          <button
            type="button"
            disabled={disabled || uploading}
            onClick={() => inputRef.current?.click()}
            className="btn-secondary text-sm inline-flex items-center gap-2 w-fit"
          >
            <Camera className="w-4 h-4" />
            {uploading ? 'Uploading…' : 'Upload logo'}
          </button>
          {logoUrl && !disabled && (
            <button
              type="button"
              onClick={() => onChange('')}
              className="text-xs text-gray-400 hover:text-red-400 inline-flex items-center gap-1 w-fit"
            >
              <X className="w-3 h-3" />
              Remove logo
            </button>
          )}
        </div>
      </div>
      {error && <p className="text-xs text-red-400 mt-2">{error}</p>}
    </div>
  );
}
