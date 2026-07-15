import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import { Share2, Copy, CheckCircle, ExternalLink, Globe, File, Image as ImageIcon, Video, Music } from 'lucide-react';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';

export default function SharedFiles() {
  const { currentUser } = useAuth();
  const [sharedFiles, setSharedFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState(null);

  const HOSTING_BASE_URL = import.meta.env.VITE_API_URL 
    ? import.meta.env.VITE_API_URL.replace('/api', '') 
    : 'http://localhost:5000';

  useEffect(() => {
    if (currentUser) {
      fetchSharedFiles();
    }
  }, [currentUser]);

  const fetchSharedFiles = async () => {
    try {
      const res = await api.get('/files');
      const filesList = (res.data || []).filter(file => file.isPublic === true);
      setSharedFiles(filesList);
    } catch (error) {
      console.error("Error fetching shared files: ", error);
      toast.error('Failed to load shared files');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (url, id) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    toast.success('Public URL copied to clipboard!');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const unshareFile = async (fileId) => {
    try {
      await api.patch(`/files/${fileId}/share`, { isPublic: false });
      setSharedFiles(prev => prev.filter(f => f.id !== fileId));
      toast.success('File is now private');
    } catch (error) {
      console.error('Error unsharing file:', error);
      toast.error('Failed to update file permissions');
    }
  };

  const getFileIcon = (fileType) => {
    if (fileType.startsWith('image/')) return <ImageIcon className="w-8 h-8 text-blue-500" />;
    if (fileType.startsWith('video/')) return <Video className="w-8 h-8 text-purple-500" />;
    if (fileType.startsWith('audio/')) return <Music className="w-8 h-8 text-emerald-500" />;
    return <File className="w-8 h-8 text-orange-500" />;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Shared Files</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage your publicly accessible files and links.</p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : sharedFiles.length === 0 ? (
        <div className="glass rounded-xl p-12 text-center">
          <Share2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">No shared files</h3>
          <p className="text-gray-500 dark:text-gray-400 mt-1 max-w-md mx-auto">
            You haven't shared any files yet. Go to the My Files section and click the share icon on any file to generate a public link!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {sharedFiles.map((file, index) => {
            const publicUrl = `${HOSTING_BASE_URL}/api/share/${file.id}`;
            return (
              <motion.div 
                key={file.id} 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="glass rounded-xl p-6 flex flex-col group relative overflow-hidden"
              >
                <div className="flex items-start mb-6">
                  <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-xl mr-4">
                    {getFileIcon(file.fileType)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate" title={file.fileName}>
                      {file.fileName}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {(file.fileSize / (1024 * 1024)).toFixed(2)} MB • {file.downloadCount || 0} Downloads
                    </p>
                  </div>
                  <button
                    onClick={() => unshareFile(file.id)}
                    className="text-xs font-medium text-red-500 hover:text-red-600 bg-red-50 dark:bg-red-500/10 px-3 py-1.5 rounded-lg transition-colors ml-4 whitespace-nowrap"
                  >
                    Revoke Link
                  </button>
                </div>
                
                <div className="mt-auto bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 border border-gray-100 dark:border-gray-700">
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wider">Public Share Link</p>
                  <div className="flex items-center gap-2">
                    <input 
                      type="text" 
                      readOnly 
                      value={publicUrl} 
                      className="flex-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-md py-1.5 px-3 text-sm text-gray-600 dark:text-gray-300 focus:outline-none"
                    />
                    <button 
                      onClick={() => copyToClipboard(publicUrl, file.id)}
                      className="p-1.5 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-md transition-colors text-gray-700 dark:text-gray-300"
                      title="Copy URL"
                    >
                      {copiedId === file.id ? <CheckCircle className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                    </button>
                    <a 
                      href={publicUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="p-1.5 bg-primary hover:bg-primary/90 rounded-md transition-colors text-white"
                      title="Open in new tab"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
