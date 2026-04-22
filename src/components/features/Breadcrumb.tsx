import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  ChevronRight,
  Home,
  BarChart3,
  Package,
  Settings,
  Users,
  HardDrive,
  Image as ImageIcon,
  MapPin,
  Upload,
  Download,
  Database,
  Shield,
  FileText,
  Search,
  Filter,
  Grid,
  List,
  Clock,
  Star,
  TrendingUp,
  Activity,
  Edit,
  Plus,
  Eye,
  Trash2,
  Archive,
  Lock,
  Key,
  AlertTriangle,
  Check,
  X,
  RefreshCw,
  MoreHorizontal,
  Bell,
  MessageSquare,
  HelpCircle,
  LogOut,
  UserCircle,
  Settings2,
  Wrench,
  Target,
  Award,
  BookOpen,
  GraduationCap,
  Briefcase,
  Building,
  Plane,
  Navigation,
  Compass,
  Calendar,
  DollarSign,
  Share2,
  Folder,
  Server,
  Video,
  Music,
  Newspaper,
  Cookie,
  File,
  FileSpreadsheet,
  Code,
  Gauge,
  PlayCircle,
  Cog,
  Monitor,
  Headphones,
  Heart,
  ShoppingCart,
  CreditCard,
  Store,
  Bookmark,
  Wifi,
  Mail,
  Phone,
  Gamepad2,
  Film,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

interface BreadcrumbItem {
  label: string;
  href?: string;
  icon?: React.ComponentType<{ className?: string }>;
  badge?: string | number;
  isActive?: boolean;
  status?: 'online' | 'offline' | 'warning' | 'error';
  description?: string;
  count?: number;
  rating?: number;
  price?: string;
  category?: string;
  isNew?: boolean;
  isFeatured?: boolean;
  isPopular?: boolean;
  fileType?: string;
  fileSize?: string;
  fileDate?: string;
  fileStatus?: 'uploading' | 'downloading' | 'processing' | 'completed' | 'error' | 'pending';
  permissions?: 'read' | 'write' | 'admin' | 'owner';
  isFolder?: boolean;
  isShared?: boolean;
  isEncrypted?: boolean;
  isLocked?: boolean;
}

interface BreadcrumbProps {
  extra?: string;
  className?: string;
  variant?: 'admin' | 'user' | 'file' | 'auto';
  showHome?: boolean;
  maxItems?: number;
  showIcons?: boolean;
  showBadges?: boolean;
  showStatus?: boolean;
  showRating?: boolean;
  showPrice?: boolean;
  showFileSize?: boolean;
  showFileDate?: boolean;
  showFileStatus?: boolean;
  showPermissions?: boolean;
  compact?: boolean;
  detailed?: boolean;
}

const Breadcrumb: React.FC<BreadcrumbProps> = ({
  extra,
  className,
  variant = 'auto',
  showHome = true,
  maxItems = 5,
  showIcons = true,
  showBadges = true,
  showStatus = false,
  showRating = false,
  showPrice = false,
  showFileSize = false,
  showFileDate = false,
  showFileStatus = false,
  showPermissions = false,
  compact = false,
  detailed = false,
}) => {
  const location = useLocation();

  const getIconForPage = (
    page: string,
    context: string
  ): React.ComponentType<{ className?: string }> | null => {
    const pageLower = page.toLowerCase();

    // Admin icons
    if (context === 'admin') {
      switch (pageLower) {
        case 'dashboard':
          return BarChart3;
        case 'applications':
          return Package;
        case 'pending':
          return Clock;
        case 'banners':
          return ImageIcon;
        case 'trips':
          return MapPin;
        case 'storage':
          return HardDrive;
        case 'categories':
          return Settings;
        case 'users':
          return UserCircle;
        case 'import':
          return Upload;
        case 'export':
          return Download;
        case 'backup':
          return Database;
        case 'restore':
          return RefreshCw;
        case 'settings':
          return Settings2;
        case 'logs':
          return FileText;
        case 'analytics':
          return TrendingUp;
        case 'security':
          return Shield;
        case 'permissions':
          return Key;
        case 'roles':
          return Shield;
        case 'access':
          return Lock;
        case 'forms':
          return FileText;
        case 'edit':
          return Edit;
        case 'add':
          return Plus;
        case 'create':
          return Plus;
        case 'update':
          return Edit;
        case 'delete':
          return Trash2;
        case 'view':
          return Eye;
        case 'manage':
          return Cog;
        case 'profile':
          return UserCircle;
        case 'account':
          return UserCircle;
        case 'login':
          return Lock;
        case 'logout':
          return LogOut;
        case 'notifications':
          return Bell;
        case 'messages':
          return MessageSquare;
        case 'help':
          return HelpCircle;
        case 'support':
          return Headphones;
        case 'faq':
          return HelpCircle;
        case 'content':
          return FileText;
        case 'media':
          return ImageIcon;
        case 'files':
          return Folder;
        case 'documents':
          return FileText;
        case 'images':
          return ImageIcon;
        case 'videos':
          return Video;
        case 'audio':
          return Music;
        case 'system':
          return Server;
        case 'monitoring':
          return Activity;
        case 'health':
          return Heart;
        case 'performance':
          return Gauge;
        case 'errors':
          return AlertTriangle;
        case 'warnings':
          return AlertTriangle;
        case 'api':
          return Code;
        case 'database':
          return Database;
        case 'cache':
          return Database;
        case 'queue':
          return List;
        case 'orders':
          return ShoppingCart;
        case 'products':
          return Package;
        case 'inventory':
          return Package;
        case 'billing':
          return CreditCard;
        case 'invoices':
          return FileText;
        case 'payments':
          return CreditCard;
        case 'subscriptions':
          return CreditCard;
        case 'customers':
          return Users;
        case 'vendors':
          return Users;
        case 'reports':
          return FileText;
        case 'statistics':
          return BarChart3;
        case 'charts':
          return BarChart3;
        case 'metrics':
          return TrendingUp;
        case 'tools':
          return Wrench;
        case 'utilities':
          return Wrench;
        case 'maintenance':
          return Wrench;
        case 'audit':
          return Shield;
        case 'compliance':
          return Shield;
        case 'firewall':
          return Shield;
        case 'servers':
          return Server;
        case 'network':
          return Wifi;
        default:
          return null;
      }
    }

    // User/Public icons
    if (context === 'user') {
      switch (pageLower) {
        case 'home':
          return Home;
        case 'apps':
          return Package;
        case 'applications':
          return Package;
        case 'store':
          return Store;
        case 'shop':
          return ShoppingCart;
        case 'categories':
          return Grid;
        case 'search':
          return Search;
        case 'filter':
          return Filter;
        case 'browse':
          return Grid;
        case 'explore':
          return Compass;
        case 'favorites':
          return Heart;
        case 'bookmarks':
          return Bookmark;
        case 'recent':
          return Clock;
        case 'history':
          return Clock;
        case 'downloads':
          return Download;
        case 'uploads':
          return Upload;
        case 'featured':
          return Star;
        case 'trending':
          return TrendingUp;
        case 'popular':
          return Activity;
        case 'new':
          return Plus;
        case 'recommended':
          return Award;
        case 'top':
          return Target;
        case 'profile':
          return UserCircle;
        case 'account':
          return UserCircle;
        case 'settings':
          return Settings;
        case 'dashboard':
          return BarChart3;
        case 'help':
          return HelpCircle;
        case 'support':
          return Headphones;
        case 'faq':
          return HelpCircle;
        case 'about':
          return AlertTriangle;
        case 'contact':
          return Mail;
        case 'phone':
          return Phone;
        case 'terms':
          return FileText;
        case 'privacy':
          return Shield;
        case 'cookies':
          return Cookie;
        case 'policy':
          return FileText;
        case 'cart':
          return ShoppingCart;
        case 'wishlist':
          return Heart;
        case 'orders':
          return Package;
        case 'purchases':
          return FileText;
        case 'billing':
          return CreditCard;
        case 'payment':
          return CreditCard;
        case 'subscription':
          return CreditCard;
        case 'share':
          return Share2;
        case 'community':
          return Users;
        case 'reviews':
          return Star;
        case 'ratings':
          return Star;
        case 'comments':
          return MessageSquare;
        case 'images':
          return ImageIcon;
        case 'videos':
          return Video;
        case 'audio':
          return Music;
        case 'documents':
          return FileText;
        case 'files':
          return Folder;
        case 'form':
          return FileText;
        case 'location':
          return MapPin;
        case 'map':
          return Navigation;
        case 'navigation':
          return Navigation;
        case 'travel':
          return Plane;
        case 'trips':
          return MapPin;
        case 'destinations':
          return MapPin;
        case 'news':
          return Newspaper;
        case 'blog':
          return FileText;
        case 'articles':
          return FileText;
        case 'posts':
          return FileText;
        case 'events':
          return Calendar;
        case 'calendar':
          return Calendar;
        case 'schedule':
          return Calendar;
        case 'notifications':
          return Bell;
        case 'alerts':
          return AlertTriangle;
        case 'messages':
          return MessageSquare;
        case 'tools':
          return Wrench;
        case 'utilities':
          return Wrench;
        case 'learn':
          return BookOpen;
        case 'courses':
          return BookOpen;
        case 'tutorials':
          return PlayCircle;
        case 'education':
          return GraduationCap;
        case 'business':
          return Briefcase;
        case 'company':
          return Building;
        case 'enterprise':
          return Building;
        case 'tech':
          return Code;
        case 'software':
          return Monitor;
        case 'hardware':
          return HardDrive;
        case 'health':
          return Heart;
        case 'fitness':
          return Activity;
        case 'medical':
          return Shield;
        case 'finance':
          return DollarSign;
        case 'banking':
          return CreditCard;
        case 'investments':
          return TrendingUp;
        case 'games':
          return Gamepad2;
        case 'movies':
          return Film;
        case 'music':
          return Music;
        case 'books':
          return BookOpen;
        default:
          return null;
      }
    }

    // File type icons
    if (context === 'file') {
      const extension = page.split('.').pop()?.toLowerCase();
      switch (extension) {
        case 'pdf':
          return FileText;
        case 'doc':
        case 'docx':
          return FileText;
        case 'xls':
        case 'xlsx':
          return FileSpreadsheet;
        case 'ppt':
        case 'pptx':
          return FileText;
        case 'jpg':
        case 'jpeg':
        case 'png':
        case 'gif':
        case 'svg':
        case 'webp':
          return ImageIcon;
        case 'mp4':
        case 'avi':
        case 'mov':
        case 'wmv':
        case 'flv':
        case 'webm':
          return Video;
        case 'mp3':
        case 'wav':
        case 'flac':
        case 'aac':
        case 'ogg':
          return Music;
        case 'zip':
        case 'rar':
        case '7z':
        case 'tar':
        case 'gz':
          return Archive;
        case 'js':
        case 'ts':
        case 'jsx':
        case 'tsx':
        case 'html':
        case 'css':
        case 'json':
        case 'xml':
        case 'py':
        case 'java':
        case 'cpp':
        case 'c':
        case 'php':
        case 'rb':
        case 'go':
        case 'rs':
          return Code;
        case 'sql':
        case 'db':
        case 'sqlite':
        case 'mdb':
          return Database;
        default:
          return File;
      }
    }

    // Default icons
    switch (pageLower) {
      case 'home':
        return Home;
      case 'dashboard':
        return BarChart3;
      case 'apps':
        return Package;
      case 'applications':
        return Package;
      case 'categories':
        return Grid;
      case 'users':
        return Users;
      case 'settings':
        return Settings;
      case 'profile':
        return UserCircle;
      case 'help':
        return HelpCircle;
      case 'about':
        return AlertTriangle;
      case 'contact':
        return Mail;
      case 'login':
        return Lock;
      case 'logout':
        return LogOut;
      default:
        return null;
    }
  };

  const getContextFromPath = (pathname: string): string => {
    if (variant === 'admin') return 'admin';
    if (variant === 'user') return 'user';
    if (variant === 'file') return 'file';
    if (variant === 'auto') {
      if (pathname.startsWith('/admin')) return 'admin';
      if (pathname.startsWith('/files')) return 'file';
      return 'user';
    }
    return 'default';
  };

  const getPageLabel = (segment: string, context: string): string => {
    const pageMap: Record<string, Record<string, string>> = {
      admin: {
        admin: 'Dashboard',
        applications: 'Applications',
        pending: 'Pending Apps',
        banners: 'Banners',
        trips: 'Trips',
        storage: 'Storage',
        categories: 'Categories',
        users: 'Users',
        import: 'Import',
        export: 'Export',
        settings: 'Settings',
        logs: 'Logs',
        analytics: 'Analytics',
        security: 'Security',
        backup: 'Backup',
        restore: 'Restore',
        forms: 'Forms',
        edit: 'Edit',
        create: 'Create',
        'Add Application': 'Add Application',
        'Add Banner': 'Add Banner',
        'Add Trip': 'Add Trip',
        'Add Category': 'Add Category',
        'Edit Application': 'Edit Application',
        'Edit Banner': 'Edit Banner',
        'Edit Trip': 'Edit Trip',
        'Edit Category': 'Edit Category',
        update: 'Update',
        delete: 'Delete',
        view: 'View',
        manage: 'Manage',
        profile: 'Profile',
        account: 'Account',
        login: 'Login',
        logout: 'Logout',
        notifications: 'Notifications',
        messages: 'Messages',
        help: 'Help',
        support: 'Support',
        faq: 'FAQ',
        content: 'Content',
        media: 'Media',
        files: 'Files',
        documents: 'Documents',
        images: 'Images',
        videos: 'Videos',
        audio: 'Audio',
        system: 'System',
        monitoring: 'Monitoring',
        health: 'Health',
        performance: 'Performance',
        errors: 'Errors',
        warnings: 'Warnings',
        api: 'API',
        database: 'Database',
        cache: 'Cache',
        queue: 'Queue',
        orders: 'Orders',
        products: 'Products',
        inventory: 'Inventory',
        billing: 'Billing',
        invoices: 'Invoices',
        payments: 'Payments',
        subscriptions: 'Subscriptions',
        customers: 'Customers',
        vendors: 'Vendors',
        reports: 'Reports',
        statistics: 'Statistics',
        charts: 'Charts',
        metrics: 'Metrics',
        tools: 'Tools',
        utilities: 'Utilities',
        maintenance: 'Maintenance',
        audit: 'Audit',
        compliance: 'Compliance',
        firewall: 'Firewall',
        servers: 'Servers',
        network: 'Network',
        permissions: 'Permissions',
        roles: 'Roles',
        access: 'Access',
        overview: 'KPI Overview',
        'yearly-targets': 'Yearly Targets',
        'monthly-targets': 'Monthly Targets',
        'monthly-result': 'Monthly Results',
        'action-plans': 'Action Plans',
        employees: 'Employees',
        'kpi-items': 'KPI Measurements',
      },
      user: {
        home: 'Home',
        apps: 'Apps',
        applications: 'Applications',
        store: 'KPI Report',
        overview: 'KPI Overview',
        'yearly-targets': 'Yearly Targets',
        'monthly-targets': 'Monthly Targets',
        'monthly-result': 'Monthly Results',
        'action-plans': 'Action Plans',
        dashboard: 'Dashboard',
        safety: 'Safety',
        quality: 'Quality',
        delivery: 'Delivery',
        compliance: 'Compliance',
        hr: 'HR',
        attractive: 'Attractive',
        environment: 'Environment',
        cost: 'Cost',
        shop: 'Shop',
        categories: 'Categories',
        search: 'Search',
        filter: 'Filter',
        browse: 'Browse',
        explore: 'Explore',
        favorites: 'Favorites',
        bookmarks: 'Bookmarks',
        recent: 'Recent',
        history: 'History',
        downloads: 'Downloads',
        uploads: 'Uploads',
        featured: 'Featured',
        trending: 'Trending',
        popular: 'Popular',
        new: 'New',
        recommended: 'Recommended',
        top: 'Top',
        profile: 'Profile',
        account: 'Account',
        help: 'Help',
        support: 'Support',
        faq: 'FAQ',
        about: 'About',
        contact: 'Contact',
        phone: 'Phone',
        terms: 'Terms',
        privacy: 'Privacy',
        cookies: 'Cookies',
        policy: 'Policy',
        cart: 'Cart',
        wishlist: 'Wishlist',
        orders: 'Orders',
        purchases: 'Purchases',
        billing: 'Billing',
        payment: 'Payment',
        subscription: 'Subscription',
        share: 'Share',
        community: 'Community',
        reviews: 'Reviews',
        ratings: 'Ratings',
        comments: 'Comments',
        images: 'Images',
        videos: 'Videos',
        audio: 'Audio',
        documents: 'Documents',
        files: 'Files',
        location: 'Location',
        map: 'Map',
        navigation: 'Navigation',
        travel: 'Travel',
        trips: 'Trips',
        destinations: 'Destinations',
        news: 'News',
        blog: 'Blog',
        articles: 'Articles',
        posts: 'Posts',
        events: 'Events',
        calendar: 'Calendar',
        schedule: 'Schedule',
        notifications: 'Notifications',
        alerts: 'Alerts',
        messages: 'Messages',
        tools: 'Tools',
        utilities: 'Utilities',
        learn: 'Learn',
        courses: 'Courses',
        tutorials: 'Tutorials',
        education: 'Education',
        business: 'Business',
        company: 'Company',
        enterprise: 'Enterprise',
        tech: 'Technology',
        software: 'Software',
        hardware: 'Hardware',
        health: 'Health',
        fitness: 'Fitness',
        medical: 'Medical',
        finance: 'Finance',
        banking: 'Banking',
        investments: 'Investments',
        games: 'Games',
        movies: 'Movies',
        music: 'Music',
        books: 'Books',
        form: 'Form',
        Form: 'Form', // Handle capital F for /Form route
        kpi: 'KPI',
        employees: 'Employees',
        'kpi-items': 'KPI Measurements',
      },
      file: {
        files: 'Files',
        documents: 'Documents',
        images: 'Images',
        videos: 'Videos',
        audio: 'Audio',
        downloads: 'Downloads',
        uploads: 'Uploads',
        shared: 'Shared',
        archived: 'Archived',
        trash: 'Trash',
        recent: 'Recent',
        favorites: 'Favorites',
        search: 'Search',
        filter: 'Filter',
      },
      default: {
        home: 'Home',
        dashboard: 'Dashboard',
        apps: 'Apps',
        applications: 'Applications',
        categories: 'Categories',
        users: 'Users',
        settings: 'Settings',
        profile: 'Profile',
        help: 'Help',
        about: 'About',
        contact: 'Contact',
        form: 'Form',
        Form: 'Form', // Handle capital F for /Form route
      },
    };

    const contextPageMap = pageMap[context] || pageMap.default;
    return contextPageMap[segment] || segment.charAt(0).toUpperCase() + segment.slice(1);
  };

  const getBadgeForPage = (page: string, context: string): string | number | null => {
    const pageLower = page.toLowerCase();

    switch (context) {
      case 'admin':
        if (pageLower === 'pending') return '3';
        if (pageLower === 'notifications') return '5';
        if (pageLower === 'messages') return '2';
        if (pageLower === 'errors') return '1';
        if (pageLower === 'warnings') return '4';
        break;
      case 'user':
        if (pageLower === 'notifications') return '2';
        if (pageLower === 'messages') return '1';
        if (pageLower === 'cart') return '5';
        if (pageLower === 'wishlist') return '8';
        if (pageLower === 'new') return 'New';
        if (pageLower === 'featured') return 'Featured';
        if (pageLower === 'popular') return 'Popular';
        if (pageLower === 'trending') return 'Trending';
        if (pageLower === 'sale') return 'Sale';
        if (pageLower === 'discount') return '20% OFF';
        break;
    }
    return null;
  };

  const getStatusForPage = (page: string): 'online' | 'offline' | 'warning' | 'error' | null => {
    const pageLower = page.toLowerCase();

    switch (pageLower) {
      case 'dashboard':
        return 'online';
      case 'applications':
        return 'online';
      case 'storage':
        return 'warning';
      case 'database':
        return 'online';
      case 'backup':
        return 'offline';
      case 'errors':
        return 'error';
      case 'warnings':
        return 'warning';
      default:
        return null;
    }
  };

  const getRatingForPage = (page: string): number | null => {
    const pageLower = page.toLowerCase();

    switch (pageLower) {
      case 'featured':
        return 4.8;
      case 'top':
        return 4.9;
      case 'recommended':
        return 4.7;
      case 'popular':
        return 4.6;
      default:
        return null;
    }
  };

  const getPriceForPage = (page: string): string | null => {
    const pageLower = page.toLowerCase();

    switch (pageLower) {
      case 'sale':
        return '$9.99';
      case 'discount':
        return '$19.99';
      case 'featured':
        return '$29.99';
      case 'new':
        return '$39.99';
      default:
        return null;
    }
  };

  const getCategoryForPage = (page: string): string | null => {
    const pageLower = page.toLowerCase();

    switch (pageLower) {
      case 'productivity':
        return 'Productivity';
      case 'business':
        return 'Business';
      case 'education':
        return 'Education';
      case 'entertainment':
        return 'Entertainment';
      case 'utilities':
        return 'Utilities';
      case 'games':
        return 'Games';
      case 'social':
        return 'Social';
      case 'health':
        return 'Health';
      case 'finance':
        return 'Finance';
      default:
        return null;
    }
  };

  const getBreadcrumbs = (): BreadcrumbItem[] => {
    const pathSegments = location.pathname.split('/').filter(Boolean);
    const context = getContextFromPath(location.pathname);
    const breadcrumbs: BreadcrumbItem[] = [];

    // Add root
    if (showHome) {
      const rootLabel = context === 'admin' ? 'Admin' : context === 'file' ? 'Files' : 'Home';
      const rootHref = context === 'admin' ? '/admin' : context === 'file' ? '/files' : '/';

      breadcrumbs.push({
        label: rootLabel,
        href: rootHref,
        icon: Home,
        isActive: pathSegments.length === 0,
        status: context === 'admin' ? 'online' : undefined,
      });
    }

    // Add path segments
    let accumulatedPath = context === 'admin' ? '/admin' : context === 'file' ? '/files' : '';

    pathSegments.forEach((segment, index) => {
      if (
        (context === 'admin' && segment === 'admin') ||
        (context === 'file' && segment === 'files')
      )
        return;

      // Skip numeric segments (IDs) in breadcrumb
      if (/^\d+$/.test(segment)) return;

      // Skip 'add' segments since we'll show extra breadcrumb instead
      if (segment === 'add') return;

      accumulatedPath += `/${segment}`;
      const pageLabel = getPageLabel(segment, context);
      const pageIcon = showIcons ? getIconForPage(pageLabel, context) : null;
      const pageBadge = showBadges ? getBadgeForPage(pageLabel, context) : null;
      const pageStatus = showStatus ? getStatusForPage(pageLabel) : null;
      const pageRating = showRating ? getRatingForPage(pageLabel) : null;
      const pagePrice = showPrice ? getPriceForPage(pageLabel) : null;
      const pageCategory = getCategoryForPage(pageLabel);
      const isLast = index === pathSegments.length - 1;

      breadcrumbs.push({
        label: pageLabel,
        href: accumulatedPath,
        icon: pageIcon || undefined,
        badge: pageBadge || undefined,
        status: pageStatus || undefined,
        rating: pageRating || undefined,
        price: pagePrice || undefined,
        category: pageCategory || undefined,
        isActive: isLast,
        isNew: pageLabel === 'New',
        isFeatured: pageLabel === 'Featured',
        isPopular: pageLabel === 'Popular',
        fileType: context === 'file' ? segment.split('.').pop() : undefined,
        isFolder: context === 'file' && !segment.includes('.'),
      });
    });

    // Add extra breadcrumb if provided
    if (extra) {
      const extraIcon = showIcons ? getIconForPage(extra, context) : null;
      breadcrumbs.push({
        label: extra,
        isActive: true,
        icon: extraIcon || undefined,
      });
    }

    return breadcrumbs;
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'online':
        return 'text-green-500';
      case 'offline':
        return 'text-gray-400';
      case 'warning':
        return 'text-yellow-500';
      case 'error':
        return 'text-red-500';
      default:
        return 'text-gray-400';
    }
  };

  const getStatusIcon = (status: string): React.ComponentType<{ className?: string }> => {
    switch (status) {
      case 'online':
        return Check;
      case 'offline':
        return X;
      case 'warning':
        return AlertTriangle;
      case 'error':
        return AlertTriangle;
      default:
        return Check;
    }
  };

  const renderStars = (rating: number): React.ReactElement => {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={cn(
              'h-3 w-3',
              star <= rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
            )}
          />
        ))}
        <span className="text-xs text-gray-500 ml-1">({rating})</span>
      </div>
    );
  };

  const formatDate = (date: string | Date): string => {
    const d = new Date(date);
    return (
      d.toLocaleDateString() +
      ' ' +
      d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    );
  };

  const breadcrumbs = getBreadcrumbs();

  // Handle truncation for long breadcrumb paths
  const displayBreadcrumbs = React.useMemo(() => {
    if (breadcrumbs.length <= maxItems) return breadcrumbs;

    const first = breadcrumbs[0];
    const last = breadcrumbs.slice(-2);

    return [
      first,
      {
        label: '...',
        icon: MoreHorizontal,
        isActive: false,
      },
      ...last,
    ];
  }, [breadcrumbs, maxItems]);

  if (compact) {
    return (
      <nav aria-label="Breadcrumb" className={cn('flex items-center space-x-1', className)}>
        <ol className="flex items-center space-x-1">
          {displayBreadcrumbs.map((item, index) => {
            const Icon = item.icon;

            return (
              <li key={index} className="flex items-center">
                {index > 0 && <ChevronRight className="h-3 w-3 text-gray-400 mx-1 flex-shrink-0" />}

                {'href' in item && item.href ? (
                  <Link
                    to={item.href}
                    className="flex items-center gap-1 text-xs font-medium text-gray-600 hover:text-blue-600 transition-colors">
                    {Icon && <Icon className="h-3 w-3 flex-shrink-0" />}
                    <span className="truncate max-w-[80px]">{item.label}</span>
                  </Link>
                ) : (
                  <div className="flex items-center gap-1">
                    {Icon && <Icon className="h-3 w-3 flex-shrink-0 text-gray-500" />}
                    <span className="text-xs font-medium text-gray-900 truncate max-w-[80px]">
                      {item.label}
                    </span>
                  </div>
                )}
              </li>
            );
          })}
        </ol>
      </nav>
    );
  }

  return (
    <nav aria-label="Breadcrumb" className={cn('flex flex-col space-y-1', className)}>
      {/* Main breadcrumb */}
      <div className="flex items-center">
        <ol className={cn('flex items-center', compact ? 'space-x-1' : 'space-x-2')}>
          {displayBreadcrumbs.map((item, index) => {
            const isLast = index === displayBreadcrumbs.length - 1;
            const Icon = item.icon;
            const StatusIcon = 'status' in item && item.status ? getStatusIcon(item.status) : null;

            return (
              <li key={index} className="flex items-center">
                {index > 0 && (
                  <ChevronRight
                    className={cn(
                      'flex-shrink-0 text-gray-400 mx-1',
                      compact ? 'h-3 w-3' : 'h-4 w-4'
                    )}
                  />
                )}

                {'href' in item && item.href ? (
                  <Link
                    to={item.href}
                    className={cn(
                      'flex items-center gap-2 transition-all duration-200',
                      compact ? 'text-xs' : 'text-sm',
                      'font-medium text-gray-600 hover:text-blue-600',
                      'hover:underline underline-offset-2 decoration-blue-200'
                    )}>
                    <div className="flex items-center gap-1">
                      {Icon && (
                        <Icon className={cn('flex-shrink-0', compact ? 'h-3 w-3' : 'h-4 w-4')} />
                      )}
                      {StatusIcon && (
                        <StatusIcon
                          className={cn(
                            'h-2 w-2',
                            getStatusColor('status' in item ? item.status || 'online' : 'online')
                          )}
                        />
                      )}
                    </div>
                    <span
                      className={cn(
                        'truncate',
                        compact ? 'max-w-[80px]' : 'max-w-[120px] sm:max-w-none'
                      )}>
                      {item.label}
                    </span>
                    {'badge' in item && item.badge && (
                      <Badge
                        variant="secondary"
                        className={cn('text-xs px-1 py-0', compact ? 'text-xs' : '')}>
                        {item.badge}
                      </Badge>
                    )}
                  </Link>
                ) : (
                  <div
                    className={cn(
                      'flex items-center gap-2',
                      compact ? 'text-xs' : 'text-sm',
                      'font-medium',
                      isLast ? 'text-gray-900' : 'text-gray-600'
                    )}>
                    <div className="flex items-center gap-1">
                      {Icon && (
                        <Icon
                          className={cn(
                            'flex-shrink-0',
                            compact ? 'h-3 w-3' : 'h-4 w-4',
                            isLast ? 'text-gray-700' : 'text-gray-500'
                          )}
                        />
                      )}
                      {StatusIcon && (
                        <StatusIcon
                          className={cn(
                            'h-2 w-2',
                            getStatusColor('status' in item ? item.status || 'online' : 'online')
                          )}
                        />
                      )}
                      {'isNew' in item && item.isNew && (
                        <Badge
                          variant="default"
                          className="text-xs bg-green-100 text-green-800 px-1 py-0">
                          New
                        </Badge>
                      )}
                      {'isFeatured' in item && item.isFeatured && (
                        <Badge
                          variant="default"
                          className="text-xs bg-blue-100 text-blue-800 px-1 py-0">
                          Featured
                        </Badge>
                      )}
                      {'isPopular' in item && item.isPopular && (
                        <Badge
                          variant="default"
                          className="text-xs bg-orange-100 text-orange-800 px-1 py-0">
                          Popular
                        </Badge>
                      )}
                    </div>
                    <span
                      className={cn(
                        'truncate',
                        compact ? 'max-w-[80px]' : 'max-w-[120px] sm:max-w-none'
                      )}>
                      {item.label}
                    </span>
                    {'badge' in item && item.badge && (
                      <Badge
                        variant={isLast ? 'default' : 'secondary'}
                        className={cn(
                          'text-xs px-1 py-0',
                          isLast ? 'bg-blue-100 text-blue-800 border-blue-200' : ''
                        )}>
                        {item.badge}
                      </Badge>
                    )}
                    {'rating' in item && item.rating && renderStars(item.rating)}
                    {'price' in item && item.price && (
                      <span className="text-sm font-semibold text-green-600">{item.price}</span>
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ol>
      </div>

      {/* Additional information for detailed view */}
      {detailed && (
        <div className="flex items-center gap-4 text-xs text-gray-500">
          {breadcrumbs[breadcrumbs.length - 1]?.category && (
            <span>Category: {breadcrumbs[breadcrumbs.length - 1].category}</span>
          )}
          {breadcrumbs[breadcrumbs.length - 1]?.rating && (
            <span>Rating: {breadcrumbs[breadcrumbs.length - 1].rating}/5</span>
          )}
          {breadcrumbs[breadcrumbs.length - 1]?.price && (
            <span>Price: {breadcrumbs[breadcrumbs.length - 1].price}</span>
          )}
          {showFileSize && breadcrumbs[breadcrumbs.length - 1]?.fileSize && (
            <span>Size: {breadcrumbs[breadcrumbs.length - 1].fileSize}</span>
          )}
          {showFileDate && breadcrumbs[breadcrumbs.length - 1]?.fileDate && (
            <span>Modified: {formatDate(breadcrumbs[breadcrumbs.length - 1].fileDate!)}</span>
          )}
          {showFileStatus && breadcrumbs[breadcrumbs.length - 1]?.fileStatus && (
            <span>Status: {breadcrumbs[breadcrumbs.length - 1].fileStatus}</span>
          )}
          {showPermissions && breadcrumbs[breadcrumbs.length - 1]?.permissions && (
            <span>Permissions: {breadcrumbs[breadcrumbs.length - 1].permissions}</span>
          )}
        </div>
      )}
    </nav>
  );
};

export { Breadcrumb };
export default Breadcrumb;
