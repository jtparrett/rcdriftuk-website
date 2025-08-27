import { RiMapPin2Fill, RiSearch2Line, RiArrowDownSLine } from "react-icons/ri";
import { LinkButton } from "~/components/Button";
import { styled, Container, Flex, Box } from "~/styled-system/jsx";
import { useDisclosure } from "~/utils/useDisclosure";
import type { Route } from "./+types/getting-started";
import { Link } from "react-router";

export const meta: Route.MetaFunction = () => {
  return [
    {
      title: "RC Drift UK | Getting Started | A Beginner's Guide",
    },
    {
      name: "description",
      content: "Welcome to the exciting world of RC drifting!",
    },
    {
      property: "og:image",
      content: "https://rcdrift.uk/getting-started.png",
    },
  ];
};

const H1 = styled("h1", {
  base: {
    fontSize: "4xl",
    fontWeight: "extrabold",
    textWrap: "balance",
    lineHeight: 1.1,
  },
});

const H2 = styled("h2", {
  base: {
    fontSize: "2xl",
    fontWeight: "extrabold",
    textWrap: "balance",
    textAlign: "left",
  },
});

const UL = styled("ul", {
  base: {
    listStyle: "initial",
    paddingLeft: 4,
    color: "gray.400",
  },
});

const P = styled("p", {
  base: {
    color: "gray.400",
    marginTop: 2,
  },
});

const LI = styled("li", {
  base: {
    marginTop: 2,
  },
});

const STRONG = styled("strong", {
  base: {
    fontWeight: "bold",
    color: "white",
  },
});

const Card = styled("div", {
  base: {
    borderWidth: 1,
    borderColor: "gray.800",
    rounded: "xl",
    overflow: "hidden",
    bgColor: "gray.900",
  },
});

const CardHeader = styled("button", {
  base: {
    w: "full",
    p: 6,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    cursor: "pointer",
    _hover: {
      md: {
        bgColor: "gray.800",
      },
    },
  },
});

const CardContent = styled("div", {
  base: {
    p: 6,
    borderTopWidth: 1,
    borderColor: "gray.800",
  },
});

const Options = ({ items }: { items: string[] }) => {
  return (
    <UL color="brand.500">
      {items.map((item) => (
        <LI key={item} _hover={{ textDecoration: "underline" }}>
          <Link
            to={`/marketplace?query=${item.replace(" - ", " ")}`}
            target="_blank"
          >
            {item}
          </Link>
        </LI>
      ))}
    </UL>
  );
};

interface CollapsibleCardProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

const CollapsibleCard = ({
  title,
  children,
  defaultOpen = false,
}: CollapsibleCardProps) => {
  const disclosure = useDisclosure(defaultOpen);

  return (
    <Card>
      <CardHeader onClick={disclosure.toggle}>
        <H2>{title}</H2>
        <Box
          transform={disclosure.isOpen ? "rotate(180deg)" : "none"}
          transition="transform 0.2s"
          color="gray.400"
        >
          <RiArrowDownSLine size={24} />
        </Box>
      </CardHeader>
      {disclosure.isOpen && <CardContent>{children}</CardContent>}
    </Card>
  );
};

const GettingStartedPage = () => {
  return (
    <styled.main
      bgColor="black"
      css={{
        background: `
          linear-gradient(180deg,
            rgba(236, 26, 85, 0.05) 0%,
            rgba(236, 26, 85, 0.02) 20%,
            rgba(0, 0, 0, 1) 100%
          )
        `,
      }}
    >
      <Box
        pos="relative"
        zIndex={1}
        _after={{
          content: '""',
          display: "block",
          pos: "absolute",
          inset: 0,
          bgGradient: "to-b",
          gradientFrom: "transparent",
          gradientVia: { base: "transparent", md: "transparent 40%" },
          gradientTo: "black",
          zIndex: -1,
        }}
      >
        <Container maxW={800} px={2} pt={8} pb={20}>
          <Box textAlign="center" mb={12}>
            <H1>Getting Started in RC Drifting: A Beginner's Guide</H1>
            <P maxW={600} mx="auto" mt={4} textWrap="balance">
              Welcome to the exciting world of RC drifting! We're here to help
              you start your drifting journey. Whether you're a complete novice
              or have some RC experience, this guide will provide you with
              everything you need to know to begin. RC drifting combines skill,
              precision, and style, making it a thrilling and rewarding hobby.
            </P>
          </Box>

          <Flex flexDir="column" gap={8}>
            <CollapsibleCard title="Step 1: Find Your Local Track" defaultOpen>
              <P>
                The first and most crucial step in getting started with RC
                drifting is to find your local track. This is where you'll
                practice, meet fellow enthusiasts, and participate in events.
                Here's how to locate your nearest track:
              </P>

              <P>
                <STRONG>Visit our map:</STRONG> Our website has a comprehensive
                list of all the RC drifting events, tracks, clubs, and shops
                across the world.
              </P>

              <P>
                Once you find a local track, don't hesitate to talk to people
                there. The RC drifting community is usually very welcoming and
                eager to help newcomers. You can gain valuable insights, tips,
                and even hands-on assistance with setting up your car.
              </P>

              <Box mt={4}>
                <LinkButton to="/map/all" target="_blank">
                  <RiMapPin2Fill /> Find my local track
                </LinkButton>
              </Box>
            </CollapsibleCard>

            <CollapsibleCard title="Step 2: Choose Your Chassis">
              <P>
                Once you’ve found your local RC drift track and chatted with a
                few people there (maybe even test-driven some cars), you’ll be
                ready to choose your starting point: the chassis.
              </P>

              <P>
                The chassis is the foundation of your RC drift car — it holds
                everything together and plays a big role in how your car
                performs and feels on track. Below are some recommended chassis
                options, listed from most affordable to most advanced:
              </P>

              <Options
                items={[
                  "3Racing - Sakura D6",
                  "MST - RMX 2.5",
                  "Yokomo - RD2.0",
                  "MST - RMX 2.5s",
                  "MST - MRXs",
                  "Reve D - RDX",
                  "MST - RMXex S pro",
                  "TEAM ASSOCIATED - DC10",
                  "MST - FRX RS",
                  "Overdose - Galm V2+",
                  "Yokomo - SD3.0",
                  "Yokomo - MD2.0",
                ]}
              />

              <P>
                If you're looking for more affordable options, try searching
                your preferred marketplaces for these used chassis: MST RMX 2.0,
                MST FMX or FF, Yokomo YD-2, or Rhino Racing Shark.
              </P>
            </CollapsibleCard>

            <CollapsibleCard title="Step 3: Select an Electronic Speed Controller (ESC)">
              <P>
                Now you've got the chassis, you'll need to choose an Electronic
                Speed Controller (ESC). The ESC is the brain of your car — it
                controls the power and speed of your motor. It determines how
                smooth and responsive your car's throttle is. Here are some
                options in order of price:
              </P>

              <Options
                items={[
                  "Hobbywing - 10BL120 G2",
                  "SkyRC - Toro 120",
                  "SkyRC - Toro 160",
                  "Hobbywing - XD10",
                  "Acuvance - RAD",
                  "Elceram - oxide",
                  "Yokomo - R100",
                  "Furitek - slidetech",
                  "Maclan - MDP",
                  "Elceram - nitride",
                  "Acuvance - xarvis XX",
                  "Reve D - Breve",
                  "Yokomo - RPXii",
                ]}
              />
            </CollapsibleCard>

            <CollapsibleCard title="Step 4: Pick Your Motor">
              <P>
                The motor is the heart of your RC car, providing the power
                needed for drifting. A good motor ensures you have the right
                balance of speed and torque.
              </P>

              <P>
                For RC drifting, you'll need a sensored brushless motor. The
                most commonly used options are 10.5T and 13.5T, which offer
                great performance and throttle control.
              </P>

              <P>Here are some options in order of price:</P>

              <Options
                items={[
                  "Hobbywing - 3650 G2",
                  "SurpassHobby - rocket thunder",
                  "SKY RC - Ares",
                  "Yokomo - Zero S",
                  "Hobbywing - D10",
                  "Yokomo - type T or type R",
                  "Reve D - absolute1",
                  "Acuvance - agile",
                  "Acuvance - fledge",
                ]}
              />
            </CollapsibleCard>

            <CollapsibleCard title="Step 5: Choose Your Servo">
              <P>
                The servo controls your car's steering, making it a key part of
                how your car feels on track. In RC drifting, it's not just about
                how fast a servo is — it's about how precise and consistent the
                steering is throughout its movement.
              </P>

              <P>
                A high-quality servo gives you better control and smoother
                steering response, which helps when making fine adjustments
                mid-drift. In some cases, a slightly slower or more damped servo
                can actually give you more grip and stability, especially during
                long, sweeping transitions.
              </P>

              <P>
                More advanced servos also offer tuning options such as end-point
                adjustment, speed curves, and torque settings — allowing you to
                customize the steering feel to match your driving style and
                setup.
              </P>

              <P>Here are some servo options, listed from budget to premium:</P>

              <Options
                items={[
                  "AGFRC - A50bhl",
                  "Yeah racing - hackagear",
                  "OMG - falcon",
                  "OMG - Predator",
                  "OMG - Cougar",
                  "Reve D - RS-ST",
                  "Power HD - TDS",
                  "Power HD - R15",
                  "Yokomo - sp02d V2",
                  "Reve D - RS-ST pro",
                  "Yokomo - sp03d V2",
                  "Futaba - CT702",
                ]}
              />
            </CollapsibleCard>

            <CollapsibleCard title="Step 6: Select Your Gyro">
              <P>
                A gyro is a small electronic device that helps keep your car
                stable while drifting. It works by automatically adjusting the
                steering to counteract sudden changes in direction — similar to
                how a real driver would correct oversteer or understeer in a
                drift - and yes, you 100% need one for RWD RC Drifting.
              </P>

              <P>
                In simple terms, it makes your car feel more controlled and
                predictable, especially when you're just starting out. A good
                gyro helps smooth out your driving and lets you focus more on
                your throttle and line.
              </P>

              <P>
                Here are some popular gyro options, listed from most affordable
                to premium:
              </P>

              <Options
                items={[
                  "Onisiki - fukuro",
                  "OMG - V1",
                  "Onisiki - daruma",
                  "OMG - V3",
                  "Power HD - G1",
                  "Power HD - G2",
                  "OMG - V6",
                  "Yokomo - V4",
                  "Futaba - GYD470",
                  "Reve D - revox",
                  "Futaba - GYD560",
                ]}
              />
            </CollapsibleCard>

            <CollapsibleCard title="Step 7: Choose Your Transmitter and Receiver (Tx/Rx)">
              <P>
                Your transmitter (Tx) and receiver (Rx) are what allow you to
                control your RC drift car. The transmitter is the radio
                controller you hold in your hands, and the receiver is the unit
                inside your car that picks up those signals.
              </P>

              <P>
                A good Tx/Rx setup ensures precise, responsive, and reliable
                control, which is especially important in drifting where small
                inputs make a big difference. Entry-level setups are great for
                getting started, but more expensive systems offer greater
                tunability — letting you fine-tune steering sensitivity,
                throttle response, and other settings to suit your driving
                style.
              </P>

              <P>
                Here are some recommended Tx/Rx setups, listed from entry-level
                to high-end:
              </P>

              <Options
                items={[
                  "Flysky - GT3",
                  "Dumbo RC - DDR-350",
                  "Flysky - GT-5",
                  "Sanwa - Mx-6",
                  "Futaba - T3pv",
                  "Sanwa - MTV",
                  "Flysky - Noble NB4+",
                  "Futaba - T4pm",
                  "Sanwa - MT-5/MT-44",
                  "Futaba - T6pv",
                  "Sanwa - M17",
                  "Futaba - 10px",
                ]}
              />
            </CollapsibleCard>

            <CollapsibleCard title="Step 8: Get Your Battery and Charger">
              <P>
                You'll need a 7.4V hard case LiPo battery (usually labeled as
                2S) and a LiPo balance charger. This type of battery delivers
                the right amount of power for RC drifting, while the balance
                charger ensures it's charged safely and evenly across both
                cells.
              </P>

              <P>
                Most RC drift chassis are designed to fit a “shorty” LiPo
                battery — a compact 2S pack that's lighter and more balanced for
                drifting. These are the most commonly used and compatible with
                the majority of modern chassis.
              </P>

              <P>
                Before purchasing, check your ESC (electronic speed controller)
                manual to make sure it supports 2S LiPo batteries — using the
                wrong type can damage your electronics.
              </P>

              <P>
                And for safety, always use a LiPo-safe charging bag when
                charging or storing your battery. LiPo batteries can be
                dangerous if mishandled, so proper care is essential.
              </P>
            </CollapsibleCard>

            <CollapsibleCard title="Where to buy?">
              <P>
                For all your RC drifting needs, there are several great places
                to find parts, electronics, and complete setups — whether you're
                buying new or second-hand.
              </P>

              <P>
                You can browse our online marketplace, which brings together
                trusted RC drift shops from around the world in one easy-to-use
                place. It’s a great way to compare prices, check availability,
                and discover new gear.
              </P>

              <Box mt={4}>
                <LinkButton
                  to="/marketplace"
                  variant="secondary"
                  target="_blank"
                >
                  <RiSearch2Line /> Find Parts
                </LinkButton>
              </Box>

              <P>
                If you're on a budget or looking for used parts, Facebook
                Marketplace, local RC groups, and forums can be excellent
                resources. You might also find hidden gems at your local hobby
                shop, where you can get advice and hands-on support.
              </P>

              <P>
                No matter where you shop, be sure to check compatibility and ask
                questions if you're unsure — the RC drift community is usually
                more than happy to help.
              </P>
            </CollapsibleCard>

            <CollapsibleCard title="Conclusion">
              <P>
                Starting with RC drifting is an exciting journey. By finding
                your local track first, you'll gain valuable insights and
                support from the community. Talking to experienced drifters at
                the track can provide you with tips, advice, and help with
                setting up your car. From there, selecting the right equipment
                tailored to your budget will help you get on track with ease.
                Happy drifting!
              </P>

              <P>
                Special thanks to Marcus Anderson for helping to put this guide
                together 🫶
              </P>
            </CollapsibleCard>
          </Flex>
        </Container>
      </Box>
    </styled.main>
  );
};

export default GettingStartedPage;
