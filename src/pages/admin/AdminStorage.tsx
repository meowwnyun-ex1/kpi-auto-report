import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import {
  Database,
  HardDrive,
  FileText,
  Image,
  Video,
  Music,
  Archive,
  RefreshCw,
  Search,
  Download,
  Trash2,
  Eye,
  MoreHorizontal,
  Folder,
  File,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { getApiUrl } from '@/config/api';
import { storage } from '@/shared/utils';
import { handleSessionValidation } from '@/shared/utils/session-manager';

interface StorageFile {
  id: string;
  name: string;
  type: 'file' | 'folder';
  size: number;
  path: string;
  modified: string;
  permissions: {
    read: boolean;
    write: boolean;
    execute: boolean;
  };
  owner?: string;
  category?: string;
}

interface StorageStats {
  totalSpace: number;
  usedSpace: number;
  availableSpace: number;
  totalFiles: number;
  totalFolders: number;
  fileTypes: {
    images: number;
    videos: number;
    documents: number;
    audio: number;
    archives: number;
    other: number;
  };
}

export const AdminStorage: React.FC = () => {
  const { toast } = useToast();
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [files, setFiles] = useState<StorageFile[]>([]);
  const [stats, setStats] = useState<StorageStats | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [viewMode] = useState<'grid' | 'list'>('list');
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);

  // Fetch storage data from API
  const fetchStorageData = async () => {
    if (!handleSessionValidation(logout, navigate, toast)) {
      return;
    }

    setLoading(true);
    try {
      const token = storage.getAuthToken();
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      // Fetch files and stats in parallel
      const [filesRes, statsRes] = await Promise.allSettled([
        fetch(`${getApiUrl()}/files`, { headers }),
        fetch(`${getApiUrl()}/files/stats/storage`, { headers }),
      ]);

      // Process files response
      let mappedFiles: StorageFile[] = [];
      if (filesRes.status === 'fulfilled' && filesRes.value.ok) {
        const filesData = await filesRes.value.json();
        if (filesData.success && filesData.data) {
          mappedFiles = filesData.data.map((file: any) => ({
            id: file.id,
            name: file.originalName || file.filename,
            type: 'file' as const,
            size: file.size || 0,
            path: file.path || `/uploads/${file.filename}`,
            modified: file.updatedAt || file.createdAt || new Date().toISOString(),
            permissions: { read: true, write: true, execute: false },
            category: getFileCategory(file.mimeType || file.filename),
            owner: file.uploadedBy,
          }));
          setFiles(mappedFiles);
        }
      }

      // Process stats response
      if (statsRes.status === 'fulfilled' && statsRes.value.ok) {
        const statsData = await statsRes.value.json();
        if (statsData.success && statsData.data) {
          const apiStats = statsData.data;
          const usedBytes = Math.max(0, (apiStats.total_size_kb || 0) * 1024);
          const totalBytes = 10737418240; // 10GB default
          setStats({
            totalSpace: totalBytes,
            usedSpace: usedBytes,
            availableSpace: Math.max(0, totalBytes - usedBytes),
            totalFiles: apiStats.total_files || 0,
            totalFolders: 3, // app-icons, banners, trips
            fileTypes: {
              images: mappedFiles.filter((f) => f.category === 'image').length,
              videos: mappedFiles.filter((f) => f.category === 'video').length,
              documents: mappedFiles.filter((f) => f.category === 'document').length,
              audio: mappedFiles.filter((f) => f.category === 'audio').length,
              archives: mappedFiles.filter((f) => f.category === 'archive').length,
              other: mappedFiles.filter((f) => f.category === 'other').length,
            },
          });
        }
      }
    } catch (error) {
      if (import.meta.env.DEV) console.error('Error fetching storage data:', error);
      toast({ title: 'Failed to fetch storage data', variant: 'destructive' });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Helper to get file category from mime type
  const getFileCategory = (mimeType: string): string => {
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('video/')) return 'video';
    if (mimeType.startsWith('audio/')) return 'audio';
    if (mimeType.includes('pdf') || mimeType.includes('document') || mimeType.includes('text'))
      return 'document';
    if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('archive'))
      return 'archive';
    return 'other';
  };

  // Initial fetch
  useEffect(() => {
    fetchStorageData();
  }, []);

  // Handle refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchStorageData();
  };

  // Format file size
  const formatFileSize = (bytes: number | undefined | null): string => {
    if (!bytes || bytes <= 0 || isNaN(bytes)) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Get file icon
  const getFileIcon = (file: StorageFile) => {
    if (file.type === 'folder') return Folder;

    switch (file.category) {
      case 'image':
        return Image;
      case 'video':
        return Video;
      case 'document':
        return FileText;
      case 'audio':
        return Music;
      case 'archive':
        return Archive;
      default:
        return File;
    }
  };

  // Filter files based on search
  const filteredFiles = files.filter(
    (file) =>
      file.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      file.path.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Handle file selection
  const handleFileSelect = (fileId: string) => {
    setSelectedFiles((prev) =>
      prev.includes(fileId) ? prev.filter((id) => id !== fileId) : [...prev, fileId]
    );
  };

  // Handle select all
  const handleSelectAll = () => {
    if (selectedFiles.length === filteredFiles.length) {
      setSelectedFiles([]);
    } else {
      setSelectedFiles(filteredFiles.map((file) => file.id));
    }
  };

  if (loading) {
    return (
      <div className="flex h-full min-h-0 flex-col gap-4 animate-fade-in-up">
        <Card className="flex-shrink-0 rounded-2xl border border-border/80 bg-card shadow-sm ring-1 ring-black/[0.03]">
          <CardHeader className="p-4 sm:p-5">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <div className="p-1.5 bg-blue-50 rounded-lg">
                  <HardDrive className="w-4 h-4 text-blue-500" />
                </div>
                Storage
                <Badge variant="outline" className="ml-2">
                  Loading...
                </Badge>
              </CardTitle>
            </div>
          </CardHeader>
        </Card>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="rounded-2xl">
              <CardHeader>
                <Skeleton className="h-4 w-3/4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-2 w-full mb-2" />
                <Skeleton className="h-2 w-3/4" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Card className="rounded-2xl">
          <CardHeader>
            <Skeleton className="h-4 w-1/4" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-8 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full min-h-0 gap-4">
      {/* Simple Header - Fixed */}
      <div className="flex flex-shrink-0 gap-4 sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <HardDrive className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Storage</h1>
            <span className="text-sm text-gray-500">{stats?.totalFiles ?? 0} files</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Storage Stats - Fixed */}
      {stats && (
        <div className="flex-shrink-0 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-blue-600 rounded-lg">
                <HardDrive className="w-4 h-4 text-white" />
              </div>
              <span className="text-sm font-semibold text-blue-800">Total Space</span>
            </div>
            <div className="text-xl font-bold text-blue-900">
              {formatFileSize(stats.totalSpace)}
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 border border-green-200 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-green-600 rounded-lg">
                <Database className="w-4 h-4 text-white" />
              </div>
              <span className="text-sm font-semibold text-green-800">Available</span>
            </div>
            <div className="text-xl font-bold text-green-900">
              {formatFileSize(stats?.availableSpace ?? 0)}
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 border border-purple-200 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-purple-600 rounded-lg">
                <FileText className="w-4 h-4 text-white" />
              </div>
              <span className="text-sm font-semibold text-purple-800">Files</span>
            </div>
            <div className="text-xl font-bold text-purple-900">
              {stats.totalFiles.toLocaleString()}
            </div>
          </div>

          <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-4 border border-orange-200 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-orange-600 rounded-lg">
                <Database className="w-4 h-4 text-white" />
              </div>
              <span className="text-sm font-semibold text-orange-800">Usage</span>
            </div>
            <div className="text-xl font-bold text-orange-900">
              {stats.totalSpace > 0
                ? Math.min(100, Math.round((stats.usedSpace / stats.totalSpace) * 100))
                : 0}
              %
            </div>
            <div className="text-xs text-orange-600 mt-1">
              {formatFileSize(stats.usedSpace)} used
            </div>
          </div>
        </div>
      )}

      {/* Filters - Fixed */}
      <div className="flex flex-shrink-0 items-center justify-between gap-3">
        {/* Bulk Actions - Show when files are selected */}
        {selectedFiles.length > 0 && (
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="gap-1">
              {selectedFiles.length} selected
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                // Download selected files
                toast({
                  title: `Downloading ${selectedFiles.length} files...`,
                  variant: 'default',
                });
              }}>
              <Download className="w-4 h-4 mr-1" />
              Download
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => {
                // Delete selected files
                toast({
                  title: `Deleting ${selectedFiles.length} files...`,
                  variant: 'destructive',
                });
                setSelectedFiles([]);
              }}>
              <Trash2 className="w-4 h-4 mr-1" />
              Delete
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setSelectedFiles([])}>
              Clear
            </Button>
          </div>
        )}

        {/* Search */}
        <div className="relative w-64 ml-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search files..."
            className="h-9 pl-9 bg-white"
          />
        </div>
      </div>

      {/* Files List - Scrollable */}
      <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
        {/* Table Header - Fixed */}
        <div className="flex-shrink-0 bg-gradient-to-r from-gray-50 to-gray-100/50 border-b">
          <div className="grid grid-cols-12 gap-2 px-4 py-3 text-xs font-semibold text-gray-600 items-center">
            <div className="col-span-1 flex items-center justify-center">
              <div
                className={`flex items-center justify-center w-6 h-6 rounded-full cursor-pointer transition-all duration-200 ${
                  selectedFiles.length === filteredFiles.length && filteredFiles.length > 0
                    ? 'bg-red-500 shadow-md shadow-red-500/20'
                    : 'bg-white/95 hover:bg-gray-50 shadow-sm hover:shadow border border-gray-200/50'
                }`}
                onClick={handleSelectAll}>
                {selectedFiles.length === filteredFiles.length && filteredFiles.length > 0 && (
                  <div className="w-2.5 h-2.5 rounded-full bg-white" />
                )}
              </div>
            </div>
            <div className="col-span-4">Name</div>
            <div className="col-span-2">Type</div>
            <div className="col-span-1">Size</div>
            <div className="col-span-2">Modified</div>
            <div className="col-span-1">Permissions</div>
            <div className="col-span-1 text-right">Actions</div>
          </div>
        </div>

        {/* Table Body - Scrollable */}
        <div className="flex-1 min-h-0 overflow-auto">
          <div className="p-2">
            {filteredFiles.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <img src="/found.png" alt="Not found" className="w-32 h-32 mb-4 object-contain" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {searchTerm ? 'No files found' : 'No files available'}
                </h3>
                <p className="text-gray-600 text-center">
                  {searchTerm ? 'Try adjusting your search terms' : 'Storage is empty'}
                </p>
              </div>
            ) : viewMode === 'list' ? (
              <div className="bg-white rounded-xl border border-gray-200 divide-y">
                {filteredFiles.map((file) => {
                  const Icon = getFileIcon(file);
                  const isSelected = selectedFiles.includes(file.id);
                  return (
                    <div
                      key={file.id}
                      className={`grid grid-cols-12 gap-2 px-4 py-3 items-center transition-colors ${
                        isSelected ? 'bg-blue-50 border-l-4 border-l-blue-500' : 'hover:bg-gray-50'
                      }`}>
                      <div className="col-span-1 flex items-center justify-center">
                        <div
                          className={`flex items-center justify-center w-6 h-6 rounded-full cursor-pointer transition-all duration-200 ${
                            isSelected
                              ? 'bg-red-500 scale-110 shadow-md shadow-red-500/20'
                              : 'bg-white/95 hover:bg-gray-50 shadow-sm hover:shadow border border-gray-200/50'
                          }`}
                          onClick={() => handleFileSelect(file.id)}>
                          {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-white" />}
                        </div>
                      </div>
                      <div className="col-span-4 flex items-center gap-2">
                        <Icon
                          className={`w-4 h-4 flex-shrink-0 ${isSelected ? 'text-blue-500' : 'text-gray-500'}`}
                        />
                        <span
                          className={`font-medium truncate ${isSelected ? 'text-blue-900' : ''}`}>
                          {file.name}
                        </span>
                      </div>
                      <div className="col-span-2 text-sm text-gray-600 capitalize">
                        {file.type === 'folder' ? 'Folder' : file.category || 'File'}
                      </div>
                      <div className="col-span-1 text-sm text-gray-600">
                        {formatFileSize(file.size)}
                      </div>
                      <div className="col-span-2 text-sm text-gray-500">
                        {new Date(file.modified).toLocaleDateString()}
                      </div>
                      <div className="col-span-1 text-xs text-gray-500">rw-</div>
                      <div className="col-span-1 flex justify-end">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <Eye className="w-4 h-4 mr-2" />
                              View
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Download className="w-4 h-4 mr-2" />
                              Download
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-red-600">
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 animate-fade-in p-4">
                {filteredFiles.map((file) => {
                  const Icon = getFileIcon(file);
                  return (
                    <Card
                      key={file.id}
                      className={`cursor-pointer hover:shadow-md transition-shadow ${
                        selectedFiles.includes(file.id) ? 'ring-2 ring-blue-500' : ''
                      }`}
                      onClick={() => handleFileSelect(file.id)}>
                      <CardContent className="p-4 text-center">
                        <Icon className="w-8 h-8 mx-auto mb-2 text-gray-500" />
                        <div className="text-sm font-medium truncate">{file.name}</div>
                        <div className="text-xs text-gray-600">
                          {file.type === 'folder' ? 'Folder' : formatFileSize(file.size)}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminStorage;
