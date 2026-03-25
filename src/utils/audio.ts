/**
 * Converts a Float32Array of audio data to a base64-encoded 16-bit PCM string.
 * @param data The Float32Array from an AudioBuffer.
 * @returns A base64 string representing the PCM data.
 */
export function float32ArrayToPcm16Base64(data: Float32Array): string {
  const pcm16 = new Int16Array(data.length);
  for (let i = 0; i < data.length; i++) {
    const s = Math.max(-1, Math.min(1, data[i]));
    pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
  }

  let binary = '';
  const bytes = new Uint8Array(pcm16.buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Decodes a base64 string into an ArrayBuffer.
 * @param base64 The base64 string to decode.
 * @returns The decoded ArrayBuffer.
 */
export function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}