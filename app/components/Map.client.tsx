import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import { styled, Box } from "~/styled-system/jsx";
import { HEADER_TABS } from "./Header";
import { useParams } from "@remix-run/react";
import { getTabParam } from "~/utils/getTabParam";
import { Button } from "./Button";

export type Values<T> = T[keyof T];

const ITEMS: {
  name: string;
  lat: number;
  lng: number;
  image?: string;
  tags: Omit<Values<typeof HEADER_TABS>, "all">[];
}[] = [
  {
    name: "Northern Race & Drift (NRD)",
    lat: 53.6727,
    lng: -1.4962,
    tags: [HEADER_TABS.TRACKS],
    image: "/covers/nrd.png",
  },
  {
    name: "Zeus RC Drift Club",
    lat: 53.4945,
    lng: -2.5096,
    tags: [HEADER_TABS.CLUBS],
    image: "/covers/zeus.png",
  },
  {
    name: "ScaleDrift - Bracknell",
    lat: 51.42843,
    lng: -0.70941,
    tags: [HEADER_TABS.CLUBS],
    image: "/covers/scaledrift.jpg",
  },
  {
    name: "Slide House",
    lat: 52.841,
    lng: -0.1168,
    tags: [HEADER_TABS.TRACKS],
    image: "/covers/slidehouse.png",
  },
  {
    name: "Dori-Style どり風",
    lat: 52.5995,
    lng: -0.2265,
    tags: [HEADER_TABS.CLUBS],
    image: "/covers/dori-style.png",
  },
  {
    name: "Lincoln Drift Spot",
    lat: 53.0623,
    lng: -0.3913,
    tags: [HEADER_TABS.TRACKS],
  },
  {
    name: "Drift Therapy",
    lat: 52.4357,
    lng: 1.6592,
    tags: [HEADER_TABS.CLUBS],
    image: "/covers/drift-therapy.png",
  },
  {
    name: "Fazeley Sliders",
    lat: 52.6154,
    lng: -1.7019,
    tags: [HEADER_TABS.CLUBS],
    image: "/covers/fazeley-sliders.png",
  },
  {
    name: "Ronin Drift Lounge",
    lat: 52.5666,
    lng: -1.3402,
    tags: [HEADER_TABS.TRACKS],
    image: "/covers/ronin.png",
  },
  {
    name: "Midlands Drift warehouSe",
    lat: 52.7584,
    lng: -2.0681,
    tags: [HEADER_TABS.TRACKS],
    image: "/covers/midlands.png",
  },
  {
    name: "West Suffolk Drift",
    lat: 52.2654,
    lng: 0.6329,
    tags: [HEADER_TABS.CLUBS],
    image: "/covers/west-suffolk.png",
  },
  {
    name: "East Coast RC",
    lat: 51.8884,
    lng: 1.028,
    tags: [HEADER_TABS.CLUBS],
    image: "/covers/east-coast.png",
  },
  {
    name: "Drift Essex",
    lat: 51.7545,
    lng: -0.0903,
    tags: [HEADER_TABS.CLUBS],
    image: "/covers/essex.png",
  },
  {
    name: "Drift Manji",
    lat: 53.7104,
    lng: -1.6923,
    tags: [HEADER_TABS.SHOPS, HEADER_TABS.TRACKS],
    image: "/covers/drift-manji.png",
  },
  {
    name: "Kustom Kulture RC",
    lat: 51.687,
    lng: -3.0221,
    tags: [HEADER_TABS.CLUBS],
    image: "/covers/kustom-kulture.png",
  },
  {
    name: "Bristol & Bath RC Drift Club (Slide Effects)",
    lat: 51.3307,
    lng: -2.4932,
    tags: [HEADER_TABS.CLUBS],
    image: "/covers/bristol-bath.png",
  },
  {
    name: "Dorizoku - RC Drift Fife",
    lat: 56.0396,
    lng: -3.4199,
    tags: [HEADER_TABS.CLUBS],
    image: "/covers/dorizoku.png",
  },
  {
    name: "Basingstoke RC Drift Club",
    lat: 51.2587,
    lng: -1.118,
    tags: [HEADER_TABS.CLUBS],
    image: "/covers/baisingstoke.png",
  },
  {
    name: "Gloucester RC Drift",
    lat: 51.8237,
    lng: -2.2776,
    tags: [HEADER_TABS.CLUBS],
    image: "/covers/gloucester.jpg",
  },
  {
    name: "Drift Monkeys",
    lat: 51.5543,
    lng: 0.7347,
    tags: [HEADER_TABS.CLUBS],
    image: "/covers/drift-monkeys.png",
  },
  {
    name: "DDRC Dorset Drift Rc Club",
    lat: 50.8306,
    lng: -1.8414,
    tags: [HEADER_TABS.CLUBS],
    image: "/covers/dorset.png",
  },
  {
    name: "Ireland R/C Drift Group",
    lat: 52.8555,
    lng: -7.5848,
    tags: [HEADER_TABS.CLUBS],
    image: "/covers/ireland.png",
  },
  {
    name: "Initial G",
    lat: 51.3409,
    lng: 0.347,
    tags: [HEADER_TABS.CLUBS],
  },
  {
    name: "Stockport R.C. Drifters",
    lat: 53.4078,
    lng: -2.147,
    tags: [HEADER_TABS.CLUBS],
    image: "/covers/stockport.png",
  },
  {
    name: "East Yorkshire Drift RC",
    lat: 53.9717,
    lng: -0.281,
    tags: [HEADER_TABS.CLUBS],
    image: "/covers/east-yorkshire.png",
  },
  {
    name: "Slide Nation RC",
    lat: 50.8238,
    lng: -0.3353,
    tags: [HEADER_TABS.CLUBS],
    image: "/covers/slide-nation.png",
  },

  {
    name: "Asborc.com",
    lat: 52.6175,
    lng: -1.6446,
    tags: [HEADER_TABS.SHOPS],
  },
  {
    name: "pacerc.com",
    lat: 52.2594,
    lng: -0.6674,
    tags: [HEADER_TABS.SHOPS],
  },
  {
    name: "rckitout.com",
    lat: 51.5781,
    lng: -0.3421,
    tags: [HEADER_TABS.SHOPS],
  },
  {
    name: "rcmodelshopdirect.com",
    lat: 53.7056,
    lng: -1.4019,
    tags: [HEADER_TABS.SHOPS],
  },
];

export const Map = () => {
  const params = useParams();
  const tab = getTabParam(params.tab);

  return (
    <Box h="100%" position="relative" overflow="hidden" zIndex={1}>
      <MapContainer center={[54.5, -2]} style={{ height: "100%" }} zoom={6}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

        {ITEMS.filter((item) => {
          if (tab === HEADER_TABS.ALL) {
            return true;
          }

          return item.tags.includes(tab);
        }).map((item) => {
          return (
            <Marker key={item.name} position={[item.lat, item.lng]}>
              <Popup closeButton>
                <Box minWidth={280} p={4}>
                  {item.image && (
                    <Box mb={2} overflow="hidden" rounded="md">
                      <styled.img src={item.image} />
                    </Box>
                  )}
                  <styled.h1 fontSize="md" fontWeight="bold" mb={2}>
                    {item.name}
                  </styled.h1>
                  <Button w="full">Visit Facebook</Button>
                </Box>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </Box>
  );
};
