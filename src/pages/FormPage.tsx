import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLoading } from '@/contexts/LoadingContext';
import { useToast } from '@/hooks/use-toast';
import { UserApplicationForm } from '@/components/forms';
import { Category } from '@/shared/types';
import { getApiUrl } from '@/config/api';
import { Card, CardContent } from '@/components/ui/card';
import { ShellLayout } from '@/features/shell';
import { Loader2 } from 'lucide-react';
import { TOAST_MESSAGES } from '@/shared/constants';

const FormPage: React.FC = () => {
  const navigate = useNavigate();
  const { showLoading, hideLoading } = useLoading();
  const { toast } = useToast();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const categoriesRes = await fetch(`${getApiUrl()}/categories`);

      if (categoriesRes.ok) {
        const categoriesData = await categoriesRes.json();
        setCategories(categoriesData.data || []);
      } else {
        throw new Error('Failed to fetch categories');
      }
    } catch (error) {
      console.error('Error fetching form data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load form. Please refresh the page.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (formData: FormData) => {
    showLoading();

    try {
      const response = await fetch(`${getApiUrl()}/apps`, {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: TOAST_MESSAGES.APPLICATION_SUBMITTED,
          variant: 'success',
        });
        setTimeout(() => {
          navigate('/');
        }, 2000);
      } else if (response.status >= 500) {
        toast({
          title: 'Server Error',
          description: 'Server error. Please try again later.',
          variant: 'destructive',
        });
      } else {
        try {
          const error = await response.json();
          const errorMessage = error.error || 'Failed to submit application';
          toast({
            title: 'Error',
            description: errorMessage,
            variant: 'destructive',
          });
        } catch {
          toast({
            title: 'Error',
            description: 'Failed to submit application. Please try again.',
            variant: 'destructive',
          });
        }
      }
    } catch (error) {
      console.error('Submit error:', error);
      toast({
        title: 'Network Error',
        description: 'Network error. Please check your connection.',
        variant: 'destructive',
      });
    } finally {
      hideLoading();
    }
  };

  const handleCancel = () => {
    navigate('/');
  };

  if (loading) {
    return (
      <ShellLayout variant="user" showContactWidget={false} showStats>
        <div className="flex w-full items-center justify-center px-4">
          <Card className="rounded-2xl border border-border/80 bg-card/95 shadow-sm ring-1 ring-black/[0.03] backdrop-blur-sm">
            <CardContent className="p-6 sm:p-8 text-center">
              <Loader2 className="mx-auto mb-4 h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Loading form…</p>
            </CardContent>
          </Card>
        </div>
      </ShellLayout>
    );
  }

  return (
    <ShellLayout variant="user" showContactWidget={false} showStats>
      <UserApplicationForm
        categories={categories}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
      />
    </ShellLayout>
  );
};

export default FormPage;
