import { createContext, useEffect, type ReactNode } from "react";
import { useUser } from "@clerk/react-router";
import { posthog } from "posthog-js";

interface PostHogContextType {
  posthog: typeof posthog;
}

const PostHogContext = createContext<PostHogContextType | null>(null);

interface PostHogProviderProps {
  children: ReactNode;
  apiKey?: string;
  host?: string;
}

export function PostHogProvider({
  children,
  apiKey,
  host,
}: PostHogProviderProps) {
  const { user } = useUser();

  useEffect(() => {
    // Initialize PostHog on mount
    if (apiKey && host) {
      posthog.init(apiKey, {
        api_host: host,
        defaults: "2025-05-24",
        person_profiles: "identified_only",
        capture_pageview: true,
        capture_pageleave: true,
      });
    }
  }, [apiKey, host]);

  useEffect(() => {
    // Handle user identification
    if (user && posthog) {
      posthog.identify(user.id, {
        email: user.emailAddresses[0]?.emailAddress,
        firstName: user.firstName,
        lastName: user.lastName,
        username: user.username,
        createdAt: user.createdAt,
      });
    } else if (!user && posthog) {
      posthog.reset();
    }
  }, [user]);

  return (
    <PostHogContext.Provider value={{ posthog }}>
      {children}
    </PostHogContext.Provider>
  );
}
