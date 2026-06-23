export function toFfmpegPath(uri: string): string {
  if (uri.startsWith('file://')) {
    return decodeURIComponent(uri.slice('file://'.length));
  }

  return uri;
}

export function toFileUri(path: string): string {
  if (path.startsWith('file://')) {
    return path;
  }

  return `file://${path}`;
}
