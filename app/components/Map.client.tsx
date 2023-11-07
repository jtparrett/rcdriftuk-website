import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import { styled, Box } from "~/styled-system/jsx";
import { HEADER_TABS } from "./MapHeader";
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
  description?: string;
}[] = [
  {
    name: "Northern Race & Drift (NRD)",
    lat: 53.6727,
    lng: -1.4962,
    tags: [HEADER_TABS.TRACKS],
    image: "/covers/nrd.jpg",
    url: "https://www.facebook.com/groups/1457446027820953",
    description: `Ratrap rc, N.R.D the UKs newest indoor radio control venue, including the uks largest indoor drift track and largest indoor scale area, with detailed play area and car park with high rise road holding weekly meets and competitions, 2nd floor truck meets, weekly rally car meets, dancing riders, and other fun packs all under 1 roof at the venue N.R.D (Northern Race & Drift)

Unit C
Tadman Street
Wakefield
WF1 5QU

Open times are
Wednesday 4-10
Friday 5-late
Saturday 10-late
Sunday 10-6 (only truck meets,4th Sunday)`,
  },
  {
    name: "ScaleDrift - Bracknell",
    lat: 51.42843,
    lng: -0.70941,
    tags: [HEADER_TABS.CLUBS],
    image: "/covers/scaledrift-bracknell.jpg",
    url: "https://www.facebook.com/ScaleDrift/",
    description: `Weekly run club located in Bracknell 📍
See our facebook group for event dates and track rules ✊

Carnation Hall
RG42 7PA`,
  },
  {
    name: "Slide House",
    lat: 52.841,
    lng: -0.1168,
    tags: [HEADER_TABS.TRACKS],
    image: "/covers/slidehouse-logo.jpg",
    url: "https://www.facebook.com/SlideH0use/",
    description: `Seas End Road
Surfleet Seas End
Spalding
PE11 4DQ

Weds and Friday evenings £12
Saturday open days £15`,
  },
  {
    name: "Dori-Style どり風",
    lat: 52.5995,
    lng: -0.2265,
    tags: [HEADER_TABS.CLUBS],
    image: "/covers/dori-style.jpg",
    url: "https://www.facebook.com/groups/627317704727438",
    description: `Poplar Ave
Dogsthorpe
Peterborough
PE1 4QF

Friday nights, 18:30 - 22:30, £10 per session`,
  },
  {
    name: "Lincoln Drift Spot",
    lat: 53.0623,
    lng: -0.3913,
    tags: [HEADER_TABS.TRACKS],
    image: "/covers/lincoln.jpg",
    url: "https://www.facebook.com/groups/driftspotlincoln",
    description: `RC Drift group for Lincoln and the surrounding area.`,
  },
  {
    name: "Drift Therapy",
    lat: 52.4357,
    lng: 1.6592,
    tags: [HEADER_TABS.CLUBS],
    image: "/covers/drift-therapy.jpg",
    url: "https://www.facebook.com/groups/507344574087886",
    description: `Mutford village hall
Mill Road
Mutford
Suffolk
NR347UR

Events posted on Facebook 

Carpet Track - MST Silver dots `,
  },
  {
    name: "A5 drifters",
    lat: 52.6154,
    lng: -1.7019,
    tags: [HEADER_TABS.CLUBS],
    image: "/covers/A5-sliders.jpg",
    url: "https://www.facebook.com/groups/2196772197237222",
    description: `Pop-up PVC tile track once a month in Birch coppice Miners welfare social Club.
Focusing on RWD drift spec cars and using DS LF-5T Control tyre.

Birch coppice miners welfare social Club 
Watling Street Dordon 
Nr tamworth 
B78 1SY 
`,
  },
  {
    name: "Ronin Drift Lounge",
    lat: 52.5666,
    lng: -1.3402,
    tags: [HEADER_TABS.TRACKS],
    image: "/covers/ronin-logo.jpg",
    url: "https://www.facebook.com/groups/2189799561199079",
    description: `Unit 7 The Enterprise Center
Dawson Lane
Barwell
LE98BE

Wednesday 5.30 pm till 10pm
Saturday 9am till 10pm
Sunday 10am till 6pm`,
  },
  {
    name: "Midlands Drift warehouSe",
    lat: 52.7584,
    lng: -2.0681,
    tags: [HEADER_TABS.TRACKS],
    image: "/covers/midlands.jpg",
    url: "https://www.facebook.com/groups/620329222572894",
    description: `Midlands Drift warehouSe
Unit 5, Lower Farm,
Common Lane,
Bednall,
Stafford,
Staffordshire
ST17 OSA

Tuesday 5pm - 10pm is £10, Saturday 9am - 10pm is £15 and Sunday 8am until 5pm is £10`,
  },
  {
    name: "West Suffolk Drift",
    lat: 52.2654,
    lng: 0.6329,
    tags: [HEADER_TABS.CLUBS],
    image: "/covers/west-suffolk.jpg",
    url: "https://www.facebook.com/groups/WestSuffolkDrift",
    description: `Aylmer Close, Risby
Bury St Edmunds
IP28 6RT

Check facebook for events `,
  },
  {
    name: "East Coast RC",
    lat: 51.8884,
    lng: 1.028,
    tags: [HEADER_TABS.CLUBS],
    image: "/covers/east-coast.jpg",
    url: "https://www.facebook.com/eastcoastdriftrc",
  },
  {
    name: "Drift Essex",
    lat: 51.7545,
    lng: -0.0903,
    tags: [HEADER_TABS.CLUBS],
    image: "/covers/essex.jpg",
    url: "https://www.facebook.com/DriftEssex",
    description: `Great Parndon Community Centre,
Abercrombie Way
Harlow
CM18 6YJ

One Saturday a Month dates pinned on Facebook page £15 flat fee all day`,
  },
  {
    name: "Drift Manji",
    lat: 53.7104,
    lng: -1.6923,
    tags: [HEADER_TABS.SHOPS, HEADER_TABS.TRACKS],
    image: "/covers/driftmanji-logo.jpg",
    url: "https://www.driftmanjirc.com",
    description: `Unit 5
Valley road
Liversedge
WF15 6LE
United Kingdom

OPening TBC`,
  },
  {
    name: "Kustom Kulture RC",
    lat: 51.687,
    lng: -3.0221,
    tags: [HEADER_TABS.CLUBS],
    image: "/covers/kustom-kulture.jpg",
    url: "https://www.facebook.com/groups/1555229134898359",
    description: `Panteg Industrial Estate
Station Rd
Griffithstown
Pontypool
NP4 5LX

Wednesday 6pm-1030pm
Saturday 11am-9pm
Sunday 11am-1030pm`,
  },
  {
    name: "Bristol & Bath RC Drift Club (Slide Effects)",
    lat: 51.3307,
    lng: -2.4932,
    tags: [HEADER_TABS.CLUBS],
    image: "/covers/bristol-bath.jpg",
    url: "https://www.facebook.com/groups/313330462158599",
    description: `Unit 8B
Timsbury Workshops
BA2 0HQ`,
  },
  {
    name: "Dorizoku - RC Drift Fife",
    lat: 56.0396,
    lng: -3.4199,
    tags: [HEADER_TABS.CLUBS],
    image: "/covers/dorizoku.jpg",
    url: "https://www.facebook.com/groups/DoriZoku",
  },
  {
    name: "Basingstoke RC Drift Club",
    lat: 51.2587,
    lng: -1.118,
    tags: [HEADER_TABS.CLUBS],
    image: "/covers/baisingstoke.jpg",
    url: "https://www.facebook.com/groups/444725109686604",
  },
  {
    name: "Gloucester RC Drift",
    lat: 51.8237,
    lng: -2.2776,
    tags: [HEADER_TABS.CLUBS],
    image: "/covers/gloucester-rc.jpg",
    url: "https://www.facebook.com/groups/968939443285738",
    description: `Quedgeley
Gloucester

Pop up events on various dates to be advertised via Facebook`,
  },
  {
    name: "Drift Monkeys",
    lat: 51.5543,
    lng: 0.7347,
    tags: [HEADER_TABS.CLUBS],
    image: "/covers/drift-monkeys.jpg",
    url: "https://www.facebook.com/groups/168931554522749",
    description: `Trinity Sports and Social Club`,
  },
  {
    name: "DDRC Dorset Drift Rc Club",
    lat: 50.8306,
    lng: -1.8414,
    tags: [HEADER_TABS.CLUBS],
    image: "/covers/dorset.jpg",
    url: "https://www.facebook.com/groups/386026751596248",
    description: `Braeside Rd,
St Leonards
BH24 2PH

Friday evenings between 7pm - 11pm usually`,
  },
  {
    name: "Ireland R/C Drift Group",
    lat: 52.8555,
    lng: -7.5848,
    tags: [HEADER_TABS.CLUBS],
    image: "/covers/ireland.jpg",
    url: "https://www.facebook.com/groups/361905092288414",
    description: `Rathdowney Community Centre

See Facebook group for details `,
  },
  {
    name: "Initial G",
    lat: 51.3409,
    lng: 0.347,
    tags: [HEADER_TABS.CLUBS],
    url: "https://www.facebook.com/profile.php?id=100091409463427",
    image: "/covers/initial-g.jpg",
    description: `£10 a session
10:00am to 7:00pm`,
  },
  {
    name: "Stockport R.C. Drifters",
    lat: 53.4078,
    lng: -2.147,
    tags: [HEADER_TABS.CLUBS],
    image: "/covers/stockport.jpg",
    url: "https://www.facebook.com/groups/stockportrcdrifters",
    description: `St. Andrews community church hall
35 hall street
stockport SK1 4DA

Friday night 6 till 10`,
  },
  {
    name: "East Yorkshire Drift RC",
    lat: 53.9717,
    lng: -0.281,
    tags: [HEADER_TABS.CLUBS],
    image: "/covers/east-yorkshire.jpg",
    url: "https://www.facebook.com/groups/832029918169926",
    description: `Church St
Kilham
Driffield
YO25 4RG

Once a month, check the Facebook page for details `,
  },
  {
    name: "Slide Nation RC",
    lat: 50.8238,
    lng: -0.3353,
    tags: [HEADER_TABS.CLUBS],
    image: "/covers/slide-nation.jpg",
    url: "https://www.facebook.com/groups/284682895556757",
    description: `Lancing Methodist church
Worthing
BN15 8

Every 2 weeks on a Wednesday evening and every 3rd Sunday.
Prices:
Wednesday eve-
Bring your own car- £10
Sunday all day-
Bring your own car- £15`,
  },
  {
    name: "Salisbury Drift Rc",
    lat: 51.1022,
    lng: -1.7884,
    tags: [HEADER_TABS.CLUBS],
    image: "/covers/salisbury.jpg",
    url: "https://www.facebook.com/groups/249221097726994/",
  },
  {
    name: "East Devon RC Drift Club",
    lat: 50.7784,
    lng: -3.0327,
    tags: [HEADER_TABS.CLUBS],
    image: "/covers/east-devon.jpg",
    url: "https://www.facebook.com/groups/6162578850506613",
  },
  {
    name: "Raceway Drift Club",
    lat: 54.4203,
    lng: -6.4548,
    tags: [HEADER_TABS.CLUBS],
    image: "/covers/racewaydrift.jpg",
    url: "https://www.facebook.com/profile.php?id=100054399164717",
  },
  {
    name: "Zion Drift",
    lat: 53.481,
    lng: -2.5214,
    tags: [HEADER_TABS.CLUBS],
    image: "/covers/zion.jpg",
    url: "https://www.facebook.com/groups/618153696370943/",
  },
  {
    name: "M60 Drifthaus",
    lat: 53.4551,
    lng: -2.1134,
    tags: [HEADER_TABS.CLUBS],
    image: "/covers/m60drifthause.jpg",
    url: "https://www.facebook.com/groups/438502218286994",
  },
  {
    name: "Coolkidz RC",
    lat: 53.4983,
    lng: -2.1034,
    tags: [HEADER_TABS.TRACKS],
    image: "/covers/coolkidzrc.jpg",
    url: "https://www.facebook.com/profile.php?id=100095520391916",
  },
  {
    name: "Drift Dicks",
    lat: 52.2593,
    lng: -7.1101,
    tags: [HEADER_TABS.CLUBS],
    image: "/covers/driftdicks.jpg",
    url: "https://www.facebook.com/profile.php?id=100091093733338",
  },
  {
    name: "Angle Addicts",
    lat: 51.5711,
    lng: 0.6697,
    tags: [HEADER_TABS.CLUBS],
    image: "/covers/angle-addicts.jpg",
    url: "https://www.facebook.com/profile.php?id=61551370445603",
  },

  {
    name: "AsboRC.com",
    lat: 52.6175,
    lng: -1.6446,
    tags: [HEADER_TABS.SHOPS],
    url: "https://www.asborc.com/",
    image: "/covers/asbo.jpg",
    description: `ASBO RC Drift shop
official UK distributors
Sideways RC
yokomo
Skyrc
Topline
Pandora
d like
overdose`,
  },
  {
    name: "RCPace.com",
    lat: 52.2594,
    lng: -0.6674,
    tags: [HEADER_TABS.SHOPS],
    image: "/covers/pace.jpg",
    url: "https://rcpace.com/",
    description: `RCPACE.com is a high-end RC Drift specialist store with world-wide shipping`,
  },
  {
    name: "RCKitOut.com",
    lat: 51.7958,
    lng: -0.0812,
    tags: [HEADER_TABS.SHOPS],
    url: "https://rckitout.com/",
    image: "/covers/rckitout.jpg",
    description: `Your go to RC body builder, we do custom RC shells including custom accessories and paint jobs.`,
  },
  {
    name: "RCModelShopDirect.com",
    lat: 53.7056,
    lng: -1.4019,
    tags: [HEADER_TABS.SHOPS],
    url: "https://rcmodelshopdirect.com/",
    image: "/covers/rcmodelshopdirect.jpg",
    description: `RC Model Shop Direct was set up by a model enthusiast for model enthusiasts. Why? to have fun!`,
  },
];

export const Map = () => {
  const params = useParams();
  const tab = getTabParam(params.tab);

  return (
    <Box
      h="100%"
      position="relative"
      overflow="hidden"
      zIndex={1}
      paddingTop={{ base: 125, md: 75 }}
    >
      <Box h="100%" overflow="hidden" roundedTop="xl">
        <MapContainer
          center={[54.5, -2]}
          style={{ height: "100%" }}
          zoom={6}
          zoomControl
          doubleClickZoom
        >
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
              <Marker
                key={item.name}
                position={[item.lat, item.lng]}
                icon={icon}
              >
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
                    {item.description && (
                      <styled.p
                        mt="0 !important"
                        mb={2}
                        whiteSpace="break-spaces"
                      >
                        {item.description}
                      </styled.p>
                    )}
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
    </Box>
  );
};
