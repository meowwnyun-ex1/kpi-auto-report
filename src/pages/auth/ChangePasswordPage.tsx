import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShellLayout } from '@/features/shell';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { storage } from '@/shared/utils';
import { KeyRound, Loader2, Mail, ArrowLeft } from 'lucide-react';

export default function ChangePasswordPage() {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetting, setResetting] = useState(false);
  const [step, setStep] = useState<'request' | 'verify' | 'reset'>('request');

  const handleRequestOtp = async () => {
    if (!isAuthenticated) {
      toast({
        title: 'Login Required',
        description: 'Please login to change your password',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/auth/request-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${storage.getAuthToken()}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        toast({
          title: 'OTP Sent',
          description: `Verification code sent to ${user?.email}`,
        });
        setOtpSent(true);
        setStep('verify');
      } else {
        toast({ title: 'Error', description: data.message, variant: 'destructive' });
      }
    } catch (error) {
      toast({
        title: 'Connection Error',
        description: 'Unable to send OTP. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp || otp.length !== 6) {
      toast({
        title: 'Invalid OTP',
        description: 'Please enter a 6-digit verification code',
        variant: 'destructive',
      });
      return;
    }

    setVerifying(true);
    try {
      const response = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${storage.getAuthToken()}`,
        },
        body: JSON.stringify({ otp }),
      });

      const data = await response.json();
      if (data.success) {
        toast({
          title: 'OTP Verified',
          description: 'Verification successful. Please set a new password.',
        });
        setStep('reset');
      } else {
        toast({
          title: 'OTP Failed',
          description: data.message || 'Unable to verify code',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Connection Error',
        description: 'Unable to verify code. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setVerifying(false);
    }
  };

  const handleResetPassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      toast({
        title: 'Error',
        description: 'Password must be at least 6 characters',
        variant: 'destructive',
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: 'Passwords Do Not Match',
        description: 'Passwords do not match. Please try again.',
        variant: 'destructive',
      });
      return;
    }

    setResetting(true);
    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${storage.getAuthToken()}`,
        },
        body: JSON.stringify({ new_password: newPassword, otp }),
      });

      const data = await response.json();
      if (data.success) {
        toast({
          title: 'Password Changed',
          description: 'Your password has been changed successfully. Please login again.',
        });
        navigate('/');
      } else {
        toast({ title: 'Error', description: data.message, variant: 'destructive' });
      }
    } catch (error) {
      toast({
        title: 'Connection Error',
        description: 'Unable to reset password. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setResetting(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <ShellLayout variant="admin">
        <div className="flex items-center justify-center h-[50vh]">
          <Card className="w-full max-w-md">
            <CardContent className="pt-6 text-center">
              <KeyRound className="h-12 w-12 mx-auto text-red-500 mb-4" />
              <h2 className="text-xl font-semibold">Login Required</h2>
              <p className="text-muted-foreground">Please login to change your password.</p>
              <Button className="mt-4" onClick={() => navigate('/login')}>
                Go to Login
              </Button>
            </CardContent>
          </Card>
        </div>
      </ShellLayout>
    );
  }

  return (
    <ShellLayout variant="admin">
      <div className="flex items-center justify-center min-h-[80vh]">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <KeyRound className="h-6 w-6 text-blue-600" />
            </div>
            <CardTitle>Change Password</CardTitle>
            <CardDescription>
              {step === 'request' && 'Request an OTP to verify your identity'}
              {step === 'verify' && 'Enter the 6-digit code sent to your email'}
              {step === 'reset' && 'Enter your new password'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {step === 'request' && (
              <>
                <div className="bg-muted p-4 rounded-lg text-center">
                  <Mail className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">OTP will be sent to:</p>
                  <p className="font-medium">{user?.email}</p>
                </div>
                <Button className="w-full" onClick={handleRequestOtp} disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Sending OTP...
                    </>
                  ) : (
                    'Request OTP'
                  )}
                </Button>
              </>
            )}

            {step === 'verify' && (
              <>
                <div className="space-y-2">
                  <Label>Enter 6-digit OTP</Label>
                  <Input
                    type="text"
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                    placeholder="000000"
                    className="text-center text-2xl tracking-widest"
                  />
                  <p className="text-xs text-muted-foreground text-center">
                    Code expires in 5 minutes
                  </p>
                </div>
                <Button className="w-full" onClick={handleVerifyOtp} disabled={verifying}>
                  {verifying ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    'Verify OTP'
                  )}
                </Button>
                <Button variant="ghost" className="w-full" onClick={() => setStep('request')}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Resend OTP
                </Button>
              </>
            )}

            {step === 'reset' && (
              <>
                <div className="space-y-2">
                  <Label>New Password</Label>
                  <Input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Confirm Password</Label>
                  <Input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                  />
                </div>
                <Button className="w-full" onClick={handleResetPassword} disabled={resetting}>
                  {resetting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Resetting...
                    </>
                  ) : (
                    'Change Password'
                  )}
                </Button>
              </>
            )}

            <Button variant="outline" className="w-full" onClick={() => navigate('/')}>
              Cancel
            </Button>
          </CardContent>
        </Card>
      </div>
    </ShellLayout>
  );
}
