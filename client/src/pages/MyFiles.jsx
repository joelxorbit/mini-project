import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db, rtdb } from '../firebase/firebase';
import { collection, query, where, getDocs, deleteDoc, doc, updateDoc, increment } from 'firebase/firestore';
import { ref as rtdbRef, remove, get } from 'firebase/database';
import { File, Image as ImageIcon, Video, Music, MoreVertical, Download, Trash2, Edit2, Share2, Search, Filter } from 'lucide-react';
import toast from 'react-hot-toast';

export default function MyFiles() {
  const { currentUser } = useAuth();
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [downloadingId, setDownloadingId] = useState(null);

  useEffect(() => {
    fetchFiles();
  }, [currentUser]);

  const fetchFiles = async () => {
    try {
      const q = query(collection(db, 'Files'), where('owner', '==', currentUser.uid));
      const querySnapshot = await getDocs(q);
      const filesList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      // Sort by uploadDate descending
      filesList.sort((a, b) => new Date(b.uploadDate) - new Date(a.uploadDate));
      setFiles(filesList);
    } catch (error) {
      console.error("Error fetching files: ", error);
      toast.error('Failed to load files');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (fileId, fileSize) => {
    if (!window.confirm('Are you sure you want to delete this file?')) return;

    try {
      // Delete from Realtime Database
      await remove(rtdbRef(rtdb, `fileBlobs/${fileId}`));

      // Delete from Firestore
      await deleteDoc(doc(db, 'Files', fileId));

      // Update user storage
      const userRef = doc(db, 'Users', currentUser.uid);
      await updateDoc(userRef, {
        storageUsed: increment(-fileSize)
      });

      setFiles(prev => prev.filter(f => f.id !== fileId));
      toast.success('File deleted successfully');
    } catch (error) {
      console.error("Error deleting file:", error);
      toast.error('Failed to delete file');
    }
  };

  const handleDownload = async (file) => {
    try {
      setDownloadingId(file.id);
      
      // Fetch base64 string from RTDB
      const snapshot = await get(rtdbRef(rtdb, `fileBlobs/${file.id}/data`));
      
      if (!snapshot.exists()) {
        toast.error('File data not found in database.');
        setDownloadingId(null);
        return;
      }
      
      const base64Data = snapshot.val();
      
      // Create a temporary anchor element to trigger download
      const link = document.createElement('a');
      link.href = base64Data;
      link.download = file.fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Increment download count in Firestore
      await updateDoc(doc(db, 'Files', file.id), {
        downloadCount: increment(1)
      });
      
    } catch (error) {
      console.error("Error downloading file:", error);
      toast.error('Failed to download file');
    } finally {
      setDownloadingId(null);
    }
  };

  const handleShare = async (file) => {
    try {
      const newIsPublic = !file.isPublic;
      await updateDoc(doc(db, 'Files', file.id), {
        isPublic: newIsPublic
      });
      
      setFiles(prev => prev.map(f => f.id === file.id ? { ...f, isPublic: newIsPublic } : f));
      
      if (newIsPublic) {
        toast.success('File shared! Link generated.');
      } else {
        toast.success('File is now private.');
      }
    } catch (error) {
      console.error("Error toggling share:", error);
      toast.error('Failed to update share settings');
    }
  };

  const getFileIcon = (fileType) => {
    if (fileType.startsWith('image/')) return <ImageIcon className="w-8 h-8 text-blue-500" />;
    if (fileType.startsWith('video/')) return <Video className="w-8 h-8 text-purple-500" />;
    if (fileType.startsWith('audio/')) return <Music className="w-8 h-8 text-emerald-500" />;
    return <File className="w-8 h-8 text-orange-500" />;
  };

  const filteredFiles = files.filter(file => 
    file.fileName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Files</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage and download your database files.</p>
        </div>
        
        <div className="flex items-center space-x-2">
          <div className="relative">
            <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search files..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-primary focus:border-primary"
            />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : filteredFiles.length === 0 ? (
        <div className="glass rounded-xl p-12 text-center">
          <File className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">No files found</h3>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            {searchQuery ? "Try a different search term" : "You haven't uploaded any files yet."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredFiles.map((file) => (
            <div key={file.id} className="glass rounded-xl p-4 flex flex-col group transition-transform hover:-translate-y-1 hover:shadow-lg">
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-lg">
                  {getFileIcon(file.fileType)}
                </div>
                <div className="relative dropdown-container">
                  <button className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 opacity-0 group-hover:opacity-100 transition-opacity">
                    <MoreVertical className="w-5 h-5" />
                  </button>
                </div>
              </div>
              
              <div className="mt-auto">
                <h3 className="text-sm font-medium text-gray-900 dark:text-white truncate" title={file.fileName}>
                  {file.fileName}
                </h3>
                <div className="flex justify-between items-center mt-2">
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {(file.fileSize / (1024 * 1024)).toFixed(2)} MB
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {new Date(file.uploadDate).toLocaleDateString()}
                  </span>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={() => handleDownload(file)}
                  disabled={downloadingId === file.id}
                  className="p-1.5 text-gray-500 hover:text-primary transition-colors hover:bg-primary/10 rounded disabled:opacity-50"
                  title="Download"
                >
                  {downloadingId === file.id ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                  ) : (
                    <Download className="w-4 h-4" />
                  )}
                </button>
                <button 
                  onClick={() => handleShare(file)}
                  className={`p-1.5 rounded transition-colors ${file.isPublic ? 'text-blue-500 bg-blue-500/10 hover:bg-blue-500/20' : 'text-gray-500 hover:text-blue-500 hover:bg-blue-500/10'}`}
                  title={file.isPublic ? "Unshare" : "Share"}
                >
                  <Share2 className="w-4 h-4" />
                </button>
                <button 
                  className="p-1.5 text-gray-500 hover:text-purple-500 transition-colors hover:bg-purple-500/10 rounded"
                  title="Rename"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => handleDelete(file.id, file.fileSize)}
                  className="p-1.5 text-gray-500 hover:text-red-500 transition-colors hover:bg-red-500/10 rounded"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
