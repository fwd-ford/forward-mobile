// Cidades BR pra picker de localizacao no Profile. Cada cidade tem
// coords pro globo (cobe markers) e labels pt-BR. Lista nao exaustiva —
// 10 capitais/centros principais cobrindo todas as regioes.

export interface City {
  id: string;
  name: string;
  region: string; // UF
  lat: number;
  lng: number;
  label: string; // "Cidade, UF"
}

function makeCity(id: string, name: string, region: string, lat: number, lng: number): City {
  return { id, name, region, lat, lng, label: `${name}, ${region}` };
}

export const SAO_PAULO: City = makeCity("sao_paulo", "São Paulo", "SP", -23.55, -46.63);

export const CITIES: readonly City[] = [
  SAO_PAULO,
  makeCity("rio_de_janeiro", "Rio de Janeiro", "RJ", -22.91, -43.17),
  makeCity("belo_horizonte", "Belo Horizonte", "MG", -19.92, -43.94),
  makeCity("brasilia", "Brasília", "DF", -15.78, -47.93),
  makeCity("curitiba", "Curitiba", "PR", -25.43, -49.27),
  makeCity("porto_alegre", "Porto Alegre", "RS", -30.03, -51.23),
  makeCity("salvador", "Salvador", "BA", -12.97, -38.5),
  makeCity("fortaleza", "Fortaleza", "CE", -3.73, -38.52),
  makeCity("recife", "Recife", "PE", -8.05, -34.9),
  makeCity("manaus", "Manaus", "AM", -3.13, -60.02),
];

export function findCityById(id: string): City | undefined {
  return CITIES.find((c) => c.id === id);
}
