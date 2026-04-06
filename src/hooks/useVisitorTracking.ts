export const useVisitorTracking = () => {
  return {
    trackPageView: () => {},
    trackEvent: () => {},
    trackClick: () => {},
    trackDownload: () => {},
    trackSearch: () => {},
    disableTracking: () => {},
    enableTracking: () => {},
  };
};

export const useAppDownloadTracking = () => {
  return { trackAppDownload: () => {} };
};

export const useSearchTracking = () => {
  return { trackAppSearch: () => {} };
};
