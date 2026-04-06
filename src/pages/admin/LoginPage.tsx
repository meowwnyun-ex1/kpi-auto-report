import LoginForm from '@/components/forms/loginForm';
import TripCarousel from '@/components/features/TripCarousel';
import { ShellLayout } from '@/features/shell';

export default function LoginPage() {
  return (
    <ShellLayout variant="minimal" showSidebar={false} showHeader={false}>
      <div className="flex h-full min-h-0 flex-1 overflow-hidden">
        <div className="relative hidden w-2/3 flex-col items-center justify-center overflow-hidden lg:flex">
          <div
            className="absolute inset-0 bg-gradient-to-br from-sky-100/90 via-pink-50/60 to-sky-50/80"
            aria-hidden
          />
          <div
            className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_30%_20%,rgba(135,206,250,0.25),transparent_50%)]"
            aria-hidden
          />
          <div
            className="absolute inset-0 bg-[radial-gradient(ellipse_60%_80%_at_70%_80%,rgba(255,182,193,0.2),transparent_50%)]"
            aria-hidden
          />
          <div className="relative z-[1] w-full px-8">
            <TripCarousel />
          </div>
        </div>

        <div className="flex w-full flex-1 items-center justify-center overflow-y-auto bg-white px-4 py-10 sm:px-6 lg:w-1/3 lg:py-8">
          <div className="w-full max-w-sm">
            <LoginForm />
          </div>
        </div>
      </div>
    </ShellLayout>
  );
}
