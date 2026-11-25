import * as ImagePicker from 'expo-image-picker';

import { supabase } from './supabase';

export type ImageBucket = 'avatars' | 'post-images' | 'chat-images';

/** Must match the allowed MIME types configured on the storage buckets. */
const ALLOWED_TYPES: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

/** Must match file_size_limit configured on each bucket. */
const MAX_BYTES: Record<ImageBucket, number> = {
  avatars: 5 * 1024 * 1024,
  'post-images': 10 * 1024 * 1024,
  'chat-images': 10 * 1024 * 1024,
};

export class ImageUploadError extends Error {}

/**
 * Asks for photo library access and lets the user pick one image.
 * Returns null if the user cancels.
 * Throws ImageUploadError if access was denied.
 */
export async function pickImage(options?: {
  aspect?: [number, number];
}): Promise<ImagePicker.ImagePickerAsset | null> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

  if (!permission.granted) {
    throw new ImageUploadError(
      'Please allow Lingora to access your photo library in your device settings.'
    );
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect: options?.aspect,
    quality: 0.8,
  });

  if (result.canceled || result.assets.length === 0) return null;
  return result.assets[0];
}

/**
 * Uploads a picked image to Supabase Storage.
 *
 * `folder` must be the first path segment the bucket's RLS policy expects:
 * the user id for avatars/post-images, the conversation id for chat-images.
 */
export async function uploadImage({
  bucket,
  folder,
  asset,
  fileNamePrefix = 'image',
}: {
  bucket: ImageBucket;
  folder: string;
  asset: ImagePicker.ImagePickerAsset;
  fileNamePrefix?: string;
}): Promise<{ path: string; publicUrl: string }> {
  const mimeType = asset.mimeType ?? 'image/jpeg';
  const extension = ALLOWED_TYPES[mimeType];

  if (!extension) {
    throw new ImageUploadError('Please choose a JPG, PNG or WebP image.');
  }

  const maxBytes = MAX_BYTES[bucket];
  if (asset.fileSize && asset.fileSize > maxBytes) {
    throw new ImageUploadError(
      `This image is too large. The maximum is ${maxBytes / 1024 / 1024} MB.`
    );
  }

  const response = await fetch(asset.uri);
  if (!response.ok) {
    throw new ImageUploadError('The selected image could not be read.');
  }
  const body = await response.arrayBuffer();

  const uniqueId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const path = `${folder}/${fileNamePrefix}-${uniqueId}.${extension}`;

  const { error } = await supabase.storage.from(bucket).upload(path, body, {
    contentType: mimeType,
    upsert: false,
  });

  if (error) throw error;

  // chat-images is private; callers must use signed URLs for it instead.
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return { path, publicUrl: data.publicUrl };
}
