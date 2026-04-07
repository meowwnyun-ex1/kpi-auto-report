import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Eye, EyeOff, Lock, User, AlertCircle, Loader2, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ERROR_MESSAGES, LOADING_MESSAGES } from '@/shared/constants';

function LoginForm() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (!username.trim() || !password.trim()) {
        setError('Please enter both username and password.');
        setIsLoading(false);
        return;
      }

      const result = await login(username, password);

      if (result.success) {
        // Check for stored redirect destination
        const redirectTo = sessionStorage.getItem('adminRedirectTo');
        sessionStorage.removeItem('adminRedirectTo');
        navigate(redirectTo || '/admin');
      } else {
        // Use user-friendly error messages
        const errorMessage = result.error?.toLowerCase().includes('invalid')
          ? ERROR_MESSAGES.INVALID_CREDENTIALS
          : result.error?.toLowerCase().includes('expired')
            ? ERROR_MESSAGES.SESSION_EXPIRED
            : result.error?.toLowerCase().includes('disabled')
              ? ERROR_MESSAGES.ACCOUNT_DISABLED
              : result.error || ERROR_MESSAGES.INVALID_CREDENTIALS;
        setError(errorMessage);
      }
    } catch (err) {
      setError(ERROR_MESSAGES.NETWORK_ERROR);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full">
      <div className="mb-8 text-center">
        <img src="/DENSO_LOGO.png" alt="KPI Auto Report" className="mx-auto h-12 sm:h-14" />
        <p className="mt-3 text-sm text-muted-foreground">Admin sign-in</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div
            role="alert"
            className="flex items-center gap-3 rounded-xl border border-destructive/25 bg-destructive/5 p-3 text-destructive">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <p className="text-sm">{error}</p>
          </div>
        )}

        <div className="space-y-2">
          <label htmlFor="username" className="block text-sm font-medium text-foreground">
            Username
          </label>
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <User className="h-5 w-5 text-primary" />
            </div>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="h-11 w-full rounded-xl border border-input bg-muted/40 py-2 pl-10 pr-4 text-foreground transition-colors placeholder:text-muted-foreground focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
              placeholder="Enter username"
              autoComplete="username"
              disabled={isLoading}
            />
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="password" className="block text-sm font-medium text-foreground">
            Password
          </label>
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <Lock className="h-5 w-5 text-muted-foreground" />
            </div>
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-11 w-full rounded-xl border border-input bg-muted/40 py-2 pl-10 pr-11 text-foreground transition-colors placeholder:text-muted-foreground focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
              placeholder="Enter password"
              autoComplete="current-password"
              disabled={isLoading}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground transition-colors hover:text-foreground"
              tabIndex={-1}>
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
        </div>

        <Button type="submit" disabled={isLoading} className="h-11 w-full rounded-xl">
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>{LOADING_MESSAGES.AUTHENTICATING}</span>
            </>
          ) : (
            'Sign In'
          )}
        </Button>

        <Button
          type="button"
          variant="secondary"
          onClick={() => navigate('/')}
          className="h-11 w-full rounded-xl">
          <Home className="h-5 w-5" />
          <span>Home</span>
        </Button>
      </form>

      <p className="mt-6 text-center text-xs text-muted-foreground">
        © 2026 App Design & Development by Thammaphon C. (SDM)
      </p>
    </div>
  );
}

export default LoginForm;
export { LoginForm };
