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
import { cn } from '@/lib/utils';

export type ShellSidebarTheme = 'store' | 'admin';

export function NavUser({
  user,
  isAdmin = false,
  theme = 'store',
}: {
  user: {
    name: string;
    email: string;
    avatar: string;
  };
  isAdmin?: boolean;
  theme?: ShellSidebarTheme;
}) {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { toast } = useToast();

  const triggerClass =
    'cursor-pointer rounded-xl border border-gray-200/80 bg-white p-2 text-foreground shadow-sm transition-colors hover:bg-gray-50/80 data-[state=open]:bg-gray-100/60';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <div className={cn('group w-full outline-none', triggerClass)}>
          <div className="flex items-center gap-3">
            <div className="relative shrink-0">
              <Avatar
                className={cn('h-9 w-9 rounded-full border-2 shadow-sm', 'border-background')}>
                <AvatarImage src={user.avatar} alt={user.name} />
                <AvatarFallback
                  className={cn(
                    'rounded-full text-xs font-semibold',
                    'bg-gradient-to-br from-sky-300 to-pink-300 text-sky-950'
                  )}>
                  {user.name
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .toUpperCase()
                    .slice(0, 2)}
                </AvatarFallback>
              </Avatar>
              {isAdmin && (
                <span
                  className={cn(
                    'absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 bg-emerald-500',
                    'border-background'
                  )}
                />
              )}
            </div>
            <div className="min-w-0 flex-1 text-left group-data-[collapsible=icon]:hidden">
              <div className="flex items-center gap-1">
                <span className={cn('truncate text-sm font-semibold', 'text-zinc-900')}>
                  {user.name}
                </span>
                {isAdmin && <Shield className={cn('h-3.5 w-3.5', 'text-indigo-600')} />}
              </div>
              <span
                className={cn(
                  'block truncate text-xs',
                  theme === 'admin' ? 'text-zinc-500' : 'text-zinc-500'
                )}>
                {user.email}
              </span>
            </div>
            <ChevronsUpDown
              className={cn(
                'h-4 w-4 shrink-0 transition-transform group-data-[state=open]:rotate-180 group-data-[collapsible=icon]:hidden',
                'text-zinc-400'
              )}
            />
          </div>
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="min-w-[14rem] max-w-[90vw] rounded-xl border border-gray-200 bg-white shadow-lg"
        side="right"
        align="end"
        sideOffset={6}>
        {!isAdmin ? (
          <DropdownMenuItem
            className="cursor-pointer rounded-lg py-2.5 focus:bg-zinc-100"
            onClick={() => navigate('/admin/login')}>
            <Shield className="mr-2 h-4 w-4 text-indigo-600" />
            <div className="flex flex-col gap-0.5">
              <span className="font-medium">Admin sign-in</span>
              <span className="text-xs text-zinc-500">Open the admin console</span>
            </div>
          </DropdownMenuItem>
        ) : (
          <>
            <DropdownMenuItem
              className="cursor-pointer rounded-lg py-2.5 focus:bg-zinc-100"
              onClick={() => navigate('/admin')}>
              <Shield className="mr-2 h-4 w-4 text-indigo-600" />
              <div className="flex flex-col gap-0.5">
                <span className="font-medium">Dashboard</span>
                <span className="text-xs text-zinc-500">Overview &amp; metrics</span>
              </div>
            </DropdownMenuItem>
            <DropdownMenuItem
              className="cursor-pointer rounded-lg py-2.5 text-red-600 focus:bg-red-50 focus:text-red-700"
              onClick={() => {
                toast({
                  title: 'Signed out',
                  description: 'You have been logged out.',
                  variant: 'default',
                });
                logout();
                navigate('/admin/login');
              }}>
              <LogOut className="mr-2 h-4 w-4" />
              <div className="flex flex-col gap-0.5">
                <span className="font-medium">Log out</span>
                <span className="text-xs text-zinc-500">End admin session</span>
              </div>
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
