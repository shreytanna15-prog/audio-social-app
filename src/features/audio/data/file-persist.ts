import { File } from 'expo-file-system';

export async function readFileBytes(sourceUri: string): Promise<Uint8Array> {
  const source = new File(sourceUri);

  if (source.exists) {
    return source.bytes();
  }

  const response = await fetch(sourceUri);
  if (!response.ok) {
    throw new Error(`File is not accessible: ${sourceUri}`);
  }

  return new Uint8Array(await response.arrayBuffer());
}

export async function persistFile(
  sourceUri: string,
  destinationUri: string,
): Promise<void> {
  const destination = new File(destinationUri);
  const parent = destination.parentDirectory;

  if (!parent.exists) {
    parent.create({ intermediates: true });
  }

  const bytes = await readFileBytes(sourceUri);
  destination.create({ overwrite: true });
  destination.write(bytes);
}

export function fileExists(uri: string): boolean {
  return new File(uri).exists;
}
