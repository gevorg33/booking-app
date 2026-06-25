'use client';

import { useEffect, useRef, useState } from 'react';
import { Camera, Loader2, X } from 'lucide-react';
import { uploadEmployeeAvatar } from '@/lib/upload';
import { getErrorMessage } from '@/lib/error-message';
import { useI18n } from '@/i18n';

interface EmployeeAvatarFieldProps {
  businessId: string;
  name: string;
  avatarUrl: string;
  onChange: (url: string) => void;
  disabled?: boolean;
}

export function EmployeeAvatarField({
  businessId,
  name,
  avatarUrl,
  onChange,
  disabled,
}: EmployeeAvatarFieldProps) {
  const { t } = useI18n();
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    queueMicrotask(() => setPreview(null));
    queueMicrotask(() => setError(null));
  }, [avatarUrl]);

  const displayUrl = preview || avatarUrl || null;
  const initial = name.trim().charAt(0).toUpperCase() || '?';

  const handleFile = async (file: File | null) => {
    if (!file || disabled) return;
    setError(null);
    setPreview(URL.createObjectURL(file));
    setUploading(true);
    try {
      const url = await uploadEmployeeAvatar(businessId, file);
      onChange(url);
    } catch (err: unknown) {
      setPreview(null);
      setError(getErrorMessage(err, t('errors.uploadImageFailed')));
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <label className="label">{t('employees.profilePicture')}</label>
      <div className="flex items-center gap-4">
        <div className="relative w-20 h-20 rounded-full overflow-hidden bg-green-600/10 shrink-0">
          {displayUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={displayUrl} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-green-400 text-2xl font-semibold">
              {initial}
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
            {uploading ? t('employees.uploadingPhoto') : t('employees.uploadAvatar')}
          </button>
          {avatarUrl && !disabled && (
            <button
              type="button"
              onClick={() => onChange('')}
              className="text-xs text-gray-400 hover:text-red-400 inline-flex items-center gap-1 w-fit"
            >
              <X className="w-3 h-3" />
              {t('employees.removePhoto')}
            </button>
          )}
          <p className="text-[11px] text-gray-500">{t('employees.avatarFormatsHint')}</p>
        </div>
      </div>
      {error && <p className="text-xs text-red-400 mt-2">{error}</p>}
    </div>
  );
}
