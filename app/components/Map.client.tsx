import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import { Box, Container, Flex } from "~/styled-system/jsx";
import { Outlet, useNavigate, useParams } from "react-router";
import type { Tracks } from "@prisma/client";
import { Regions, TrackTypes } from "~/utils/enums";
import { Button, LinkButton } from "./Button";
import { oneOf } from "~/utils/oneOf";

export type Values<T> = T[keyof T];

interface Props {
  tracks: Tracks[];
}

const REGION_LOCATIONS = {
  [Regions.ALL]: {
    lat: 52.3555,
    lng: -1,
    zoom: 1,
  },
  [Regions.UK]: {
    lat: 52.3555,
    lng: -1,
    zoom: 6,
  },
  [Regions.EU]: {
    lat: 54,
    lng: 15,
    zoom: 4,
  },
  [Regions.NA]: {
    lat: 39.8,
    lng: -98.6,
    zoom: 3,
  },
  [Regions.APAC]: {
    lat: 35.936876,
    lng: 138.362503,
    zoom: 3,
  },
  [Regions.LATAM]: {
    lat: -14,
    lng: -60,
    zoom: 3,
  },
  [Regions.MEA]: {
    lat: 25,
    lng: 45,
    zoom: 3,
  },
};

export const Map = ({ tracks }: Props) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markers = useRef<mapboxgl.Marker[]>([]);
  const navigate = useNavigate();
  const params = useParams();
  const region =
    oneOf(params.region?.toUpperCase(), Object.values(Regions)) ?? Regions.ALL;

  useEffect(() => {
    if (!mapContainer.current) return;

    mapboxgl.accessToken =
      "pk.eyJ1IjoicmNkcmlmdHVrIiwiYSI6ImNtOXRuenU3bjAxMDEyc3NldWxuMGp0YmEifQ.krploudyX3_F8kmpsaFePw";

    const location = REGION_LOCATIONS[region];

    // Initialize map
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/dark-v11",
      center: [location.lng, location.lat],
      zoom: location.zoom,
    });

    // Add navigation controls
    map.current.addControl(new mapboxgl.NavigationControl(), "top-right");

    // Add markers for each track
    tracks.forEach((track) => {
      // Create marker element
      const el = document.createElement("div");
      el.className = "marker";

      const img = document.createElement("img");
      img.src = track.image;

      el.appendChild(img);

      // Create and add marker
      const marker = new mapboxgl.Marker(el)
        .setLngLat([track.lng, track.lat])
        .addTo(map.current!);

      // Add click handler
      el.addEventListener("click", () => {
        navigate(`./${track.slug}`);
      });

      markers.current.push(marker);
    });

    // Extra markers
    [
      {
        lat: 35.107552,
        lng: 144.032135,
        image: "/zerofeel-source.png",
        href: "https://zerofeel.co.uk",
      },
      {
        lat: 41.71803,
        lng: -132.120209,
        image: "/damn-millenials-source.jpg",
        href: "https://www.instagram.com/damnmillennials.rc",
      },
    ].forEach((data) => {
      // Create marker element
      const el = document.createElement("div");
      el.className = "marker marker--large";

      const img = document.createElement("img");
      img.src = data.image;
      el.appendChild(img);

      const marker = new mapboxgl.Marker(el)
        .setLngLat([data.lng, data.lat])
        .addTo(map.current!);

      el.addEventListener("click", () => {
        window.open(data.href, "_blank");
      });

      markers.current.push(marker);
    });

    // Cleanup
    return () => {
      map.current?.remove();
    };
  }, []);

  useEffect(() => {
    if (!map.current) return;

    const location = REGION_LOCATIONS[region];

    map.current.flyTo({
      center: [location.lng, location.lat],
      zoom: location.zoom,
    });
  }, [region]);

  return (
    <>
      <Box borderBottomWidth={1} borderColor="gray.900">
        <Container px={2} w="full" maxW={1100} overflowX="auto">
          <Flex gap={0.5} py={2}>
            {Object.values(Regions).map((item) => (
              <LinkButton
                key={item}
                px={3}
                flex="none"
                rounded="lg"
                variant={item === region ? "secondary" : "ghost"}
                to={`/map/${item}`}
              >
                {item}
              </LinkButton>
            ))}
          </Flex>
        </Container>
      </Box>

      <Box h="100%" position="relative" overflow="hidden" zIndex={1} flex={1}>
        <Box ref={mapContainer} h="100%" overflow="hidden" />
        <Outlet />
      </Box>
    </>
  );
};
