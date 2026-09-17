/**
 * Write the workspace to a file the person chooses.
 *
 * This is the only path by which data leaves the application, and it goes to the local disk. There
 * is no upload, no share link and no account: an object URL is created from text already held in
 * this window, handed to the browser, and revoked immediately afterwards.
 */

export function exportWorkspaceFile(json: string, name = 'metrika-workspace.json'): void {
  if (typeof document === 'undefined' || typeof URL.createObjectURL !== 'function') return;

  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  try {
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = name;
    anchor.rel = 'noopener';
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
  } finally {
    URL.revokeObjectURL(url);
  }
}
