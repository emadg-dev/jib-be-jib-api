// Uses WebCrypto API available in Cloudflare Workers for secure hashing
export async function hashPassword(password: string, saltHex?: string): Promise<string> {
  const enc = new TextEncoder();
  const salt = saltHex
    ? new Uint8Array(hexToArrayBuffer(saltHex))
    : crypto.getRandomValues(new Uint8Array(4));

  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveBits', 'deriveKey']
  );

  const key = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );

  const exportedKey = await crypto.subtle.exportKey('raw', key);
  if (!(exportedKey instanceof ArrayBuffer)) {
    throw new Error('Expected raw ArrayBuffer from exportKey');
  }

  const hashHex = arrayBufferToHex(exportedKey);
  const usedSaltHex = arrayBufferToHex(salt);

  return `${hashHex}:${usedSaltHex}`;
}

export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  const [, saltHex] = storedHash.split(':');
  if (!saltHex) return false;
  const attemptHash = await hashPassword(password, saltHex);
  return attemptHash === storedHash;
}

function arrayBufferToHex(buffer: ArrayBuffer | ArrayBufferView): string {
  const bytes =
    buffer instanceof ArrayBuffer
      ? new Uint8Array(buffer)
      : new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength);

  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function hexToArrayBuffer(hex: string): ArrayBuffer {
  const view = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    view[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return view.buffer;
}
