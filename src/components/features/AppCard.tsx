import { getApiUrl } from '@/config/api';
import { Image } from '@/components/ui/Image';
import { getImageProps } from '@/shared/utils';
import { cn } from '@/lib/utils';
import { Application } from '@/shared/types';

interface AppCardProps {
  app: Application;
  onClick?: () => void;
  rank?: number;
  index?: number;
}

export function AppCard({ app, onClick, rank }: AppCardProps) {
  const iconStandard = getImageProps('APP_ICON_LARGE');
  const hotStandard = getImageProps('HOT_BADGE');

  const handleAppClick = () => {
    // Increment view count when app is opened
    fetch(`${getApiUrl()}/stats/views/${app.id}`, { method: 'POST' }).catch(() => {});

    if (onClick) {
      onClick();
    } else if (app.url) {
      window.open(app.url, '_blank', 'noopener,noreferrer');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleAppClick();
    }
  };

  const isTop3 = rank !== undefined && rank >= 1 && rank <= 3;

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={`${app.name}${isTop3 ? `, top ${rank}` : ''}`}
      className={cn(
        'group relative flex aspect-square w-full cursor-pointer flex-col items-center justify-center rounded-2xl border border-sky-100/90 bg-white p-3 shadow-sm ring-1 ring-pink-100/30 transition-[border-color,box-shadow,transform] duration-200',
        'hover:border-pink-200/90 hover:shadow-[0_8px_28px_-6px_rgba(186,230,253,0.55)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-200/80 focus-visible:ring-offset-2',
        'active:scale-[0.99]'
      )}
      onClick={handleAppClick}
      onKeyDown={handleKeyDown}>
      {isTop3 && (
        <div className="absolute right-2 top-2 z-10">
          <Image
            {...hotStandard}
            src="/hot.png"
            alt="Popular"
            fallbackType="hot"
            className={cn(hotStandard.className, 'h-8 w-8 drop-shadow sm:h-9 sm:w-9')}
          />
        </div>
      )}

      <div className="flex flex-col items-center gap-1.5 w-full">
        <div className="flex w-full max-w-[4rem] flex-1 items-center justify-center">
          {app.image_thumbnail || app.image_small || app.image_path ? (
            <Image
              {...iconStandard}
              src={app.image_thumbnail || app.image_small || app.image_path}
              alt=""
              fallbackType="error"
              className={cn(
                iconStandard.className,
                'h-full w-full transition-transform duration-200 group-hover:scale-105'
              )}
            />
          ) : (
            <div className="flex aspect-square w-full items-center justify-center rounded-xl bg-gradient-to-br from-sky-50 to-pink-50 text-2xl">
              📱
            </div>
          )}
        </div>
        <p
          className="w-full truncate text-center text-xs font-semibold leading-tight text-sky-900/85 transition-colors group-hover:text-sky-950"
          title={app.name}>
          {app.name}
        </p>
      </div>
    </div>
  );
}
