"use client";

import { useState, useCallback, useEffect, useRef } from "react";

const GOOGLE_CLIENT_ID = "337419547217-io5ke2ja6149mad4e7n31csor5qeq1mu.apps.googleusercontent.com";
const CALENDAR_SCOPE = "https://www.googleapis.com/auth/calendar.readonly";
const TOKEN_KEY = "studyspace_google_token";
const EVENTS_CACHE_KEY = "studyspace_google_events_cache";

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
  connect: () => void;
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
  const tokenRef = useRef<string | null>(null);
  const tokenClientRef = useRef<any>(null);

  const isConfigured = !GOOGLE_CLIENT_ID.includes("YOUR_CLIENT_ID");

  // Fetch events using plain fetch
  const fetchEvents = useCallback(async (accessToken: string): Promise<boolean> => {
    try {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

      const url = `https://www.googleapis.com/calendar/v3/calendars/primary/events?` +
        `timeMin=${encodeURIComponent(startOfMonth.toISOString())}` +
        `&timeMax=${encodeURIComponent(endOfMonth.toISOString())}` +
        `&singleEvents=true` +
        `&maxResults=100` +
        `&orderBy=startTime`;

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (!res.ok) {
        if (res.status === 401) {
          // Token expired — caller should re-auth
          return false;
        }
        throw new Error(`Calendar API returned ${res.status}`);
      }

      const data = await res.json();
      const items = data.items || [];

      const mapped: GoogleCalendarEvent[] = items.map((item: any) => ({
        id: item.id,
        title: item.summary || "Untitled",
        start: item.start?.dateTime || item.start?.date || "",
        end: item.end?.dateTime || item.end?.date || "",
        location: item.location || "",
      }));

      setEvents(mapped);
      setError(""); // clear any previous error

      // Cache events in localStorage so they survive token expiry
      try {
        localStorage.setItem(EVENTS_CACHE_KEY, JSON.stringify(mapped));
      } catch {}

      return true;
    } catch (err: any) {
      console.error("Fetch events error:", err);
      setError(err?.message || "Failed to fetch calendar events");
      return false;
    }
  }, []);

  // Load Google Identity Services script
  const loadGoogleScript = useCallback((): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (typeof window === "undefined") return reject("Not in browser");
      if ((window as any).google?.accounts?.oauth2) return resolve();

      const script = document.createElement("script");
      script.src = "https://accounts.google.com/gsi/client";
      script.onload = () => resolve();
      script.onerror = () => reject("Failed to load Google API script");
      document.head.appendChild(script);
    });
  }, []);

  // Initialize token client (used for both initial auth and silent re-auth)
  const ensureTokenClient = useCallback(async () => {
    await loadGoogleScript();

    if (!tokenClientRef.current) {
      tokenClientRef.current = (window as any).google.accounts.oauth2.initTokenClient({
        client_id: GOOGLE_CLIENT_ID,
        scope: CALENDAR_SCOPE,
        callback: () => {}, // Will be overridden per-request
      });
    }

    return tokenClientRef.current;
  }, [loadGoogleScript]);

  // Silently refresh token (no popup if already authorized)
  const refreshToken = useCallback(async (): Promise<string | null> => {
    try {
      const client = await ensureTokenClient();

      return new Promise<string | null>((resolve) => {
        client.callback = (response: any) => {
          if (response.error) {
            resolve(null);
            return;
          }
          const token = response.access_token;
          tokenRef.current = token;
          localStorage.setItem(TOKEN_KEY, token);
          resolve(token);
        };

        // prompt: "" means no popup if user already authorized
        client.requestAccessToken({ prompt: "" });
      });
    } catch {
      return null;
    }
  }, [ensureTokenClient]);

  // On mount: try to restore session + cached events
  useEffect(() => {
    // Load cached events immediately (shows something while checking token)
    try {
      const cached = localStorage.getItem(EVENTS_CACHE_KEY);
      if (cached) {
        setEvents(JSON.parse(cached));
      }
    } catch {}

    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) return;

    // We have a token — set as connected and try to fetch
    tokenRef.current = token;
    setIsConnected(true);

    (async () => {
      const success = await fetchEvents(token);
      if (!success) {
        // Token expired — try silent refresh
        const newToken = await refreshToken();
        if (newToken) {
          await fetchEvents(newToken);
        }
        // If refresh fails too, keep cached events visible
      }
    })();
  }, [fetchEvents, refreshToken]);

  // Initial connect (with popup)
  const connect = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const client = await ensureTokenClient();

      client.callback = async (response: any) => {
        if (response.error) {
          setError(response.error_description || response.error || "Authorization failed");
          setLoading(false);
          return;
        }

        const token = response.access_token;
        tokenRef.current = token;
        localStorage.setItem(TOKEN_KEY, token);
        setIsConnected(true);
        await fetchEvents(token);
        setLoading(false);
      };

      client.requestAccessToken({ prompt: "consent" });
    } catch (err: any) {
      setError(err?.message || "Failed to connect to Google Calendar");
      setLoading(false);
    }
  }, [ensureTokenClient, fetchEvents]);

  const disconnect = useCallback(() => {
    const token = tokenRef.current;
    if (token) {
      fetch(`https://oauth2.googleapis.com/revoke?token=${token}`).catch(() => {});
    }
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(EVENTS_CACHE_KEY);
    tokenRef.current = null;
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
