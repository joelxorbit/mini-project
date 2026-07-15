import React, { useState, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import { useDropzone } from 'react-dropzone';
import { UploadCloud, X, File, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

const MAX_FILE_SIZE = 8 * 1024 * 1024; // 8MB Limit

export default function Upload() {
  const { currentUser } = useAuth();
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);

  const onDrop = useCallback((acceptedFiles) => {
    const newFiles = acceptedFiles.map(file => {
      if (file.size > MAX_FILE_SIZE) {
        toast.error(`File ${file.name} is too large. Max size is 8MB.`);
        return null;
      }
      return {
        file,
        id: Math.random().toString(36).substring(7),
        progress: 0,
        status: 'pending', // pending, uploading, success, error
      };
    }).filter(Boolean);
    
    setFiles(prev => [...prev, ...newFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

  const removeFile = (id) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  };

  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = error => reject(error);
    });
  };

  const handleUpload = async () => {
    if (files.length === 0) return;

    // Check storage limits
    const totalSize = files.reduce((acc, f) => acc + f.file.size, 0);
    if ((currentUser.storageUsed + totalSize) > currentUser.storageLimit) {
      toast.error('You have reached your free storage limit. Upgrade to Premium!');
      return;
    }

    setUploading(true);

    for (let i = 0; i < files.length; i++) {
      const fileObj = files[i];
      if (fileObj.status === 'success') continue;

      setFiles(prev => prev.map(f => f.id === fileObj.id ? { ...f, status: 'uploading', progress: 30 } : f));

      try {
        // 1. Convert to Base64
        const base64Data = await fileToBase64(fileObj.file);
        setFiles(prev => prev.map(f => f.id === fileObj.id ? { ...f, progress: 60 } : f));

        // 2. Upload file to SQLite backend
        await api.post('/files', {
          fileName: fileObj.file.name,
          fileType: fileObj.file.type,
          fileSize: fileObj.file.size,
          data: base64Data
        });

        setFiles(prev => prev.map(f => f.id === fileObj.id ? { ...f, status: 'success', progress: 100 } : f));
        toast.success(`${fileObj.file.name} uploaded!`);

      } catch (err) {
        console.error('Upload failed:', err);
        setFiles(prev => prev.map(f => f.id === fileObj.id ? { ...f, status: 'error' } : f));
        toast.error(`Failed to upload ${fileObj.file.name}`);
      }
    }

    setUploading(false);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Upload Files</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Upload images, documents, and videos (Max 8MB per file).</p>
      </div>

      <div 
        {...getRootProps()} 
        className={`glass rounded-2xl border-2 border-dashed p-12 text-center cursor-pointer transition-colors ${
          isDragActive ? 'border-primary bg-primary/5' : 'border-gray-300 dark:border-gray-700 hover:border-primary/50'
        }`}
      >
        <input {...getInputProps()} />
        <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center mb-4">
          <UploadCloud className="w-8 h-8 text-primary" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
          {isDragActive ? 'Drop files here...' : 'Drag & drop files here'}
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Maximum file size: 8MB</p>
      </div>

      {files.length > 0 && (
        <div className="glass rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Selected Files</h3>
            <button 
              onClick={handleUpload}
              disabled={uploading || files.every(f => f.status === 'success')}
              className="px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {uploading ? 'Processing...' : 'Upload All'}
            </button>
          </div>
          
          <div className="space-y-3">
            <AnimatePresence>
              {files.map((fileObj) => (
                <motion.div 
                  key={fileObj.id}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 flex items-center"
                >
                  <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg mr-4">
                    <File className="w-6 h-6 text-gray-500 dark:text-gray-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {fileObj.file.name}
                    </p>
                    <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 mt-1">
                      <span>{(fileObj.file.size / (1024 * 1024)).toFixed(2)} MB</span>
                      {fileObj.status !== 'pending' && (
                        <>
                          <span className="mx-2">•</span>
                          <span className={fileObj.status === 'error' ? 'text-red-500' : 'text-primary'}>
                            {fileObj.status === 'uploading' ? 'Converting & Uploading...' : 
                             fileObj.status === 'success' ? 'Completed' : 'Error'}
                          </span>
                        </>
                      )}
                    </div>
                    {fileObj.status === 'uploading' && (
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 mt-2">
                        <div 
                          className="bg-primary h-1.5 rounded-full transition-all duration-300" 
                          style={{ width: `${fileObj.progress}%` }}
                        />
                      </div>
                    )}
                  </div>
                  
                  <div className="ml-4">
                    {fileObj.status === 'success' ? (
                      <CheckCircle className="w-5 h-5 text-emerald-500" />
                    ) : (
                      <button 
                        onClick={() => removeFile(fileObj.id)}
                        disabled={fileObj.status === 'uploading'}
                        className="p-1 text-gray-400 hover:text-red-500 transition-colors disabled:opacity-50"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}
    </div>
  );
}
