import { NextRequest, NextResponse } from 'next/server';
import { uploadToCloudinary } from '@/lib/cloudinary';

export interface UploadedFile {
  uuid: string;
  name: string;
  size: number;
  mimeType: string;
  cdnUrl: string;
  originalUrl: string;
}

export interface ProcessedFile extends UploadedFile {
  cloudinaryUrl?: string;
  cloudinaryPublicId?: string;
  textContent?: string;
  error?: string;
}

/**
 * POST /api/files/process
 * Processes uploaded files for chat attachments
 * Extracts text content and uploads images to Cloudinary
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { files }: { files: UploadedFile[] } = body;

    if (!files || !Array.isArray(files) || files.length === 0) {
      return NextResponse.json({ error: 'No files provided' }, { status: 400 });
    }

    const processedFiles: ProcessedFile[] = [];

    for (const file of files) {
      try {
        const processedFile: ProcessedFile = {
          ...file,
        };

        // Extract text content for different file types
        if (file.cdnUrl.startsWith('data:')) {
          // Handle data URLs
          const [header, base64Data] = file.cdnUrl.split(',');
          
          if (file.mimeType.startsWith('text/') || file.mimeType.includes('json')) {
            try {
              // Decode base64 text content
              const textContent = Buffer.from(base64Data, 'base64').toString('utf-8');
              processedFile.textContent = textContent;
            } catch (error) {
              console.error('Error extracting text content:', error);
              processedFile.textContent = `[Text file: ${file.name}]`;
            }
          } else if (file.mimeType.startsWith('image/')) {
            // For images, we'll pass the data URL directly to the AI
            processedFile.textContent = `[Image: ${file.name}]`;
            // Keep the data URL for image display
            processedFile.cloudinaryUrl = file.cdnUrl;
          } else if (file.mimeType === 'application/pdf') {
            // PDF text extraction would require additional libraries
            processedFile.textContent = `[PDF Document: ${file.name}]`;
          } else {
            processedFile.textContent = `[File: ${file.name} - ${file.mimeType}]`;
          }
        } else {
          // Handle regular URLs if needed
          try {
            // Upload to Cloudinary if it's a regular URL
            const cloudinaryResult = await uploadToCloudinary(file);
            processedFile.cloudinaryUrl = cloudinaryResult.secure_url;
            processedFile.cloudinaryPublicId = cloudinaryResult.public_id;
          } catch (error) {
            console.error('Cloudinary upload skipped:', error);
            processedFile.cloudinaryUrl = file.cdnUrl;
          }
          
          if (file.mimeType.startsWith('text/') || file.mimeType.includes('json')) {
            try {
              const response = await fetch(file.cdnUrl);
              const textContent = await response.text();
              processedFile.textContent = textContent;
            } catch (error) {
              console.error('Error extracting text content:', error);
              processedFile.error = 'Failed to extract text content';
            }
          } else if (file.mimeType.startsWith('image/')) {
            processedFile.textContent = `[Image: ${file.name}]`;
          } else if (file.mimeType === 'application/pdf') {
            processedFile.textContent = `[PDF Document: ${file.name}]`;
          } else {
            processedFile.textContent = `[File: ${file.name} - ${file.mimeType}]`;
          }
        }

        processedFiles.push(processedFile);
      } catch (error) {
        console.error(`Error processing file ${file.name}:`, error);
        processedFiles.push({
          ...file,
          error: 'Failed to process file',
        });
      }
    }

    return NextResponse.json({ processedFiles });
  } catch (error) {
    console.error('Error in file processing API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}