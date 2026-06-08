export function buildCustomerDataExportFilename(slug: string): string {
  return `my-data-${slug}.json`;
}

export async function downloadCustomerDataExport(input: {
  slug: string;
  data: Record<string, unknown>;
  businessName: string;
}): Promise<'downloaded' | 'shared' | 'copied'> {
  const filename = buildCustomerDataExportFilename(input.slug);
  const json = JSON.stringify(input.data, null, 2);

  if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
    try {
      const file = new File([json], filename, { type: 'application/json' });
      if (typeof navigator.canShare === 'function' && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: `${input.businessName} — my data`,
          files: [file],
        });
        return 'shared';
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        throw error;
      }
    }
  }

  if (typeof document !== 'undefined') {
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(url);
    return 'downloaded';
  }

  if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(json);
    return 'copied';
  }

  throw new Error('Export is not supported on this device.');
}
