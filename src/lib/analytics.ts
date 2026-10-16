import posthog from 'posthog-js';

const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY;
const POSTHOG_HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com';

let isPostHogInitialized = false;

export const initAnalytics = () => {
  if (typeof window === 'undefined') return;

  if (POSTHOG_KEY && POSTHOG_KEY !== 'phc_demo_key_resumatch' && !isPostHogInitialized) {
    try {
      posthog.init(POSTHOG_KEY, {
        api_host: POSTHOG_HOST,
        capture_pageview: true,
        autocapture: true,
        person_profiles: 'identified_only',
      });
      isPostHogInitialized = true;
    } catch (e) {
      console.warn('PostHog initialization skipped:', e);
    }
  }
};

export const trackEvent = (eventName: string, properties?: Record<string, unknown>) => {
  if (typeof window === 'undefined') return;

  // Log in dev environment for easy verification
  if (process.env.NODE_ENV === 'development') {
    console.log(`[Analytics Event: ${eventName}]`, properties || {});
  }

  if (isPostHogInitialized) {
    try {
      posthog.capture(eventName, properties);
    } catch (e) {
      console.warn(`Failed to capture ${eventName}:`, e);
    }
  }
};
