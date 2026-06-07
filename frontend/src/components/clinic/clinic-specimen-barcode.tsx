'use client';

import { useEffect, useRef, useState } from 'react';
import bwipjs from 'bwip-js/browser';
import { CLINIC_SPECIMEN_BARCODE_OPTIONS } from '@/lib/clinic-specimen-label';

interface ClinicSpecimenBarcodeProps {
  value: string;
  className?: string;
}

export function ClinicSpecimenBarcode({ value, className }: ClinicSpecimenBarcodeProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !value.trim()) return;

    queueMicrotask(() => setError(null));
    try {
      bwipjs.toCanvas(canvas, {
        ...CLINIC_SPECIMEN_BARCODE_OPTIONS,
        text: value.trim(),
      });
    } catch (err) {
      queueMicrotask(() =>
        setError(err instanceof Error ? err.message : 'Barcode render failed'),
      );
    }
  }, [value]);

  if (!value.trim()) return null;

  return (
    <div className={className}>
      <canvas ref={canvasRef} aria-label={value} role="img" />
      {error ? <p className="text-xs text-red-400 mt-1">{error}</p> : null}
    </div>
  );
}
