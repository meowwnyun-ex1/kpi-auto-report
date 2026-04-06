import LoginForm from '@/components/forms/loginForm';
import { ShellLayout } from '@/features/shell';
import { Target, TrendingUp, BarChart3, PieChart } from 'lucide-react';

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
            {/* KPI Branding */}
            <div className="flex flex-col items-center justify-center space-y-8">
              <div className="text-center">
                <h1 className="text-5xl font-bold bg-gradient-to-r from-sky-600 to-pink-600 bg-clip-text text-transparent">
                  KPI Auto Report
                </h1>
                <p className="mt-4 text-xl text-sky-700/80">ระบบรายงานตัวชี้วัดอัตโนมัติ</p>
              </div>

              {/* KPI Icons */}
              <div className="flex items-center justify-center gap-8">
                <div className="flex flex-col items-center">
                  <div className="rounded-full bg-sky-500/20 p-4">
                    <Target className="h-8 w-8 text-sky-600" />
                  </div>
                  <span className="mt-2 text-sm text-sky-700">Safety</span>
                </div>
                <div className="flex flex-col items-center">
                  <div className="rounded-full bg-green-500/20 p-4">
                    <TrendingUp className="h-8 w-8 text-green-600" />
                  </div>
                  <span className="mt-2 text-sm text-green-700">Quality</span>
                </div>
                <div className="flex flex-col items-center">
                  <div className="rounded-full bg-pink-500/20 p-4">
                    <BarChart3 className="h-8 w-8 text-pink-600" />
                  </div>
                  <span className="mt-2 text-sm text-pink-700">Delivery</span>
                </div>
                <div className="flex flex-col items-center">
                  <div className="rounded-full bg-purple-500/20 p-4">
                    <PieChart className="h-8 w-8 text-purple-600" />
                  </div>
                  <span className="mt-2 text-sm text-purple-700">Cost</span>
                </div>
              </div>
            </div>
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
