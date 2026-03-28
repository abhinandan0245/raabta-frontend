// src/components/ui/FileUpload.jsx
import React, { useRef, useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { Paperclip, X, Image, File, Video } from 'lucide-react';

const FileUpload = forwardRef(({ onFilesSelected, maxSize = 50 * 1024 * 1024 }, ref) => {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  // Expose clear method to parent component
  useImperativeHandle(ref, () => ({
    clearFiles: () => {
      // Clean up all preview URLs
      selectedFiles.forEach(file => {
        if (file.preview) {
          URL.revokeObjectURL(file.preview);
        }
      });
      setSelectedFiles([]);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }));

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    const validFiles = [];
    const errors = [];

    files.forEach(file => {
      // Check file size
      if (file.size > maxSize) {
        errors.push(`${file.name} is too large. Max size: ${maxSize / (1024 * 1024)}MB`);
        return;
      }

      // Determine file category
      let fileCategory = 'document';
      let preview = null;
      
      if (file.type.startsWith('image/')) {
        preview = URL.createObjectURL(file);
        fileCategory = 'image';
      } else if (file.type.startsWith('video/')) {
        fileCategory = 'video';
      } else if (file.type.startsWith('audio/')) {
        fileCategory = 'audio';
      } else if (file.type === 'application/pdf') {
        fileCategory = 'pdf';
      }

      validFiles.push({
        file,
        preview,
        type: fileCategory,
        name: file.name,
        size: file.size,
        mimeType: file.type
      });
    });

    if (errors.length > 0) {
      setError(errors.join(', '));
      setTimeout(() => setError(''), 5000);
    }

    if (validFiles.length > 0) {
      const newFiles = [...selectedFiles, ...validFiles];
      setSelectedFiles(newFiles);
      onFilesSelected(newFiles);
    }

    // Reset input
    e.target.value = '';
  };

  const removeFile = (index) => {
    const newFiles = selectedFiles.filter((_, i) => i !== index);
    
    // Clean up preview URLs
    if (selectedFiles[index].preview) {
      URL.revokeObjectURL(selectedFiles[index].preview);
    }
    
    setSelectedFiles(newFiles);
    onFilesSelected(newFiles);
  };

  const getFileIcon = (type) => {
    switch(type) {
      case 'image': return <Image size={20} className="text-green-500" />;
      case 'video': return <Video size={20} className="text-blue-500" />;
      case 'pdf': return <File size={20} className="text-red-500" />;
      case 'audio': return <File size={20} className="text-purple-500" />;
      default: return <File size={20} className="text-gray-500" />;
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="relative">
      <input
        ref={fileInputRef}
        type="file"
        multiple
        onChange={handleFileSelect}
        className="hidden"
        accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv"
      />

      {selectedFiles.length > 0 && (
        <div className="mb-2 p-2 bg-gray-50 rounded-lg border border-gray-200 max-h-40 overflow-y-auto">
          <div className="flex flex-wrap gap-2">
            {selectedFiles.map((file, index) => (
              <div key={index} className="relative group">
                {file.type === 'image' && file.preview ? (
                  <div className="relative">
                    <img 
                      src={file.preview} 
                      alt={file.name}
                      className="h-16 w-16 object-cover rounded-lg border border-gray-200"
                    />
                    <button
                      onClick={() => removeFile(index)}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                      title="Remove"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <div className="relative flex items-center gap-2 p-2 bg-white rounded-lg border border-gray-200 min-w-[180px]">
                    {getFileIcon(file.type)}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">{file.name}</p>
                      <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                    </div>
                    <button
                      onClick={() => removeFile(index)}
                      className="text-red-500 hover:text-red-700 p-1"
                      title="Remove"
                    >
                      <X size={16} />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {error && (
        <div className="mb-2 p-2 bg-red-50 text-red-600 text-sm rounded-lg border border-red-200">
          {error}
        </div>
      )}

      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
        title="Attach files (images, videos, documents)"
      >
        <Paperclip size={20} />
      </button>
    </div>
  );
});

FileUpload.displayName = 'FileUpload';
export default FileUpload;