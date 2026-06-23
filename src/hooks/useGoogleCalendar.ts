"use client";

import { useState, useCallback, useEffect, useRef } from "react";

const GOOGLE_CLIENT_ID = "337419547217-io5ke2ja6149mad4e7n31csor5qeq1mu.apps.googleusercontent.com";
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

  const isConfigured = !GOOGLE_CLIENT_ID.includes("YOUR_CLIENT_ID");

  // Fetch events using plain fetch (no GAPI library needed)
  const fetchEvents = useCallback(async (accessToken: string) => {
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
        const body = await res.text();
        console.error("Calendar API error:", res.status, body);
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
    } catch (err: any) {
      console.error("Fetch events error:", err);
      setError(err?.message || "Failed to fetch calendar events");
    }
  }, []);

  // Check for existing token on mount
  useEffect(() => {
    const token = localStorage.getItem("studyspace_google_token");
    if (token) {
      tokenRef.current = token;
      setIsConnected(true);
      fetchEvents(token);
    }
  }, [fetchEvents]);

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

  const connect = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      await loadGoogleScript();

      const tokenClient = (window as any).google.accounts.oauth2.initTokenClient({
        client_id: GOOGLE_CLIENT_ID,
        scope: CALENDAR_SCOPE,
        callback: (response: any) => {
          if (response.error) {
            setError(response.error_description || response.error || "Authorization failed");
            setLoading(false);
            return;
          }

          const token = response.access_token;
          tokenRef.current = token;
          localStorage.setItem("studyspace_google_token", token);
          setIsConnected(true);
          fetchEvents(token);
          setLoading(false);
        },
      });

      tokenClient.requestAccessToken({ prompt: "consent" });
    } catch (err: any) {
      setError(err?.message || "Failed to connect to Google Calendar");
      setLoading(false);
    }
  }, [loadGoogleScript, fetchEvents]);

  const disconnect = useCallback(() => {
    const token = tokenRef.current;
    if (token) {
      // Revoke the token
      fetch(`https://oauth2.googleapis.com/revoke?token=${token}`).catch(() => {});
    }
    localStorage.removeItem("studyspace_google_token");
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
