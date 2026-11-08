export class MediaService {
  /**
   * Convert any browser-decodable audio (WAV, MP3, OGG, AAC, FLAC, M4A) to standard 16-bit PCM WAV
   */
  public static async transcodeToWav(
    file: File | Blob,
    onProgress?: (progress: number, msg?: string) => void
  ): Promise<Blob> {
    onProgress?.(20, 'Decoding audio bitstream with Web Audio API...');
    const arrayBuffer = await file.arrayBuffer();
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();

    try {
      const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
      onProgress?.(60, 'Encoding to uncompressed 16-bit PCM WAV...');

      const wavBlob = this.audioBufferToWav(audioBuffer);
      onProgress?.(100, 'Audio rendered to WAV.');
      return wavBlob;
    } finally {
      await audioCtx.close();
    }
  }

  /**
   * Extract audio from video file (e.g. MP4, WebM, MOV, MKV, AVI -> WAV audio)
   */
  public static async extractAudioFromVideo(
    file: File | Blob,
    onProgress?: (progress: number, msg?: string) => void
  ): Promise<Blob> {
    onProgress?.(20, 'Demuxing video container and reading audio track...');
    const arrayBuffer = await file.arrayBuffer();
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();

    try {
      const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
      onProgress?.(70, 'Rendering extracted audio channels...');
      const wavBlob = this.audioBufferToWav(audioBuffer);
      onProgress?.(100, 'Audio extracted successfully.');
      return wavBlob;
    } finally {
      await audioCtx.close();
    }
  }

  /**
   * Extract video frame at specific timestamp as PNG
   */
  public static async extractVideoFrame(
    file: File | Blob,
    timeSeconds = 1.0,
    onProgress?: (progress: number, msg?: string) => void
  ): Promise<Blob> {
    onProgress?.(20, 'Loading video stream...');
    const url = URL.createObjectURL(file);

    try {
      const video = document.createElement('video');
      video.muted = true;
      video.playsInline = true;
      video.src = url;

      await new Promise<void>((resolve, reject) => {
        video.onloadedmetadata = () => resolve();
        video.onerror = () => reject(new Error('Failed to load video metadata'));
      });

      video.currentTime = Math.min(timeSeconds, video.duration || 1);
      await new Promise<void>((resolve) => {
        video.onseeked = () => resolve();
      });

      onProgress?.(70, 'Capturing frame snapshot on canvas...');
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 1280;
      canvas.height = video.videoHeight || 720;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Could not get canvas context');

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (b) => {
            if (b) resolve(b);
            else reject(new Error('Frame snapshot failed'));
          },
          'image/png',
          0.95
        );
      });

      onProgress?.(100, 'Video frame captured.');
      return blob;
    } finally {
      URL.revokeObjectURL(url);
    }
  }

  /**
   * Volume Booster - Boosts audio volume with soft limiter
   */
  public static async boostVolume(
    file: File | Blob,
    multiplier = 1.5,
    onProgress?: (progress: number, msg?: string) => void
  ): Promise<Blob> {
    onProgress?.(20, 'Decoding audio for volume boosting...');
    const arrayBuffer = await file.arrayBuffer();
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();

    try {
      const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
      onProgress?.(60, `Applying +${Math.round((multiplier - 1) * 100)}% gain boost...`);

      for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
        const data = audioBuffer.getChannelData(channel);
        for (let i = 0; i < data.length; i++) {
          data[i] = Math.tanh(data[i] * multiplier); // Soft limiter prevents harsh clipping
        }
      }

      onProgress?.(90, 'Re-encoding amplified audio...');
      const wavBlob = this.audioBufferToWav(audioBuffer);
      onProgress?.(100, 'Volume boost applied.');
      return wavBlob;
    } finally {
      await audioCtx.close();
    }
  }

  /**
   * Reverse Audio - Plays audio backwards
   */
  public static async reverseAudio(
    file: File | Blob,
    onProgress?: (progress: number, msg?: string) => void
  ): Promise<Blob> {
    onProgress?.(20, 'Decoding audio for reversal...');
    const arrayBuffer = await file.arrayBuffer();
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();

    try {
      const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
      onProgress?.(60, 'Reversing waveform channels...');

      for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
        audioBuffer.getChannelData(channel).reverse();
      }

      onProgress?.(90, 'Re-encoding reversed audio...');
      const wavBlob = this.audioBufferToWav(audioBuffer);
      onProgress?.(100, 'Audio reversed successfully.');
      return wavBlob;
    } finally {
      await audioCtx.close();
    }
  }

  /**
   * Convert an AudioBuffer into standard RIFF WAVE PCM Blob
   */
  public static audioBufferToWav(buffer: AudioBuffer): Blob {
    const numChannels = buffer.numberOfChannels;
    const sampleRate = buffer.sampleRate;
    const format = 1; // PCM
    const bitDepth = 16;

    let result: Float32Array;
    if (numChannels === 2) {
      result = this.interleave(buffer.getChannelData(0), buffer.getChannelData(1));
    } else {
      result = buffer.getChannelData(0);
    }

    const dataLength = result.length * (bitDepth / 8);
    const bufferLength = 44 + dataLength;
    const arrayBuffer = new ArrayBuffer(bufferLength);
    const view = new DataView(arrayBuffer);

    // RIFF chunk descriptor
    this.writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + dataLength, true);
    this.writeString(view, 8, 'WAVE');

    // fmt sub-chunk
    this.writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true); // Subchunk1Size
    view.setUint16(20, format, true); // AudioFormat
    view.setUint16(22, numChannels, true); // NumChannels
    view.setUint32(24, sampleRate, true); // SampleRate
    view.setUint32(28, sampleRate * numChannels * (bitDepth / 8), true); // ByteRate
    view.setUint16(32, numChannels * (bitDepth / 8), true); // BlockAlign
    view.setUint16(34, bitDepth, true); // BitsPerSample

    // data sub-chunk
    this.writeString(view, 36, 'data');
    view.setUint32(40, dataLength, true);

    // Write PCM samples
    let offset = 44;
    for (let i = 0; i < result.length; i++, offset += 2) {
      const s = Math.max(-1, Math.min(1, result[i]));
      view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
    }

    return new Blob([arrayBuffer], { type: 'audio/wav' });
  }

  private static interleave(inputL: Float32Array, inputR: Float32Array): Float32Array {
    const length = inputL.length + inputR.length;
    const result = new Float32Array(length);
    let index = 0;
    let inputIndex = 0;

    while (index < length) {
      result[index++] = inputL[inputIndex];
      result[index++] = inputR[inputIndex];
      inputIndex++;
    }
    return result;
  }

  private static writeString(view: DataView, offset: number, string: string) {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  }
}
