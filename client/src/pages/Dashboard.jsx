import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import { FileText, Image as ImageIcon, Video, Music, HardDrive, Share2, UploadCloud, ArrowRight, File } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function Dashboard() {
  const { currentUser } = useAuth();
  
  const [statsData, setStatsData] = useState({
    totalFiles: 0,
    totalStorage: 0,
    sharedLinks: 0,
    recentFiles: [],
    storageOverview: {
      images: 0,
      videos: 0,
      audio: 0,
      documents: 0
    }
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (currentUser) {
      fetchDashboardData();
    }
  }, [currentUser]);

  const fetchDashboardData = async () => {
    try {
      const res = await api.get('/files');
      const allFiles = res.data || [];
      
      let totalFiles = 0;
      let totalStorage = 0;
      let sharedLinks = 0;
      
      const storageOverview = { images: 0, videos: 0, audio: 0, documents: 0 };

      allFiles.forEach((file) => {
        totalFiles += 1;
        totalStorage += file.fileSize || 0;
        
        if (file.isPublic) {
          sharedLinks += 1;
        }

        // Categorize storage
        const size = file.fileSize || 0;
        const type = file.fileType || '';
        
        if (type.startsWith('image/')) storageOverview.images += size;
        else if (type.startsWith('video/')) storageOverview.videos += size;
        else if (type.startsWith('audio/')) storageOverview.audio += size;
        else storageOverview.documents += size;
      });

      // Sort recent files by upload date descending
      allFiles.sort((a, b) => new Date(b.uploadDate) - new Date(a.uploadDate));
      const recentFiles = allFiles.slice(0, 5);

      setStatsData({
        totalFiles,
        totalStorage,
        sharedLinks,
        recentFiles,
        storageOverview
      });

    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatSize = (bytes) => {
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  const getFileIcon = (fileType) => {
    if (fileType.startsWith('image/')) return <ImageIcon className="w-5 h-5 text-blue-500" />;
    if (fileType.startsWith('video/')) return <Video className="w-5 h-5 text-purple-500" />;
    if (fileType.startsWith('audio/')) return <Music className="w-5 h-5 text-emerald-500" />;
    return <FileText className="w-5 h-5 text-orange-500" />;
  };
  
  const stats = [
    { name: 'Total Files', value: statsData.totalFiles, icon: FileText, color: 'text-blue-500', bg: 'bg-blue-100 dark:bg-blue-900/30' },
    { name: 'Total Storage', value: formatSize(statsData.totalStorage), icon: HardDrive, color: 'text-purple-500', bg: 'bg-purple-100 dark:bg-purple-900/30' },
    { name: 'Shared Links', value: statsData.sharedLinks, icon: Share2, color: 'text-emerald-500', bg: 'bg-emerald-100 dark:bg-emerald-900/30' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
          Welcome back, {currentUser?.fullName?.split(' ')[0] || 'User'}! 👋
        </h1>
        <Link 
          to="/dashboard/upload" 
          className="inline-flex items-center px-4 py-2 bg-primary hover:bg-primary/90 text-white text-sm font-medium rounded-lg transition-colors shadow-lg shadow-primary/30"
        >
          <UploadCloud className="w-4 h-4 mr-2" />
          Upload File
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat, index) => (
          <motion.div 
            key={stat.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="glass rounded-xl p-6 flex items-center"
          >
            <div className={`p-4 rounded-lg ${stat.bg}`}>
              <stat.icon className={`w-8 h-8 ${stat.color}`} />
            </div>
            <div className="ml-5">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">{stat.name}</p>
              <p className="mt-1 text-2xl font-semibold text-gray-900 dark:text-white">
                {loading ? <span className="animate-pulse bg-gray-200 dark:bg-gray-700 h-6 w-12 rounded inline-block"></span> : stat.value}
              </p>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass rounded-xl p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Files</h2>
            <Link to="/dashboard/files" className="text-sm text-primary hover:underline flex items-center">
              View all <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
          </div>
          
          {loading ? (
             <div className="flex justify-center py-8">
               <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
             </div>
          ) : statsData.recentFiles.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
                <UploadCloud className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-sm font-medium text-gray-900 dark:text-white">No files uploaded</h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Get started by uploading your first file.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {statsData.recentFiles.map(file => (
                <div key={file.id} className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded-lg transition-colors">
                  <div className="flex items-center">
                    <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg mr-3">
                      {getFileIcon(file.fileType)}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate max-w-[200px]" title={file.fileName}>
                        {file.fileName}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(file.uploadDate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                    {formatSize(file.fileSize)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="glass rounded-xl p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Storage Overview</h2>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <ImageIcon className="w-5 h-5 text-blue-500 mr-3" />
                <span className="text-sm text-gray-600 dark:text-gray-300">Images</span>
              </div>
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {loading ? '...' : formatSize(statsData.storageOverview.images)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Video className="w-5 h-5 text-purple-500 mr-3" />
                <span className="text-sm text-gray-600 dark:text-gray-300">Videos</span>
              </div>
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                 {loading ? '...' : formatSize(statsData.storageOverview.videos)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Music className="w-5 h-5 text-emerald-500 mr-3" />
                <span className="text-sm text-gray-600 dark:text-gray-300">Audio</span>
              </div>
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                 {loading ? '...' : formatSize(statsData.storageOverview.audio)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <FileText className="w-5 h-5 text-orange-500 mr-3" />
                <span className="text-sm text-gray-600 dark:text-gray-300">Documents</span>
              </div>
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                 {loading ? '...' : formatSize(statsData.storageOverview.documents)}
              </span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
