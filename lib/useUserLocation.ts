// useUserLocation — pega localizacao do dispositivo + reverse geocode
// pra retornar cidade + UF (BR). Pede permissao na primeira chamada;
// se negada, retorna fallback "São Paulo, SP" (mercado principal Ford BR).
// Hook de localizacao com reverse geocode pra exibir nome amigavel.

import { useEffect, useState } from "react";
import * as Location from "expo-location";

export interface UserLocation {
  city: string;
  region: string; // UF, ex "SP", "RJ"
  label: string; // "São Paulo, SP"
  source: "device" | "fallback";
}

const FALLBACK: UserLocation = {
  city: "São Paulo",
  region: "SP",
  label: "São Paulo, SP",
  source: "fallback",
};

function buildLabel(city: string, region: string): string {
  if (city && region) return `${city}, ${region}`;
  if (city) return city;
  if (region) return region;
  return FALLBACK.label;
}

export function useUserLocation() {
  const [location, setLocation] = useState<UserLocation>(FALLBACK);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted" || cancelled) return;
        const position = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Lowest,
        });
        if (cancelled) return;
        const places = await Location.reverseGeocodeAsync({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
        if (cancelled) return;
        const place = places[0];
        if (!place) return;
        const city = place.city ?? place.subregion ?? "";
        const region = place.region ?? "";
        if (!city && !region) return;
        setLocation({
          city,
          region,
          label: buildLabel(city, region),
          source: "device",
        });
      } catch {
        // permissao negada / sem provider / etc — mantem fallback.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return location;
}
