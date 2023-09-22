import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import { styled, Box } from "~/styled-system/jsx";
import { HEADER_TABS } from "./Header";
import { useParams } from "@remix-run/react";
import { getTabParam } from "~/utils/getTabParam";
import { Button, LinkButton } from "./Button";
import L from "leaflet";

export type Values<T> = T[keyof T];

const ITEMS: {
  name: string;
  lat: number;
  lng: number;
  image: string;
  tags: Omit<Values<typeof HEADER_TABS>, "all">[];
  url: string;
}[] = [
  {
    name: "Northern Race & Drift (NRD)",
    lat: 53.6727,
    lng: -1.4962,
    tags: [HEADER_TABS.TRACKS],
    image: "/covers/nrd.png",
    url: "https://www.facebook.com/groups/1457446027820953",
  },
  {
    name: "Zeus RC Drift Club",
    lat: 53.4945,
    lng: -2.5096,
    tags: [HEADER_TABS.CLUBS],
    image: "/covers/zeus.png",
    url: "https://www.facebook.com/groups/zeusrcdriftclubuk",
  },
  {
    name: "ScaleDrift - Bracknell",
    lat: 51.42843,
    lng: -0.70941,
    tags: [HEADER_TABS.CLUBS],
    image: "/covers/scaledrift-bracknell.jpg",
    url: "https://www.facebook.com/ScaleDrift/",
  },
  {
    name: "Slide House",
    lat: 52.841,
    lng: -0.1168,
    tags: [HEADER_TABS.TRACKS],
    image: "/covers/slidehouse.png",
    url: "https://www.facebook.com/SlideH0use/",
  },
  {
    name: "Dori-Style どり風",
    lat: 52.5995,
    lng: -0.2265,
    tags: [HEADER_TABS.CLUBS],
    image: "/covers/dori-style.png",
    url: "https://www.facebook.com/groups/627317704727438",
  },
  {
    name: "Lincoln Drift Spot",
    lat: 53.0623,
    lng: -0.3913,
    tags: [HEADER_TABS.TRACKS],
    image: "/covers/lincoln.jpg",
    url: "https://www.facebook.com/groups/driftspotlincoln",
  },
  {
    name: "Drift Therapy",
    lat: 52.4357,
    lng: 1.6592,
    tags: [HEADER_TABS.CLUBS],
    image: "/covers/drift-therapy.png",
    url: "https://www.facebook.com/groups/507344574087886",
  },
  {
    name: "Fazeley Sliders",
    lat: 52.6154,
    lng: -1.7019,
    tags: [HEADER_TABS.CLUBS],
    image: "/covers/fazeley-sliders.png",
    url: "https://www.facebook.com/groups/2196772197237222",
  },
  {
    name: "Ronin Drift Lounge",
    lat: 52.5666,
    lng: -1.3402,
    tags: [HEADER_TABS.TRACKS],
    image: "/covers/ronin.png",
    url: "https://www.facebook.com/groups/2189799561199079",
  },
  {
    name: "Midlands Drift warehouSe",
    lat: 52.7584,
    lng: -2.0681,
    tags: [HEADER_TABS.TRACKS],
    image: "/covers/midlands.png",
    url: "https://www.facebook.com/groups/620329222572894",
  },
  {
    name: "West Suffolk Drift",
    lat: 52.2654,
    lng: 0.6329,
    tags: [HEADER_TABS.CLUBS],
    image: "/covers/west-suffolk.png",
    url: "https://www.facebook.com/groups/WestSuffolkDrift",
  },
  {
    name: "East Coast RC",
    lat: 51.8884,
    lng: 1.028,
    tags: [HEADER_TABS.CLUBS],
    image: "/covers/east-coast.png",
    url: "https://www.facebook.com/eastcoastdriftrc",
  },
  {
    name: "Drift Essex",
    lat: 51.7545,
    lng: -0.0903,
    tags: [HEADER_TABS.CLUBS],
    image: "/covers/essex.png",
    url: "https://www.facebook.com/DriftEssex",
  },
  {
    name: "Drift Manji",
    lat: 53.7104,
    lng: -1.6923,
    tags: [HEADER_TABS.SHOPS, HEADER_TABS.TRACKS],
    image: "/covers/drift-manji.png",
    url: "https://www.driftmanjirc.com",
  },
  {
    name: "Kustom Kulture RC",
    lat: 51.687,
    lng: -3.0221,
    tags: [HEADER_TABS.CLUBS],
    image: "/covers/kustom-kulture.png",
    url: "https://www.facebook.com/groups/1555229134898359",
  },
  {
    name: "Bristol & Bath RC Drift Club (Slide Effects)",
    lat: 51.3307,
    lng: -2.4932,
    tags: [HEADER_TABS.CLUBS],
    image: "/covers/bristol-bath.png",
    url: "https://www.facebook.com/groups/313330462158599",
  },
  {
    name: "Dorizoku - RC Drift Fife",
    lat: 56.0396,
    lng: -3.4199,
    tags: [HEADER_TABS.CLUBS],
    image: "/covers/dorizoku.png",
    url: "https://www.facebook.com/groups/DoriZoku",
  },
  {
    name: "Basingstoke RC Drift Club",
    lat: 51.2587,
    lng: -1.118,
    tags: [HEADER_TABS.CLUBS],
    image: "/covers/baisingstoke.png",
    url: "https://www.facebook.com/groups/444725109686604",
  },
  {
    name: "Gloucester RC Drift",
    lat: 51.8237,
    lng: -2.2776,
    tags: [HEADER_TABS.CLUBS],
    image: "/covers/gloucester.jpg",
    url: "https://www.facebook.com/groups/968939443285738",
  },
  {
    name: "Drift Monkeys",
    lat: 51.5543,
    lng: 0.7347,
    tags: [HEADER_TABS.CLUBS],
    image: "/covers/drift-monkeys.png",
    url: "https://www.facebook.com/groups/168931554522749",
  },
  {
    name: "DDRC Dorset Drift Rc Club",
    lat: 50.8306,
    lng: -1.8414,
    tags: [HEADER_TABS.CLUBS],
    image: "/covers/dorset.png",
    url: "https://www.facebook.com/groups/386026751596248",
  },
  {
    name: "Ireland R/C Drift Group",
    lat: 52.8555,
    lng: -7.5848,
    tags: [HEADER_TABS.CLUBS],
    image: "/covers/ireland.png",
    url: "https://www.facebook.com/groups/361905092288414",
  },
  {
    name: "Initial G",
    lat: 51.3409,
    lng: 0.347,
    tags: [HEADER_TABS.CLUBS],
    url: "https://www.facebook.com/profile.php?id=100091409463427",
    image: "/covers/initial-g.jpg",
  },
  {
    name: "Stockport R.C. Drifters",
    lat: 53.4078,
    lng: -2.147,
    tags: [HEADER_TABS.CLUBS],
    image: "/covers/stockport.png",
    url: "https://www.facebook.com/groups/stockportrcdrifters",
  },
  {
    name: "East Yorkshire Drift RC",
    lat: 53.9717,
    lng: -0.281,
    tags: [HEADER_TABS.CLUBS],
    image: "/covers/east-yorkshire.png",
    url: "https://www.facebook.com/groups/832029918169926",
  },
  {
    name: "Slide Nation RC",
    lat: 50.8238,
    lng: -0.3353,
    tags: [HEADER_TABS.CLUBS],
    image: "/covers/slide-nation.png",
    url: "https://www.facebook.com/groups/284682895556757",
  },

  {
    name: "AsboRC.com",
    lat: 52.6175,
    lng: -1.6446,
    tags: [HEADER_TABS.SHOPS],
    url: "https://www.asborc.com/",
    image: "/covers/asbo.jpg",
  },
  {
    name: "RCPace.com",
    lat: 52.2594,
    lng: -0.6674,
    tags: [HEADER_TABS.SHOPS],
    image: "/covers/pace.png",
    url: "https://rcpace.com/",
  },
  {
    name: "RCKitOut.com",
    lat: 51.5781,
    lng: -0.3421,
    tags: [HEADER_TABS.SHOPS],
    url: "https://rckitout.com/",
    image: "/covers/rckitout.jpg",
  },
  {
    name: "RCModelShopDirect.com",
    lat: 53.7056,
    lng: -1.4019,
    tags: [HEADER_TABS.SHOPS],
    url: "https://rcmodelshopdirect.com/",
    image: "/covers/rcmodelshopdirect.jpg",
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
          const icon = L.icon({
            iconUrl: item.image,
            iconSize: [50, 50],
            className: "marker",
          });

          return (
            <Marker key={item.name} position={[item.lat, item.lng]} icon={icon}>
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
                  <LinkButton to={item.url} target="_blank" w="full">
                    {item.url.includes("facebook")
                      ? "Visit Facebook"
                      : "Visit Website"}
                  </LinkButton>
                </Box>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </Box>
  );
};
