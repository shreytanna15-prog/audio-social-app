export function toFfmpegPath(uri: string): string {
  if (uri.startsWith('file://')) {
    return decodeURIComponent(uri.slice('file://'.length));
  }

  return uri;
}

/** Escape filesystem paths used inside FFmpeg filter expressions. */
export function escapeFfmpegFilterPath(path: string): string {
  return toFfmpegPath(path).replace(/\\/g, '/').replace(/:/g, '\\:');
}

export function toFileUri(path: string): string {
  if (path.startsWith('file://')) {
    return path;
  }

  return `file://${path}`;
}
