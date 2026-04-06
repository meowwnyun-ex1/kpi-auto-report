'use client';

import { useNavigate } from 'react-router-dom';
import { ChevronsUpDown, LogOut, Shield } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function NavUser({
  user,
  isAdmin = false,
}: {
  user: {
    name: string;
    email: string;
    avatar: string;
  };
  isAdmin?: boolean;
}) {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { toast } = useToast();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <div className="data-[state=open]:bg-gradient-to-r data-[state=open]:from-blue-50 data-[state=open]:to-cyan-50 data-[state=open]:text-blue-900 hover:bg-gradient-to-r hover:from-blue-50 hover:to-cyan-50 hover:text-blue-800 cursor-pointer transition-all duration-200 rounded-lg p-2 shadow-sm border border-gray-200/50 group-data-[collapsible=icon]:p-1.5">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Avatar className="h-8 w-8 rounded-full border-2 border-white shadow-sm">
                <AvatarImage src={user.avatar} alt={user.name} />
                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-full font-semibold text-sm">
                  {user.name
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .toUpperCase()
                    .slice(0, 2)}
                </AvatarFallback>
              </Avatar>
              {isAdmin && (
                <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
              )}
            </div>
            <div className="flex-1 text-left min-w-0 group-data-[collapsible=icon]:hidden">
              <div className="flex items-center gap-1">
                <span className="truncate font-semibold text-gray-900 text-sm">{user.name}</span>
                {isAdmin && <Shield className="w-3 h-3 text-blue-600" />}
              </div>
              <span className="truncate text-xs text-gray-600 block">{user.email}</span>
            </div>
            <ChevronsUpDown className="size-4 text-gray-600 transition-transform duration-200 group-data-[state=open]:rotate-180 group-data-[collapsible=icon]:hidden" />
          </div>
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-full min-w-[14rem] max-w-[90vw] rounded-lg shadow-lg border-gray-200/60 bg-white/95 backdrop-blur-sm"
        side="right"
        align="end"
        sideOffset={4}>
        {!isAdmin ? (
          <DropdownMenuItem
            className="text-gray-700 hover:bg-gradient-to-r hover:from-blue-50 hover:to-cyan-50 hover:text-blue-900 transition-all duration-200 rounded-md"
            onClick={() => navigate('/admin/login')}>
            <Shield className="mr-3 h-4 w-4 text-blue-600" />
            <div className="flex flex-col">
              <span className="font-medium">Login Admin</span>
              <span className="text-xs text-gray-500">Access admin panel</span>
            </div>
          </DropdownMenuItem>
        ) : (
          <>
            <DropdownMenuItem
              className="text-gray-700 hover:bg-gradient-to-r hover:from-blue-50 hover:to-cyan-50 hover:text-blue-900 transition-all duration-200 rounded-md mb-1"
              onClick={() => navigate('/admin')}>
              <Shield className="mr-3 h-4 w-4 text-blue-600" />
              <div className="flex flex-col">
                <span className="font-medium">Admin Panel</span>
                <span className="text-xs text-gray-500">Go to dashboard</span>
              </div>
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-red-600 hover:bg-gradient-to-r hover:from-red-50 hover:to-pink-50 hover:text-red-900 transition-all duration-200 rounded-md"
              onClick={() => {
                // Simple logout without session validation since this is user-initiated
                toast({
                  title: 'Logged Out',
                  description: 'You have been successfully logged out.',
                  variant: 'default',
                });
                logout();
                navigate('/admin/login');
              }}>
              <LogOut className="mr-3 h-4 w-4" />
              <div className="flex flex-col">
                <span className="font-medium">Logout</span>
                <span className="text-xs text-gray-500">Sign out of admin</span>
              </div>
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
