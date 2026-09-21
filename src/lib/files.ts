/** Open a file picker without JSX plumbing. Resolves null when cancelled. */
export function pickFile(accept?: string): Promise<File | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    if (accept) input.accept = accept;
    input.onchange = () => resolve(input.files?.[0] ?? null);
    // Cancel fires no change event; detect focus return with no selection.
    window.addEventListener('focus', () => setTimeout(() => resolve(input.files?.[0] ?? null), 300), { once: true });
    input.click();
  });
}

export function pickFiles(accept?: string): Promise<File[]> {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    if (accept) input.accept = accept;
    input.onchange = () => resolve(Array.from(input.files ?? []));
    window.addEventListener('focus', () => setTimeout(() => resolve(Array.from(input.files ?? [])), 300), { once: true });
    input.click();
  });
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function readFileAsText(file: File): Promise<string> {
  return file.text();
}

export function readFileAsBytes(file: File): Promise<Uint8Array> {
  return file.arrayBuffer().then((buffer) => new Uint8Array(buffer));
}
