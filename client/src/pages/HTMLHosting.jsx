import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import { Globe, ExternalLink, Copy, CheckCircle, Code } from 'lucide-react';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';

export default function HTMLHosting() {
  const { currentUser } = useAuth();
  const [htmlFiles, setHtmlFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState(null);

  const HOSTING_BASE_URL = import.meta.env.VITE_API_URL 
    ? import.meta.env.VITE_API_URL.replace('/api', '') 
    : 'http://localhost:5000';

  useEffect(() => {
    if (currentUser) {
      fetchHtmlFiles();
    }
  }, [currentUser]);

  const fetchHtmlFiles = async () => {
    try {
      const res = await api.get('/files');
      
      const filesList = (res.data || [])
        .filter(file => {
          const type = file.fileType;
          const name = file.fileName;
          return type === 'text/html' || type === 'text/css' || type?.includes('javascript') ||
                 name.endsWith('.html') || name.endsWith('.css') || name.endsWith('.js');
        });
        
      setHtmlFiles(filesList);
    } catch (error) {
      console.error("Error fetching HTML files: ", error);
      toast.error('Failed to load hosted sites');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (url, id) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    toast.success('Live URL copied to clipboard!');
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">HTML Hosting</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage and view your live hosted HTML projects.</p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : htmlFiles.length === 0 ? (
        <div className="glass rounded-xl p-12 text-center">
          <Globe className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">No HTML projects found</h3>
          <p className="text-gray-500 dark:text-gray-400 mt-1 max-w-md mx-auto">
            Upload an <code className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded">index.html</code> file in the My Files section, and it will automatically appear here with a live public URL!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {htmlFiles.map((file, index) => {
            const liveUrl = `${HOSTING_BASE_URL}/api/host/${file.id}`;
            return (
              <motion.div 
                key={file.id} 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="glass rounded-xl p-6 flex flex-col group relative overflow-hidden"
              >
                {/* Status Indicator */}
                <div className="absolute top-0 right-0 bg-emerald-500 text-white text-xs font-bold px-3 py-1 rounded-bl-lg">
                  LIVE
                </div>

                <div className="flex items-start mb-6">
                  <div className="p-4 bg-primary/10 rounded-xl mr-4">
                    <Code className="w-8 h-8 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate" title={file.fileName}>
                      {file.fileName}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Uploaded on {new Date(file.uploadDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                
                <div className="mt-auto bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 border border-gray-100 dark:border-gray-700">
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wider">Live Public URL</p>
                  <div className="flex items-center gap-2">
                    <input 
                      type="text" 
                      readOnly 
                      value={liveUrl} 
                      className="flex-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-md py-1.5 px-3 text-sm text-gray-600 dark:text-gray-300 focus:outline-none"
                    />
                    <button 
                      onClick={() => copyToClipboard(liveUrl, file.id)}
                      className="p-1.5 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-md transition-colors text-gray-700 dark:text-gray-300"
                      title="Copy URL"
                    >
                      {copiedId === file.id ? <CheckCircle className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                    </button>
                    <a 
                      href={liveUrl} 
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
