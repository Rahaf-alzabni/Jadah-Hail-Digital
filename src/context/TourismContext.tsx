import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { initCsrf, getMe, login as apiLogin, logout as apiLogout } from '@/api/auth';
import { getEvents } from '@/api/events';
import { toggleFavorite as apiToggleFavorite } from '@/api/favorites';
import { createReview, getReviews, getPlaces, getRoutes } from '@/api/tourism';
import {
  mapEvent,
  mapPlace,
  mapReview,
  mapRoute,
  type UIAttraction,
  type UIEvent,
  type UIReview,
  type UIRoute,
} from '@/lib/mappers';

interface TourismContextValue {
  attractions: UIAttraction[];
  events: UIEvent[];
  routes: UIRoute[];
  reviews: UIReview[];
  loading: boolean;
  error: string | null;
  user: { username: string } | null;
  refresh: () => Promise<void>;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  toggleFavorite: (placeId: number) => Promise<void>;
  submitReview: (placeId: number, rating: number, comment: string) => Promise<void>;
  getPlaceReviews: (placeId: number) => UIReview[];
}

const TourismContext = createContext<TourismContextValue | null>(null);

export function TourismProvider({ children, lang }: { children: ReactNode; lang?: string }) {
  const [attractions, setAttractions] = useState<UIAttraction[]>([]);
  const [events, setEvents] = useState<UIEvent[]>([]);
  const [routes, setRoutes] = useState<UIRoute[]>([]);
  const [reviews, setReviews] = useState<UIReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<{ username: string } | null>(null);
  const ar = lang === 'ar';

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [placesData, eventsData, routesData, reviewsData] = await Promise.all([
        getPlaces(),
        getEvents({ upcoming: true }),
        getRoutes(),
        getReviews(),
      ]);

      setAttractions(placesData.map(mapPlace));
      setEvents(eventsData.map(mapEvent));
      setRoutes(routesData.map(mapRoute));
      setReviews(reviewsData.map((r) => mapReview(r, ar)));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [ar]);

  useEffect(() => {
    initCsrf()
      .then(() => getMe())
      .then((me) => {
        if (me.authenticated && me.username) {
          setUser({ username: me.username });
        }
      })
      .catch(() => undefined)
      .finally(() => loadData());
  }, [loadData]);

  const login = useCallback(async (username: string, password: string) => {
    const me = await apiLogin(username, password);
    if (me.username) {
      setUser({ username: me.username });
    }
    await loadData();
  }, [loadData]);

  const logout = useCallback(async () => {
    await apiLogout();
    setUser(null);
    await loadData();
  }, [loadData]);

  const toggleFavorite = useCallback(async (placeId: number) => {
    if (!user) {
      throw new Error('login_required');
    }
    const result = await apiToggleFavorite(placeId);
    setAttractions((prev) =>
      prev.map((p) => (p.id === placeId ? { ...p, isFavorited: result.is_favorited } : p)),
    );
  }, [user]);

  const submitReview = useCallback(async (placeId: number, rating: number, comment: string) => {
    if (!user) {
      throw new Error('login_required');
    }
    const review = await createReview({ tourist_place: placeId, rating, comment });
    setReviews((prev) => [mapReview(review, ar), ...prev]);
    await loadData();
  }, [user, loadData, ar]);

  const getPlaceReviews = useCallback(
    (placeId: number) => reviews.filter((r) => r.placeId === placeId),
    [reviews],
  );

  const value = useMemo(
    () => ({
      attractions,
      events,
      routes,
      reviews,
      loading,
      error,
      user,
      refresh: loadData,
      login,
      logout,
      toggleFavorite,
      submitReview,
      getPlaceReviews,
    }),
    [
      attractions,
      events,
      routes,
      reviews,
      loading,
      error,
      user,
      loadData,
      login,
      logout,
      toggleFavorite,
      submitReview,
      getPlaceReviews,
    ],
  );

  return <TourismContext.Provider value={value}>{children}</TourismContext.Provider>;
}

export function useTourism() {
  const ctx = useContext(TourismContext);
  if (!ctx) {
    throw new Error('useTourism must be used within TourismProvider');
  }
  return ctx;
}
