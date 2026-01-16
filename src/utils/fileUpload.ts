import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';
import config from '../config';
import { ApiError } from './ApiError';
import type { UploadedFile } from '../types/file/file.types';

const supabase = createClient(
  config.SUPABASE_URL!,
  config.SUPABASE_SERVICE_KEY!
);

const BUCKET_NAME = 'profile-images';

/**
 * Ensure bucket exists, create if not
 */
async function ensureBucketExists(): Promise<void> {
  const { data: buckets } = await supabase.storage.listBuckets();
  const bucketExists = buckets?.some(b => b.name === BUCKET_NAME);

  if (!bucketExists) {
    await supabase.storage.createBucket(BUCKET_NAME, {
      public: true,
      fileSizeLimit: 5242880, // 5MB
    });
  }
}

/**
 * Upload file to Supabase Storage
 * Creates user-specific folder: userId/filename.ext
 */
export async function uploadToSupabase(
  file: UploadedFile,
  userId: string
): Promise<string> {
  try {
    await ensureBucketExists();

    const fileExtension = file.originalname.split('.').pop();
    const fileName = `${uuidv4()}.${fileExtension}`;
    const filePath = `${userId}/${fileName}`; // User-specific folder

    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, file.buffer, {
        contentType: file.mimetype,
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      throw new ApiError(500, `Upload failed: ${error.message}`);
    }

    const { data: publicUrlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(filePath);

    return publicUrlData.publicUrl;
  } catch (error: any) {
    throw new ApiError(500, `File upload error: ${error.message}`);
  }
}

/**
 * Delete file from Supabase Storage
 */
export async function deleteFromSupabase(
  fileUrl: string,
  userId: string
): Promise<void> {
  try {
    const fileName = fileUrl.split('/').pop();
    if (!fileName) return;

    const filePath = `${userId}/${fileName}`;

    await supabase.storage
      .from(BUCKET_NAME)
      .remove([filePath]);
  } catch (error: any) {
    console.error('Delete file error:', error);
  }
}