import { File } from 'expo-file-system';
import { documentDirectory } from 'expo-file-system/legacy';

type ArnndnModelDefinition = {
  fileName: string;
  url: string;
};

const ARNNDN_MODELS: ArnndnModelDefinition[] = [
  {
    fileName: 'std.rnnn',
    url: 'https://raw.githubusercontent.com/richardpl/arnndn-models/master/std.rnnn',
  },
  {
    fileName: 'bd.rnnn',
    url: 'https://raw.githubusercontent.com/richardpl/arnndn-models/master/bd.rnnn',
  },
];

let resolveModelsPromise: Promise<string[]> | null = null;

function getModelsDirectory(): string | null {
  if (!documentDirectory) {
    return null;
  }

  return `${documentDirectory}models/`;
}

function getModelCachePath(fileName: string): string | null {
  const modelsDirectory = getModelsDirectory();

  if (!modelsDirectory) {
    return null;
  }

  return `${modelsDirectory}${fileName}`;
}

async function downloadModel(model: ArnndnModelDefinition): Promise<string | null> {
  const cachePath = getModelCachePath(model.fileName);

  if (!cachePath) {
    return null;
  }

  const modelFile = new File(cachePath);

  if (modelFile.exists) {
    return cachePath;
  }

  const parent = modelFile.parentDirectory;

  if (!parent.exists) {
    parent.create({ intermediates: true });
  }

  try {
    const response = await fetch(model.url);

    if (!response.ok) {
      console.warn(`[Denoise] Could not download model ${model.fileName}: HTTP ${response.status}`);
      return null;
    }

    const bytes = new Uint8Array(await response.arrayBuffer());
    modelFile.create({ overwrite: true });
    modelFile.write(bytes);

    return cachePath;
  } catch (error) {
    console.warn(`[Denoise] Could not download model ${model.fileName}.`, error);
    return null;
  }
}

async function ensureArnndnModelsCached(): Promise<string[]> {
  const cachedPaths: string[] = [];

  for (const model of ARNNDN_MODELS) {
    const cachePath = await downloadModel(model);

    if (cachePath) {
      cachedPaths.push(cachePath);
    }
  }

  return cachedPaths;
}

export async function resolveArnndnModelPaths(): Promise<string[]> {
  if (!resolveModelsPromise) {
    resolveModelsPromise = ensureArnndnModelsCached();
  }

  return resolveModelsPromise;
}

export function getArnndnModelLabel(modelPath: string): string {
  const fileName = modelPath.split('/').pop() ?? modelPath;

  return fileName;
}
