import modelMetadata from '@/assets/model/deepfilter-model-metadata.json';

type TensorMeta = {
  name: string;
  shape: number[];
  type: string;
};

type DeepFilterModelMetadata = {
  inputs: TensorMeta[];
  outputs: TensorMeta[];
  hop_size: number;
  fft_size: number;
  frame_size: number;
  state_input_names: string[];
};

type OrtTensor = import('onnxruntime-react-native').Tensor;
type OrtInferenceSession = import('onnxruntime-react-native').InferenceSession;
type OrtSessionRunResults = import('onnxruntime-react-native').InferenceSession.ReturnType;
type OrtModule = typeof import('onnxruntime-react-native');

const metadata = modelMetadata as DeepFilterModelMetadata;

let ortModulePromise: Promise<OrtModule> | null = null;

async function getOrtModule(): Promise<OrtModule> {
  if (!ortModulePromise) {
    ortModulePromise = import('onnxruntime-react-native');
  }

  return ortModulePromise;
}

type StreamState = {
  states: OrtTensor | OrtTensor[];
  inputFrameData: Float32Array;
  inputFrame: OrtTensor;
  paddedAudio: Float32Array;
  enhancedAudio: Float32Array;
};

export class DeepFilterNet {
  private session: OrtInferenceSession | null = null;
  private readonly hopSize = metadata.hop_size;
  private readonly fftSize = metadata.fft_size;
  private readonly inputNames = metadata.inputs.map((input) => input.name);
  private readonly outputNames = metadata.outputs.map((output) => output.name);
  private readonly stateInputNames = this.inputNames.filter((name) => name !== 'input_frame');
  private readonly hasSingleStateTensor = this.stateInputNames.includes('states');
  private readonly statesShape: number[];
  private readonly statesLen: number;

  constructor() {
    if (this.hasSingleStateTensor) {
      const statesMeta = metadata.inputs.find((input) => input.name === 'states');
      if (!statesMeta) {
        throw new Error("Metadata for 'states' input not found.");
      }
      this.statesShape = statesMeta.shape;
      this.statesLen = this.statesShape.reduce((accumulator, value) => accumulator * value, 1);
      return;
    }

    this.statesShape = [];
    this.statesLen = 0;
  }

  async loadModel(modelPath: string): Promise<void> {
    const { InferenceSession } = await getOrtModule();
    this.session = await InferenceSession.create(modelPath, {
      executionProviders: ['cpu'],
      graphOptimizationLevel: 'all',
      interOpNumThreads: 1,
      intraOpNumThreads: 2,
    });
  }

  async release(): Promise<void> {
    if (!this.session) {
      return;
    }

    await this.session.release();
    this.session = null;
  }

  async denoise(
    audio: Float32Array,
    onProgress?: (progress: number) => void,
  ): Promise<Float32Array> {
    if (!this.session) {
      throw new Error('DeepFilterNet model is not loaded.');
    }

    const originalLength = audio.length;
    const hopPadding = (this.hopSize - (originalLength % this.hopSize)) % this.hopSize;
    const totalPadding = this.fftSize + hopPadding;
    const paddedLength = originalLength + totalPadding;
    const numSteps = Math.ceil(paddedLength / this.hopSize);
    const streamState = await this.createStreamState(paddedLength, numSteps);

    streamState.paddedAudio.set(audio, this.fftSize);

    let lastReportedProgress = -1;

    for (let step = 0; step < numSteps; step += 1) {
      const start = step * this.hopSize;
      streamState.inputFrameData.set(
        streamState.paddedAudio.subarray(start, start + this.hopSize),
      );

      const results = await this.session.run(this.buildFeeds(streamState));
      const enhancedFrame = results[this.outputNames[0]].data as Float32Array;

      streamState.enhancedAudio.set(enhancedFrame, start);
      streamState.states = await this.readNextStates(streamState.states, results);

      if (onProgress) {
        const progress = Math.round(((step + 1) / numSteps) * 100);
        if (progress > lastReportedProgress) {
          onProgress(progress);
          lastReportedProgress = progress;
        }
      }
    }

    return streamState.enhancedAudio.slice(this.fftSize, originalLength + this.fftSize);
  }

  private async createStreamState(paddedLength: number, numSteps: number): Promise<StreamState> {
    const { Tensor } = await getOrtModule();
    const states = await this.createInitialStates(Tensor);
    const inputFrameData = new Float32Array(this.hopSize);
    const inputFrame = new Tensor('float32', inputFrameData, [this.hopSize]);

    return {
      states,
      inputFrameData,
      inputFrame,
      paddedAudio: new Float32Array(paddedLength),
      enhancedAudio: new Float32Array(numSteps * this.hopSize),
    };
  }

  private async createInitialStates(
    Tensor: OrtModule['Tensor'],
  ): Promise<OrtTensor | OrtTensor[]> {
    if (this.hasSingleStateTensor) {
      return new Tensor('float32', new Float32Array(this.statesLen), this.statesShape);
    }

    const stateInputs = metadata.inputs.filter((input) =>
      this.stateInputNames.includes(input.name),
    );

    return stateInputs.map((input) => {
      const size = input.shape.reduce((accumulator, value) => accumulator * value, 1);
      return new Tensor('float32', new Float32Array(size), input.shape);
    });
  }

  private buildFeeds(streamState: StreamState): Record<string, OrtTensor> {
    const feeds: Record<string, OrtTensor> = {
      input_frame: streamState.inputFrame,
    };

    if (this.hasSingleStateTensor) {
      feeds.states = streamState.states as OrtTensor;
      return feeds;
    }

    const stateTensors = streamState.states as OrtTensor[];
    for (let index = 0; index < stateTensors.length; index += 1) {
      feeds[this.stateInputNames[index]] = stateTensors[index];
    }

    return feeds;
  }

  private async readNextStates(
    currentStates: OrtTensor | OrtTensor[],
    results: OrtSessionRunResults,
  ): Promise<OrtTensor | OrtTensor[]> {
    const { Tensor } = await getOrtModule();

    if (this.hasSingleStateTensor) {
      const nextState = results[this.outputNames[1]].data as Float32Array;
      return new Tensor('float32', nextState, this.statesShape);
    }

    const stateTensors = currentStates as OrtTensor[];
    const nextStates: OrtTensor[] = [];

    for (let index = 0; index < this.stateInputNames.length; index += 1) {
      const nextState = results[this.outputNames[index + 1]].data as Float32Array;
      nextStates.push(new Tensor('float32', nextState, stateTensors[index].dims));
    }

    return nextStates;
  }
}
