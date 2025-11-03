import React, { useState, useEffect } from 'react';
import { Paperclip, Download, Trash2, File, Image as ImageIcon, FileText, AlertCircle } from 'lucide-react';
import { getFileAttachments, deleteFileAttachment, FileAttachment } from '../../utils/imageStorage';
import { formatDistanceToNow } from 'date-fns';
import { supabase } from '../../lib/supabase';
import ConfirmationModal from './ConfirmationModal';

interface FileAttachmentsProps {
  entityType: 'client' | 'user' | 'task' | 'interaction' | 'meeting_note';
  entityId: string;
  onAttachmentDeleted?: () => void;
  className?: string;
}

function getFileIcon(mimeType: string) {
  if (mimeType.startsWith('image/')) {
    return <ImageIcon className="w-4 h-4" />;
  }
  if (mimeType.includes('pdf') || mimeType.includes('document') || mimeType.includes('text')) {
    return <FileText className="w-4 h-4" />;
  }
  return <File className="w-4 h-4" />;
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export default function FileAttachments({
  entityType,
  entityId,
  onAttachmentDeleted,
  className = ''
}: FileAttachmentsProps) {
  const [attachments, setAttachments] = useState<FileAttachment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [attachmentToDelete, setAttachmentToDelete] = useState<FileAttachment | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const loadAttachments = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await getFileAttachments(entityType, entityId);
      if (result.success && result.data) {
        setAttachments(result.data);
      } else {
        setError(result.error || 'Failed to load attachments');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load attachments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (entityId) {
      loadAttachments();
    }
  }, [entityType, entityId]);

  const handleDeleteClick = (attachment: FileAttachment) => {
    setAttachmentToDelete(attachment);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!attachmentToDelete) return;

    setDeleteLoading(true);
    setDeletingId(attachmentToDelete.id);
    
    try {
      const result = await deleteFileAttachment(attachmentToDelete.id, attachmentToDelete.file_path);
      if (result.success) {
        setAttachments(prev => prev.filter(a => a.id !== attachmentToDelete.id));
        onAttachmentDeleted?.();
        setShowDeleteModal(false);
        setAttachmentToDelete(null);
      } else {
        setError(result.error || 'Failed to delete attachment');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete attachment');
    } finally {
      setDeletingId(null);
      setDeleteLoading(false);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteModal(false);
    setAttachmentToDelete(null);
  };

  const handleDownload = async (attachment: FileAttachment) => {
    try {
      const { data } = supabase.storage
        .from('attachments')
        .getPublicUrl(attachment.file_path);
      
      // Create a temporary link to download the file
      const link = document.createElement('a');
      link.href = data.publicUrl;
      link.download = attachment.file_name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Failed to download file:', err);
      setError('Failed to download file');
    }
  };

  if (loading) {
    return (
      <div className={`space-compact ${className}`}>
        <div className="flex items-center space-x-compact text-sm text-gray-500">
          <Paperclip className="w-4 h-4" />
          <span>Loading attachments...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`space-compact ${className}`}>
        <div className="flex items-center space-x-compact text-sm text-red-600">
          <AlertCircle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      </div>
    );
  }

  if (attachments.length === 0) {
    return (
      <div className={`space-compact ${className}`}>
        <div className="flex items-center space-x-compact text-sm text-gray-500">
          <Paperclip className="w-4 h-4" />
          <span>No attachments</span>
        </div>
      </div>
    );
  }

  return (
      <div className={`space-compact ${className}`}>
      <div className="flex items-center space-x-compact text-sm font-medium text-gray-700">
        <Paperclip className="w-4 h-4" />
        <span>Attachments ({attachments.length})</span>
      </div>
      
      <div className="space-compact">
        {attachments.map((attachment) => (
          <div
            key={attachment.id}
            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border-standard"
          >
            <div className="flex items-center space-x-compact flex-1 min-w-0">
              <div className="flex-shrink-0 text-gray-500">
                {getFileIcon(attachment.mime_type)}
              </div>
              
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {attachment.file_name}
                </p>
                <div className="flex items-center space-x-compact text-xs text-gray-500">
                  <span>{formatFileSize(attachment.file_size)}</span>
                  <span>•</span>
                  <span>
                    {formatDistanceToNow(new Date(attachment.created_at), { addSuffix: true })}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-compact">
              <button
                onClick={() => handleDownload(attachment)}
                className="p-1 text-gray-500 hover:text-primary-600 transition-colors"
                title="Download"
              >
                <Download className="w-4 h-4" />
              </button>
              
              <button
                onClick={() => handleDeleteClick(attachment)}
                disabled={deletingId === attachment.id}
                className="p-1 text-gray-500 hover:text-red-600 transition-colors disabled:opacity-50"
                title="Delete"
              >
                {deletingId === attachment.id ? (
                  <div className="w-4 h-4 animate-spin rounded-full border-2 border-gray-300 border-t-red-600" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        title="Delete Attachment"
        message={`Are you sure you want to delete "${attachmentToDelete?.file_name}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
        loading={deleteLoading}
      />
    </div>
  );
}