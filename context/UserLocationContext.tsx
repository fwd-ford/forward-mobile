// UserLocationProvider: cidade selecionada pelo usuario, persistida em
// AsyncStorage. Default Sao Paulo. Consumida pelo Globe (cobe marker)
// e por componentes que mostram a cidade do usuario.
// Provider de localizacao escolhida no Profile, persiste em storage.

import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { CITIES, findCityById, SAO_PAULO, type City } from "@/lib/cities";
import { STORAGE_KEYS } from "@/lib/storage-keys";

interface UserLocationContextValue {
  city: City;
  cities: readonly City[];
  setCity: (city: City) => void;
  isHydrated: boolean;
}

const UserLocationContext = createContext<UserLocationContextValue | undefined>(undefined);

export function UserLocationProvider({ children }: { children: ReactNode }) {
  const [city, setCityState] = useState<City>(SAO_PAULO);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    let cancelled = false;
    AsyncStorage.getItem(STORAGE_KEYS.CITY)
      .then((stored) => {
        if (cancelled || !stored) return;
        const found = findCityById(stored);
        if (found) setCityState(found);
      })
      .finally(() => {
        if (!cancelled) setIsHydrated(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const setCity = useCallback((next: City) => {
    setCityState(next);
    AsyncStorage.setItem(STORAGE_KEYS.CITY, next.id).catch(() => {
      // storage failures should not block UX
    });
  }, []);

  const value = useMemo<UserLocationContextValue>(
    () => ({ city, cities: CITIES, setCity, isHydrated }),
    [city, setCity, isHydrated],
  );

  return (
    <UserLocationContext.Provider value={value}>{children}</UserLocationContext.Provider>
  );
}

export function useUserLocation(): UserLocationContextValue {
  const ctx = useContext(UserLocationContext);
  if (!ctx) {
    throw new Error("useUserLocation must be used inside <UserLocationProvider>");
  }
  return ctx;
}
