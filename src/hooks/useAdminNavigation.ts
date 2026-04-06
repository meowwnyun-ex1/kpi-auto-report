import { useNavigate, useLocation } from 'react-router-dom';
import { useCallback, useRef } from 'react';

interface NavigationState {
  fromForm?: boolean;
  returnUrl?: string;
}

const useAdminNavigation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const navigationHistory = useRef<Map<string, NavigationState>>(new Map());

  // Save navigation state before entering a form
  const saveNavigationState = useCallback(
    (returnUrl?: string) => {
      const key = location.pathname;
      navigationHistory.current.set(key, {
        fromForm: true,
        returnUrl: returnUrl || '/admin',
      });
    },
    [location.pathname]
  );

  // Navigate back to the previous page or default
  const navigateBack = useCallback(
    (defaultPath = '/admin') => {
      const key = location.pathname;
      const state = navigationHistory.current.get(key);

      if (state?.returnUrl && state.returnUrl !== location.pathname) {
        navigate(state.returnUrl);
        navigationHistory.current.delete(key);
      } else {
        navigate(defaultPath);
      }
    },
    [navigate, location.pathname]
  );

  // Navigate to form page with state saving
  const navigateToForm = useCallback(
    (formPath: string, returnUrl?: string) => {
      saveNavigationState(returnUrl);
      // Navigate to the correct form path based on the form type
      if (formPath === 'applications') {
        navigate('/admin/applications/add');
      } else if (formPath === 'categories') {
        navigate('/admin/categories/add');
      } else if (formPath === 'banners') {
        navigate('/admin/banners/add');
      } else if (formPath === 'trips') {
        navigate('/admin/trips/add');
      } else {
        navigate(formPath);
      }
    },
    [navigate, saveNavigationState]
  );

  // Check if current page is a form
  const isFormPage = useCallback(() => {
    const pathSegments = location.pathname.split('/');
    return (
      pathSegments.includes('Form') ||
      pathSegments.includes('form') ||
      pathSegments.includes('edit') ||
      pathSegments.includes('add')
    );
  }, [location.pathname]);

  // Get the appropriate return path based on current context
  const getReturnPath = useCallback(() => {
    const pathSegments = location.pathname.split('/');

    // If we're in a form, determine the best return path
    if (isFormPage()) {
      const key = location.pathname;
      const state = navigationHistory.current.get(key);

      if (state?.returnUrl) {
        return state.returnUrl;
      }

      // Default return paths based on form type
      if (pathSegments.includes('applications')) {
        return '/admin/applications';
      } else if (pathSegments.includes('banners')) {
        return '/admin/banners';
      } else if (pathSegments.includes('trips')) {
        return '/admin/trips';
      } else if (pathSegments.includes('categories')) {
        return '/admin/categories';
      }
    }

    return '/admin';
  }, [location.pathname, isFormPage]);

  return {
    saveNavigationState,
    navigateBack,
    navigateToForm,
    isFormPage,
    getReturnPath,
  };
};

export { useAdminNavigation };
export default useAdminNavigation;
