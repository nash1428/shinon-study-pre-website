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
  eventsByDate: Record<string, GoogleCalendarEvent[]>;
  connect: () => void;
  disconnect: () => void;
  loading: boolean;
  error: string;
  isConfigured: boolean;
  fetchForMonth: (year: number, month: number) => void;
}

export function useGoogleCalendar(): UseGoogleCalendarReturn {
  const [isConnected, setIsConnected] = useState(false);
  const [events, setEvents] = useState<GoogleCalendarEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const tokenRef = useRef<string | null>(null);
  const tokenClientRef = useRef<any>(null);

  const isConfigured = !GOOGLE_CLIENT_ID.includes("YOUR_CLIENT_ID");

  // Fetch events for a specific month range
  const fetchEventsForMonth = useCallback(async (accessToken: string, year: number, month: number): Promise<boolean> => {
    try {
      const startOfMonth = new Date(year, month, 1);
      const endOfMonth = new Date(year, month + 1, 0, 23, 59, 59);

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
        if (res.status === 401) return false;
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
      setError("");

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

  const ensureTokenClient = useCallback(async () => {
    await loadGoogleScript();
    if (!tokenClientRef.current) {
      tokenClientRef.current = (window as any).google.accounts.oauth2.initTokenClient({
        client_id: GOOGLE_CLIENT_ID,
        scope: CALENDAR_SCOPE,
        callback: () => {},
      });
    }
    return tokenClientRef.current;
  }, [loadGoogleScript]);

  const refreshToken = useCallback(async (): Promise<string | null> => {
    try {
      const client = await ensureTokenClient();
      return new Promise<string | null>((resolve) => {
        client.callback = (response: any) => {
          if (response.error) { resolve(null); return; }
          const token = response.access_token;
          tokenRef.current = token;
          localStorage.setItem(TOKEN_KEY, token);
          resolve(token);
        };
        client.requestAccessToken({ prompt: "" });
      });
    } catch { return null; }
  }, [ensureTokenClient]);

  useEffect(() => {
    try {
      const cached = localStorage.getItem(EVENTS_CACHE_KEY);
      if (cached) setEvents(JSON.parse(cached));
    } catch {}

    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) return;

    tokenRef.current = token;
    setIsConnected(true);

    const now = new Date();
    (async () => {
      const success = await fetchEventsForMonth(token, now.getFullYear(), now.getMonth());
      if (!success) {
        const newToken = await refreshToken();
        if (newToken) await fetchEventsForMonth(newToken, now.getFullYear(), now.getMonth());
      }
    })();
  }, [fetchEventsForMonth, refreshToken]);

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
        const now = new Date();
        await fetchEventsForMonth(token, now.getFullYear(), now.getMonth());
        setLoading(false);
      };
      client.requestAccessToken({ prompt: "consent" });
    } catch (err: any) {
      setError(err?.message || "Failed to connect to Google Calendar");
      setLoading(false);
    }
  }, [ensureTokenClient, fetchEventsForMonth]);

  const disconnect = useCallback(() => {
    const token = tokenRef.current;
    if (token) fetch(`https://oauth2.googleapis.com/revoke?token=${token}`).catch(() => {});
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(EVENTS_CACHE_KEY);
    tokenRef.current = null;
    setIsConnected(false);
    setEvents([]);
  }, []);

  // Fetch events for a specific month (called when user navigates)
  const fetchForMonth = useCallback((year: number, month: number) => {
    if (!isConnected) return;
    const token = tokenRef.current || localStorage.getItem(TOKEN_KEY);
    if (!token) return;

    (async () => {
      const success = await fetchEventsForMonth(token, year, month);
      if (!success) {
        const newToken = await refreshToken();
        if (newToken) await fetchEventsForMonth(newToken, year, month);
      }
    })();
  }, [isConnected, fetchEventsForMonth, refreshToken]);

  // Group events by date string (YYYY-MM-DD)
  const eventsByDate: Record<string, GoogleCalendarEvent[]> = {};
  events.forEach((event) => {
    if (!event.start) return;
    const date = new Date(event.start);
    const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
    if (!eventsByDate[key]) eventsByDate[key] = [];
    eventsByDate[key].push(event);
  });

  return {
    isConnected,
    events,
    eventsByDate,
    connect,
    disconnect,
    loading,
    error,
    isConfigured,
    fetchForMonth,
  };
}
