"use client";

import { useState, useCallback, useEffect } from "react";

// Google OAuth Client ID — replace with your own from Google Cloud Console
// https://console.cloud.google.com/apis/credentials
const GOOGLE_CLIENT_ID = "YOUR_CLIENT_ID.apps.googleusercontent.com";
const GOOGLE_API_KEY = "YOUR_API_KEY";
const CALENDAR_SCOPE = "https://www.googleapis.com/auth/calendar.readonly";

export interface GoogleCalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  location?: string;
}

interface UseGoogleCalendarReturn {
  isConnected: boolean;
  events: GoogleCalendarEvent[];
  eventsByDay: Record<number, GoogleCalendarEvent[]>;
  connect: () => Promise<void>;
  disconnect: () => void;
  loading: boolean;
  error: string;
  isConfigured: boolean;
}

export function useGoogleCalendar(): UseGoogleCalendarReturn {
  const [isConnected, setIsConnected] = useState(false);
  const [events, setEvents] = useState<GoogleCalendarEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const isConfigured =
    !GOOGLE_CLIENT_ID.includes("YOUR_CLIENT_ID") &&
    !GOOGLE_API_KEY.includes("YOUR_API_KEY");

  // Check for existing token on mount
  useEffect(() => {
    const token = localStorage.getItem("studyspace_google_token");
    if (token) {
      setIsConnected(true);
    }
  }, []);

  // Load Google API script
  const loadGoogleApi = (): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (typeof window === "undefined") return reject("Not in browser");
      if ((window as any).google?.accounts?.oauth2) return resolve();

      const script = document.createElement("script");
      script.src = "https://accounts.google.com/gsi/client";
      script.onload = () => resolve();
      script.onerror = () => reject("Failed to load Google API");
      document.head.appendChild(script);
    });
  };

  // Load GAPI client for Calendar API
  const loadGapiClient = (): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (typeof window === "undefined") return reject("Not in browser");
      if ((window as any).gapi?.client?.calendar) return resolve();

      const script = document.createElement("script");
      script.src = "https://apis.google.com/js/api.js";
      script.onload = () => {
        const gapi = (window as any).gapi;
        gapi.load("client", async () => {
          try {
            await gapi.client.init({
              apiKey: GOOGLE_API_KEY,
              discoveryDocs: [
                "https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest",
              ],
            });
            resolve();
          } catch (err) {
            reject(err);
          }
        });
      };
      script.onerror = () => reject("Failed to load GAPI");
      document.head.appendChild(script);
    });
  };

  const connect = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      await loadGoogleApi();
      await loadGapiClient();

      const tokenClient = (window as any).google.accounts.oauth2.initTokenClient({
        client_id: GOOGLE_CLIENT_ID,
        scope: CALENDAR_SCOPE,
        callback: async (response: any) => {
          if (response.error) {
            setError(response.error);
            setLoading(false);
            return;
          }

          const token = response.access_token;
          localStorage.setItem("studyspace_google_token", token);
          setIsConnected(true);

          // Fetch events
          await fetchEvents(token);
          setLoading(false);
        },
      });

      tokenClient.requestAccessToken({ prompt: "consent" });
    } catch (err: any) {
      setError(err?.message || "Failed to connect to Google Calendar");
      setLoading(false);
    }
  }, []);

  const fetchEvents = useCallback(async (token?: string) => {
    const accessToken = token || localStorage.getItem("studyspace_google_token");
    if (!accessToken) return;

    try {
      const gapi = (window as any).gapi;
      if (!gapi?.client?.calendar) {
        await loadGapiClient();
      }

      // Calculate current month range
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

      const response = await (window as any).gapi.client.calendar.events.list({
        calendarId: "primary",
        timeMin: startOfMonth.toISOString(),
        timeMax: endOfMonth.toISOString(),
        showDeleted: false,
        singleEvents: true,
        maxResults: 100,
        orderBy: "startTime",
      });

      const items = response.result.items || [];
      const mapped: GoogleCalendarEvent[] = items.map((item: any) => ({
        id: item.id,
        title: item.summary || "Untitled",
        start: item.start?.dateTime || item.start?.date || "",
        end: item.end?.dateTime || item.end?.date || "",
        location: item.location || "",
      }));

      setEvents(mapped);
    } catch (err: any) {
      setError(err?.message || "Failed to fetch calendar events");
    }
  }, []);

  const disconnect = useCallback(() => {
    localStorage.removeItem("studyspace_google_token");
    setIsConnected(false);
    setEvents([]);
  }, []);

  // Group events by day of month
  const eventsByDay: Record<number, GoogleCalendarEvent[]> = {};
  events.forEach((event) => {
    if (!event.start) return;
    const date = new Date(event.start);
    const day = date.getDate();
    if (!eventsByDay[day]) eventsByDay[day] = [];
    eventsByDay[day].push(event);
  });

  return {
    isConnected,
    events,
    eventsByDay,
    connect,
    disconnect,
    loading,
    error,
    isConfigured,
  };
}
