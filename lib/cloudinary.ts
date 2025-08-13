import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * UploadedFile interface
 * Represents file metadata before Cloudinary upload
 */
export interface UploadedFile {
  uuid: string;
  name: string;
  size: number;
  mimeType: string;
  cdnUrl: string;
  originalUrl: string;
}

/**
 * CloudinaryUploadResult interface
 * Response structure from Cloudinary after successful upload
 */
export interface CloudinaryUploadResult {
  public_id: string;
  version: number;
  signature: string;
  width?: number;
  height?: number;
  format: string;
  resource_type: string;
  created_at: string;
  tags: string[];
  bytes: number;
  type: string;
  etag: string;
  placeholder: boolean;
  url: string;
  secure_url: string;
  access_mode: string;
}

/**
 * Uploads a file to Cloudinary cloud storage
 * @param file - File metadata to upload
 * @returns Cloudinary upload result with URLs and metadata
 */
export async function uploadToCloudinary(file: UploadedFile): Promise<CloudinaryUploadResult> {
  try {
    const result = await cloudinary.uploader.upload(file.cdnUrl, {
      public_id: `chat_files/${file.uuid}`,
      resource_type: 'auto',
      folder: 'chat_uploads',
      use_filename: true,
      unique_filename: true,
      overwrite: false,
      tags: ['chat', 'user_upload'],
    });

    return result;
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw new Error('Failed to upload file to Cloudinary');
  }
}

/**
 * Deletes a file from Cloudinary by public ID
 * @param publicId - Cloudinary public ID of the file to delete
 */
export async function deleteFromCloudinary(publicId: string): Promise<void> {
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    console.error('Cloudinary delete error:', error);
    throw new Error('Failed to delete file from Cloudinary');
  }
}

/**
 * Generates a Cloudinary URL with optional transformations
 * @param publicId - Cloudinary public ID
 * @param transformations - Optional image/video transformations
 */
export function getCloudinaryUrl(
  publicId: string,
  transformations?: Record<string, unknown>
): string {
  return cloudinary.url(publicId, {
    secure: true,
    ...transformations,
  });
}

/**
 * Generates URL for text extraction from files
 * @param publicId - Cloudinary public ID
 * @param resourceType - Type of resource (image, raw, etc.)
 */
export function extractTextFromFile(publicId: string, resourceType: string): string {
  if (resourceType === 'image') {
    return getCloudinaryUrl(publicId, {
      flags: 'attachment',
      format: 'txt'
    });
  }
  
  // For other file types, return the original URL
  return getCloudinaryUrl(publicId);
}

export default cloudinary;