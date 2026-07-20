import { File } from 'expo-file-system';
import { documentDirectory } from 'expo-file-system/legacy';

type DeepFilterModelDefinition = {
  fileName: string;
  url: string;
};

const DEEPFILTER_MODEL: DeepFilterModelDefinition = {
  fileName: 'denoiser_model.ort',
  url: 'https://raw.githubusercontent.com/sayampy/deepdenoiser/master/assets/model/denoiser_model.ort',
};

let resolveModelPromise: Promise<string | null> | null = null;

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

async function downloadModel(model: DeepFilterModelDefinition): Promise<string | null> {
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
    console.info(`[DeepFilter] Downloading model ${model.fileName}...`);
    const response = await fetch(model.url);

    if (!response.ok) {
      console.warn(
        `[DeepFilter] Could not download model ${model.fileName}: HTTP ${response.status}`,
      );
      return null;
    }

    const bytes = new Uint8Array(await response.arrayBuffer());
    modelFile.create({ overwrite: true });
    modelFile.write(bytes);
    console.info(`[DeepFilter] Cached model ${model.fileName}.`);

    return cachePath;
  } catch (error) {
    console.warn(`[DeepFilter] Could not download model ${model.fileName}.`, error);
    return null;
  }
}

async function ensureDeepFilterModelCached(): Promise<string | null> {
  return downloadModel(DEEPFILTER_MODEL);
}

export async function resolveDeepFilterModelPath(): Promise<string | null> {
  if (!resolveModelPromise) {
    resolveModelPromise = ensureDeepFilterModelCached();
  }

  return resolveModelPromise;
}
