import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface UploadedFile {
  id: string;
  fileName: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
}

/**
 * Upload files to Supabase Storage and save metadata to message_attachments table
 * @param files - Array of File objects to upload
 * @param messageId - ID of the message these files are attached to
 * @returns Array of uploaded file metadata
 */
export async function uploadMessageAttachments(
  files: File[],
  messageId: string
): Promise<UploadedFile[]> {
  const uploadedFiles: UploadedFile[] = [];
  const BUCKET_NAME = "message-attachments";

  for (const file of files) {
    try {
      // Generate unique file path
      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `${messageId}/${fileName}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) {
        console.error("Upload error:", uploadError);
        toast.error(`Failed to upload ${file.name}`);
        continue;
      }

      // Save metadata to message_attachments table
      const { data: attachment, error: dbError } = await supabase
        .from("message_attachments")
        .insert({
          message_id: messageId,
          file_name: file.name,
          file_path: filePath,
          file_size: file.size,
          mime_type: file.type,
        })
        .select()
        .single();

      if (dbError || !attachment) {
        console.error("Database error:", dbError);
        toast.error(`Failed to save ${file.name} metadata`);
        // Clean up uploaded file
        await supabase.storage.from(BUCKET_NAME).remove([filePath]);
        continue;
      }

      uploadedFiles.push({
        id: attachment.id,
        fileName: attachment.file_name,
        filePath: attachment.file_path,
        fileSize: attachment.file_size,
        mimeType: attachment.mime_type,
      });
    } catch (error) {
      console.error(`Error uploading ${file.name}:`, error);
      toast.error(`Failed to upload ${file.name}`);
    }
  }

  return uploadedFiles;
}

/**
 * Get public URL for an uploaded file
 * @param filePath - Path to the file in storage
 * @returns Public URL or null if error
 */
export function getFileUrl(filePath: string): string | null {
  const BUCKET_NAME = "message-attachments";
  
  const { data } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(filePath);

  return data?.publicUrl || null;
}

/**
 * Delete file from storage and database
 * @param attachmentId - ID of the attachment record
 * @param filePath - Path to the file in storage
 */
export async function deleteAttachment(
  attachmentId: string,
  filePath: string
): Promise<boolean> {
  const BUCKET_NAME = "message-attachments";

  // Delete from database
  const { error: dbError } = await supabase
    .from("message_attachments")
    .delete()
    .eq("id", attachmentId);

  if (dbError) {
    console.error("Database delete error:", dbError);
    return false;
  }

  // Delete from storage
  const { error: storageError } = await supabase.storage
    .from(BUCKET_NAME)
    .remove([filePath]);

  if (storageError) {
    console.error("Storage delete error:", storageError);
    return false;
  }

  return true;
}
