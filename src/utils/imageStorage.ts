import { supabase } from '../lib/supabase';

export interface FileUploadResult {
  success: boolean;
  url?: string;
  path?: string;
  error?: string;
}

export interface FileAttachment {
  id: string;
  file_name: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  uploaded_by: string;
  entity_type: 'client' | 'user' | 'task' | 'interaction' | 'meeting_note';
  entity_id: string;
  created_at: string;
  updated_at: string;
}

/**
 * Upload a file to Supabase Storage
 */
export async function uploadFile(
  file: File,
  bucket: string = 'attachments',
  folder?: string
): Promise<FileUploadResult> {
  try {
    // Generate unique filename
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = folder ? `${folder}/${fileName}` : fileName;

    // Upload file to Supabase Storage
    const { error } = await supabase.storage
      .from(bucket)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('Upload error:', error);
      return { success: false, error: error.message };
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath);

    return {
      success: true,
      url: publicUrl,
      path: filePath
    };
  } catch (error) {
    console.error('Upload error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Upload failed'
    };
  }
}

/**
 * Upload profile image for user or client
 */
export async function uploadProfileImage(
  file: File,
  entityType: 'user' | 'client',
  _entityId: string // Prefixed with underscore to indicate intentionally unused
): Promise<FileUploadResult> {
  // _entityId parameter available for future use
  const folder = `profiles/${entityType}s`;
  return uploadFile(file, 'attachments', folder);
}

/**
 * Save file attachment metadata to database
 */
export async function saveFileAttachment(
  fileName: string,
  filePath: string,
  fileSize: number,
  mimeType: string,
  entityType: 'client' | 'user' | 'task' | 'interaction' | 'meeting_note',
  entityId: string
): Promise<{ success: boolean; data?: FileAttachment; error?: string }> {
  try {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) {
      return { success: false, error: 'User not authenticated' };
    }

    const { data, error } = await supabase
      .from('file_attachments')
      .insert({
        file_name: fileName,
        file_path: filePath,
        file_size: fileSize,
        mime_type: mimeType,
        uploaded_by: user.user.id,
        entity_type: entityType,
        entity_id: entityId
      })
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Save attachment error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to save attachment'
    };
  }
}

/**
 * Get file attachments for an entity
 */
export async function getFileAttachments(
  entityType: string,
  entityId: string
): Promise<{ success: boolean; data?: FileAttachment[]; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('file_attachments')
      .select('*')
      .eq('entity_type', entityType)
      .eq('entity_id', entityId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Get attachments error:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data: data || [] };
  } catch (error) {
    console.error('Get attachments error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get attachments'
    };
  }
}

/**
 * Delete file attachment
 */
export async function deleteFileAttachment(
  attachmentId: string,
  filePath: string,
  bucket: string = 'attachments'
): Promise<{ success: boolean; error?: string }> {
  try {
    // Delete from storage
    const { error: storageError } = await supabase.storage
      .from(bucket)
      .remove([filePath]);

    if (storageError) {
      console.error('Storage delete error:', storageError);
    }

    // Delete from database
    const { error: dbError } = await supabase
      .from('file_attachments')
      .delete()
      .eq('id', attachmentId);

    if (dbError) {
      console.error('Database delete error:', dbError);
      return { success: false, error: dbError.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Delete attachment error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete attachment'
    };
  }
}

/**
 * Update profile image URL in user or client table
 */
export async function updateProfileImageUrl(
  entityType: 'user' | 'client',
  entityId: string,
  imageUrl: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const tableName = entityType === 'user' ? 'users' : 'clients';
    
    const { error } = await supabase
      .from(tableName)
      .update({ profile_image_url: imageUrl })
      .eq('id', entityId);

    if (error) {
      console.error('Update profile image error:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Update profile image error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update profile image'
    };
  }
}

/**
 * Validate file type and size
 */
export function validateFile(
  file: File,
  allowedTypes: string[] = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  maxSize: number = 5 * 1024 * 1024 // 5MB
): { valid: boolean; error?: string } {
  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `File type not allowed. Allowed types: ${allowedTypes.join(', ')}`
    };
  }

  if (file.size > maxSize) {
    return {
      valid: false,
      error: `File size too large. Maximum size: ${Math.round(maxSize / 1024 / 1024)}MB`
    };
  }

  return { valid: true };
}

/**
 * Create storage bucket if it doesn't exist
 */
export async function ensureStorageBucket(
  bucketName: string = 'attachments'
): Promise<{ success: boolean; error?: string }> {
  try {
    // Check if bucket exists
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error('List buckets error:', listError);
      return { success: false, error: listError.message };
    }

    const bucketExists = buckets?.some(bucket => bucket.name === bucketName);
    
    if (!bucketExists) {
      // Create bucket
      const { error: createError } = await supabase.storage.createBucket(bucketName, {
        public: true,
        allowedMimeTypes: ['image/*', 'application/pdf', 'text/*'],
        fileSizeLimit: 10 * 1024 * 1024 // 10MB
      });

      if (createError) {
        console.error('Create bucket error:', createError);
        return { success: false, error: createError.message };
      }
    }

    return { success: true };
  } catch (error) {
    console.error('Ensure bucket error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to ensure bucket exists'
    };
  }
}