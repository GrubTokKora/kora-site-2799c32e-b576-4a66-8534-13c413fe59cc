// This file contains helpers for processing audio for the voice agent.

// Converts a Blob from MediaRecorder to an AudioBuffer that can be processed.
export async function blobToAudioBuffer(blob: Blob, audioContext: AudioContext): Promise<AudioBuffer> {
  const arrayBuffer = await blob.arrayBuffer();
  // The browser's native decoder can handle various formats (like webm/opus)
  return await audioContext.decodeAudioData(arrayBuffer);
}

// Converts a raw float32 AudioBuffer to a 16-bit PCM little-endian byte array.
function audioBufferToPcm16(audioBuffer: AudioBuffer): Int16Array {
  const data = audioBuffer.getChannelData(0); // Get data from the first channel (mono)
  const pcm16 = new Int16Array(data.length);

  for (let i = 0; i < data.length; i++) {
    // Clamp the sample to the range [-1, 1]
    const s = Math.max(-1, Math.min(1, data[i]));
    // Convert to 16-bit integer
    // 0x8000 is -32768, 0x7FFF is 32767
    pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
  }

  return pcm16;
}

// Converts a 16-bit PCM Int16Array to a base64 string.
export function pcm16ToBase64(pcm16: Int16Array): string {
  // Create a Uint8Array view on the Int16Array's buffer
  const byteCharacters = new Uint8Array(pcm16.buffer);
  
  // Manually build the binary string
  let binary = '';
  for (let i = 0; i < byteCharacters.byteLength; i++) {
    binary += String.fromCharCode(byteCharacters[i]);
  }
  
  // Encode to base64
  return btoa(binary);
}

// Combined helper function to process a media recorder blob into the required format.
export async function processAudioBlob(blob: Blob, audioContext: AudioContext): Promise<string> {
  const audioBuffer = await blobToAudioBuffer(blob, audioContext);
  const pcm16 = audioBufferToPcm16(audioBuffer);
  return pcm16ToBase64(pcm16);
}