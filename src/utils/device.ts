// src/utils/device.ts

import React from 'react';

/**
 * Detects if the current device is a mobile device based on:
 * - User agent string
 * - Screen width
 * - Touch capability
 */
export function isMobileDevice(): boolean {
  // Check if we're in a browser environment
  if (typeof window === 'undefined') {
    return false;
  }

  // Check user agent for mobile patterns
  const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
  const mobileRegex = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i;
  
  // Check if user agent matches mobile patterns
  const isMobileUserAgent = mobileRegex.test(userAgent);
  
  // Check screen width (mobile typically <= 768px)
  const isMobileWidth = window.innerWidth <= 768;
  
  // Check for touch capability (though this can be present on laptops too)
  const hasTouchScreen = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  
  // Consider it mobile if user agent indicates mobile OR (narrow screen AND touch)
  return isMobileUserAgent || (isMobileWidth && hasTouchScreen);
}

/**
 * Hook to detect mobile device with reactive updates on window resize
 */
export function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = React.useState(() => isMobileDevice());

  React.useEffect(() => {
    const handleResize = () => {
      setIsMobile(isMobileDevice());
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return isMobile;
}
