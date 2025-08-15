import { useMutation } from "@tanstack/react-query";
import { useAuth } from "@clerk/react-router";
import { useEffect, useRef } from "react";

export const useUpdatePushToken = () => {
  return useMutation({
    mutationFn: async (pushToken: string) => {
      const response = await fetch("/api/user/push-token", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ pushToken }),
      });

      if (!response.ok) {
        throw new Error("Failed to update push token");
      }

      return response.json();
    },
  });
};

export const useExpoPushTokenSync = () => {
  const { userId, isLoaded } = useAuth();
  const updatePushToken = useUpdatePushToken();
  const lastProcessedToken = useRef<string | null>(null);

  useEffect(() => {
    // Only run when auth is loaded and user is authenticated
    if (!isLoaded || !userId) return;

    const processToken = (token: string) => {
      // Skip if we already processed this exact token
      if (!token || token === lastProcessedToken.current) return;

      lastProcessedToken.current = token;
      updatePushToken.mutate(token);
    };

    // Check if token already exists (handles early injection)
    if (window.expoPushToken) {
      processToken(window.expoPushToken);
    }

    // Set up callback for future injection
    window.onExpoPushTokenReady = processToken;

    // Cleanup
    return () => {
      window.onExpoPushTokenReady = undefined;
    };
  }, [userId, isLoaded, updatePushToken]);

  // Reset when user changes
  useEffect(() => {
    lastProcessedToken.current = null;
  }, [userId]);
};

// Type declarations
declare global {
  interface Window {
    expoPushToken?: string;
    onExpoPushTokenReady?: (token: string) => void;
  }
}
