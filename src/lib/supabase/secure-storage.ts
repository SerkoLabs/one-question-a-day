import * as SecureStore from 'expo-secure-store';

const CHUNK_SIZE = 1800;
const META_SUFFIX = '.__chunks';

function chunkKey(key: string, index: number) {
  return `${key}.__chunk.${index}`;
}

async function readChunkCount(key: string): Promise<number> {
  const raw = await SecureStore.getItemAsync(`${key}${META_SUFFIX}`);
  if (!raw) return 0;

  const parsed = Number(raw);
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : 0;
}

async function clearChunks(key: string, count?: number): Promise<void> {
  const total = count ?? (await readChunkCount(key));
  await Promise.all([
    ...Array.from({ length: total }, (_, index) =>
      SecureStore.deleteItemAsync(chunkKey(key, index)),
    ),
    SecureStore.deleteItemAsync(`${key}${META_SUFFIX}`),
  ]);
}

export const secureAuthStorage = {
  async getItem(key: string): Promise<string | null> {
    const count = await readChunkCount(key);
    if (count === 0) {
      return SecureStore.getItemAsync(key);
    }

    const chunks = await Promise.all(
      Array.from({ length: count }, (_, index) =>
        SecureStore.getItemAsync(chunkKey(key, index)),
      ),
    );

    if (chunks.some((chunk) => chunk == null)) {
      await clearChunks(key, count);
      return null;
    }

    return chunks.join('');
  },

  async setItem(key: string, value: string): Promise<void> {
    await SecureStore.deleteItemAsync(key);
    await clearChunks(key);

    if (value.length <= CHUNK_SIZE) {
      await SecureStore.setItemAsync(key, value);
      return;
    }

    const chunks = Array.from(
      { length: Math.ceil(value.length / CHUNK_SIZE) },
      (_, index) => value.slice(index * CHUNK_SIZE, (index + 1) * CHUNK_SIZE),
    );

    await Promise.all(
      chunks.map((chunk, index) =>
        SecureStore.setItemAsync(chunkKey(key, index), chunk),
      ),
    );
    await SecureStore.setItemAsync(`${key}${META_SUFFIX}`, String(chunks.length));
  },

  async removeItem(key: string): Promise<void> {
    await SecureStore.deleteItemAsync(key);
    await clearChunks(key);
  },
};
