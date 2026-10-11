import * as FileSystem from 'expo-file-system/legacy';

const WISHLIST_IMAGES_DIR = (FileSystem.documentDirectory || '') + 'wishlist_images/';

/**
 * Saves a picked temporary image URI into permanent document storage.
 * Returns a relative image path (e.g. 'wishlist_images/img_123.jpg') or the original URL if web-based.
 */
export async function saveImageToPermanentStorage(uri: string): Promise<string> {
  if (!uri) return uri;
  // If it's a web URL (http/https/data), return as-is
  if (uri.startsWith('http://') || uri.startsWith('https://') || uri.startsWith('data:')) {
    return uri;
  }
  try {
    // Ensure directory exists
    const dirInfo = await FileSystem.getInfoAsync(WISHLIST_IMAGES_DIR);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(WISHLIST_IMAGES_DIR, { intermediates: true });
    }

    // Generate unique filename
    const ext = uri.split('.').pop()?.split('?')[0] || 'jpg';
    const filename = `img_${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${ext}`;
    const targetPath = WISHLIST_IMAGES_DIR + filename;

    await FileSystem.copyAsync({
      from: uri,
      to: targetPath,
    });

    return `wishlist_images/${filename}`;
  } catch (error) {
    console.warn('Failed to save image locally:', error);
    return uri;
  }
}

/**
 * Resolves an image URL/path to a usable URI.
 * Handles web URLs, relative paths in app sandbox, and legacy file:// paths.
 */
export function resolveImageUrl(url?: string): string | undefined {
  if (!url) return undefined;
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
    return url;
  }
  // Relative filename stored in SQLite
  if (url.includes('wishlist_images/')) {
    const filename = url.split('wishlist_images/').pop();
    if (filename && FileSystem.documentDirectory) {
      return FileSystem.documentDirectory + 'wishlist_images/' + filename;
    }
  }
  // Fallback for legacy file:// paths
  if (url.startsWith('file://')) {
    const filename = url.split('/').pop();
    if (filename && FileSystem.documentDirectory) {
      return FileSystem.documentDirectory + 'wishlist_images/' + filename;
    }
  }
  return url;
}
