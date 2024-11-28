import type { MetaFunction } from "@remix-run/node";
import { RiMapPin2Fill, RiSearch2Line, RiArrowDownSLine } from "react-icons/ri";
import { LinkButton } from "~/components/Button";
import { styled, Container, Flex, Box } from "~/styled-system/jsx";
import { useDisclosure } from "~/utils/useDisclosure";

export const meta: MetaFunction = () => {
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
    fontWeight: "black",
    textWrap: "balance",
  },
});

const H2 = styled("h2", {
  base: {
    fontSize: "2xl",
    fontWeight: "black",
    textWrap: "balance",
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
      bgColor: "gray.800",
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
        <H2 my={0}>{title}</H2>
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
            <P fontSize="lg" maxW={600} mx="auto" mt={4}>
              Welcome to the exciting world of RC drifting! At RCDrift.uk, we're
              here to help you start your drifting journey. Whether you're a
              complete novice or have some RC experience, this guide will
              provide you with everything you need to know to begin. RC drifting
              combines skill, precision, and style, making it a thrilling and
              rewarding hobby.
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
                <STRONG>Visit the RCDrift.uk map:</STRONG> Our website has a
                comprehensive list of all the RC drifting events, tracks, clubs,
                and shops across the UK.
              </P>

              <Box mt={4}>
                <LinkButton to="/map/all" target="_blank">
                  <RiMapPin2Fill /> Find your local track
                </LinkButton>
              </Box>

              <P>
                Once you find a local track, don't hesitate to talk to people
                there. The RC drifting community is usually very welcoming and
                eager to help newcomers. You can gain valuable insights, tips,
                and even hands-on assistance with setting up your car.
              </P>
            </CollapsibleCard>

            <CollapsibleCard title="Step 2: Choose Your Chassis">
              <P>
                Your chassis is the foundation of your RC drift car. It holds
                all the components together and affects how your car handles.
                Here are some recommendations:
              </P>
              <UL>
                <LI>
                  <STRONG>Budget-Friendly Options:</STRONG>
                  <UL>
                    <LI>
                      <STRONG>3racing Sakura D5mr V2:</STRONG> £110 (A good
                      starter, though not the best in terms of performance)
                    </LI>
                    <LI>
                      <STRONG>MST RMX 2.0 or 2.5 Classic:</STRONG> £130
                    </LI>
                  </UL>
                </LI>
                <LI>
                  <STRONG>Mid-Range Options:</STRONG>
                  <UL>
                    <LI>
                      <STRONG>MST RMX 2.0 or 2.5S:</STRONG> £190
                    </LI>
                    <LI>
                      <STRONG>Yokomo YD2/RD1.0:</STRONG> £150-220
                    </LI>
                  </UL>
                </LI>
                <LI>
                  <STRONG>High-End Options:</STRONG>
                  <UL>
                    <LI>
                      <STRONG>Yokomo RD2.0</STRONG>
                    </LI>
                    <LI>
                      <STRONG>Reve D RDX:</STRONG> £240 (Best in class)
                    </LI>
                  </UL>
                </LI>
              </UL>
            </CollapsibleCard>

            <CollapsibleCard title="Step 3: Select Your Electronic Speed Controller (ESC)">
              <P>
                Your ESC controls the power and speed of your motor. It
                determines how smooth and responsive your car's throttle is.
                Here are some options based on your budget:
              </P>
              <UL>
                <LI>
                  <STRONG>Budget Option:</STRONG>
                  <UL>
                    <LI>
                      <STRONG>Hobbywing 10bl120:</STRONG> £50
                    </LI>
                  </UL>
                </LI>
                <LI>
                  <STRONG>Mid-Range Options:</STRONG>
                  <UL>
                    <LI>
                      <STRONG>SkyRC Toro 120a ESC:</STRONG> £120
                    </LI>
                    <LI>
                      <STRONG>OMG Polaris:</STRONG> £120
                    </LI>
                  </UL>
                </LI>
                <LI>
                  <STRONG>High-End Options:</STRONG>
                  <UL>
                    <LI>
                      <STRONG>Hobbywing XD10 Pro:</STRONG> £140-150
                    </LI>
                    <LI>
                      <STRONG>Acuvance RAD:</STRONG> £170
                    </LI>
                    <LI>
                      <STRONG>Acuvance Xarvis XX:</STRONG> £220
                    </LI>
                    <LI>
                      <STRONG>Reve D Breve:</STRONG> £250
                    </LI>
                  </UL>
                </LI>
              </UL>
            </CollapsibleCard>

            <CollapsibleCard title="Step 4: Pick Your Motor">
              <P>
                The motor is the heart of your RC car, providing the power
                needed for drifting. A good motor ensures you have the right
                balance of speed and torque. You'll need a sensored brushless
                motor, either 10.5t or 13.5t. Here are some options:
              </P>
              <UL>
                <LI>
                  <STRONG>Budget Option:</STRONG>
                  <UL>
                    <LI>Any sensored brushless motor: £50</LI>
                  </UL>
                </LI>
                <LI>
                  <STRONG>Other Options:</STRONG>
                  <UL>
                    <LI>
                      <STRONG>Hobbywing Quickrun:</STRONG> £50
                    </LI>
                    <LI>
                      <STRONG>Onisiki:</STRONG> £55
                    </LI>
                    <LI>
                      <STRONG>SkyRC Ares:</STRONG> £70
                    </LI>
                    <LI>
                      <STRONG>Reve D Absolute:</STRONG> £100
                    </LI>
                    <LI>
                      <STRONG>Hobbywing D10:</STRONG> £100
                    </LI>
                    <LI>
                      <STRONG>Acuvance Agile:</STRONG> £120
                    </LI>
                    <LI>
                      <STRONG>Acuvance Fledge:</STRONG> £160
                    </LI>
                  </UL>
                </LI>
              </UL>
            </CollapsibleCard>

            <CollapsibleCard title="Step 5: Choose Your Servo">
              <P>
                The servo controls the steering of your car. A responsive and
                precise servo is essential for maintaining control during
                drifts. Here are some recommended options:
              </P>
              <UL>
                <LI>
                  <STRONG>Budget Option:</STRONG>
                  <UL>
                    <LI>
                      <STRONG>OMG Low Profile:</STRONG> £35
                    </LI>
                  </UL>
                </LI>
                <LI>
                  <STRONG>Mid-Range Options:</STRONG>
                  <UL>
                    <LI>
                      <STRONG>Onisiki:</STRONG> £55
                    </LI>
                    <LI>
                      <STRONG>Reve D RS-ST:</STRONG> £60
                    </LI>
                    <LI>
                      <STRONG>OMG Predator:</STRONG> £60
                    </LI>
                  </UL>
                </LI>
                <LI>
                  <STRONG>High-End Option:</STRONG>
                  <UL>
                    <LI>
                      <STRONG>Yokomo SP03D:</STRONG> £130
                    </LI>
                  </UL>
                </LI>
              </UL>
            </CollapsibleCard>

            <CollapsibleCard title="Step 6: Select Your Gyro">
              <P>
                A gyro helps stabilize your car, making it easier to drift by
                correcting oversteer and understeer. Here are some options:
              </P>
              <UL>
                <LI>
                  <STRONG>Budget Option:</STRONG>
                  <UL>
                    <LI>
                      <STRONG>Onisiki:</STRONG> £35-40
                    </LI>
                  </UL>
                </LI>
                <LI>
                  <STRONG>Other Options:</STRONG>
                  <UL>
                    <LI>
                      <STRONG>OMG V3/V4:</STRONG> £40-50
                    </LI>
                    <LI>
                      <STRONG>Power HD G1:</STRONG> £60
                    </LI>
                    <LI>
                      <STRONG>Yokomo V4:</STRONG> £70
                    </LI>
                    <LI>
                      <STRONG>Reve D Revox:</STRONG> £90
                    </LI>
                  </UL>
                </LI>
              </UL>
            </CollapsibleCard>

            <CollapsibleCard title="Step 7: Choose Your Transmitter and Receiver (Tx/Rx)">
              <P>
                Your Tx/Rx setup is crucial for controlling your car. A good
                transmitter and receiver ensure precise and reliable
                communication between you and your car. Here are some options
                based on your budget:
              </P>
              <UL>
                <LI>
                  <STRONG>Budget Options:</STRONG>
                  <UL>
                    <LI>
                      <STRONG>Flysky or Absima:</STRONG> £40-70
                    </LI>
                  </UL>
                </LI>
                <LI>
                  <STRONG>Mid-Range Options:</STRONG>
                  <UL>
                    <LI>
                      <STRONG>Sanwa MX-6:</STRONG> £85
                    </LI>
                    <LI>
                      <STRONG>Futaba T3PV:</STRONG> £100
                    </LI>
                  </UL>
                </LI>
                <LI>
                  <STRONG>High-End Options:</STRONG>
                  <UL>
                    <LI>
                      <STRONG>Flysky Noble NB4:</STRONG> £180
                    </LI>
                    <LI>
                      <STRONG>Sanwa MT-5:</STRONG> £270
                    </LI>
                    <LI>
                      <STRONG>Futaba T4PM:</STRONG> £240
                    </LI>
                  </UL>
                </LI>
              </UL>
            </CollapsibleCard>

            <CollapsibleCard title="Step 8: Get Your Battery and Charger">
              <P>
                You'll need a 7.4v hard case LiPo battery and a LiPo balance
                charger. These ensure your car has enough power and that your
                battery is charged safely. Also, don't forget a battery safe bag
                for safe charging and storage.
              </P>
            </CollapsibleCard>

            <CollapsibleCard title="Step 9: Customize with a Bodyshell">
              <P>
                Finally, choose a bodyshell of your choice to personalize your
                RC drift car. This is where you can get creative and make your
                car stand out on the track.
              </P>
            </CollapsibleCard>

            <CollapsibleCard title="Where to buy?">
              <P>
                For all your RC drifting needs, check out our comprehensive
                online catalogue featuring all of the major shops form across
                the UK:
              </P>

              <Box mt={4}>
                <LinkButton to="/catalogue" variant="secondary" target="_blank">
                  <RiSearch2Line /> Find Parts
                </LinkButton>
              </Box>
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
