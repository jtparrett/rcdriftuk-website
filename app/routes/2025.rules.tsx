import { Container, Stack, styled } from "~/styled-system/jsx";
import type { MetaFunction } from "@remix-run/node";
import { CollapsibleCard } from "~/components/CollapsibleCard";

export const meta: MetaFunction = () => {
  return [
    { title: "RC Drift UK | 2025 Rules" },
    {
      name: "description",
      content: "Official rules and regulations for RCDrift UK 2025 events",
    },
  ];
};

const UL = styled("ul", {
  base: {
    listStyle: "initial",
    paddingLeft: 4,
    color: "gray.400",
    display: "flex",
    flexDirection: "column",
    gap: 2,
  },
});

const P = styled("p", {
  base: {
    color: "gray.400",
    marginTop: 2,
  },
});

const H3 = styled("h3", {
  base: {
    mt: 4,
    mb: 2,
    color: "gray.200",
    fontSize: {
      base: "lg",
      md: "xl",
    },
    fontWeight: "black",
    textWrap: "balance",
  },
});

const Highlight = styled("span", {
  base: {
    color: "brand.500",
    fontWeight: "bold",
  },
});

export default function RulesPage() {
  return (
    <Container py={8} px={4} maxW={800}>
      <Stack gap={6}>
        <styled.h1 fontSize="3xl" fontWeight="bold">
          RCDrift UK 2025 Rules & Regulations
        </styled.h1>

        <P>
          All competitors must adhere to the following rules at all times. Failure to comply may result in <Highlight>disqualification</Highlight>.
        </P>

        <Stack gap={4}>
          <CollapsibleCard title="1. General Conduct" defaultOpen={true}>
            <H3>Sportsmanship</H3>
            <UL>
              <styled.li>Be kind and courteous to fellow drivers, staff, and spectators</styled.li>
              <styled.li>Unsportsmanlike behavior may result in <Highlight>immediate disqualification</Highlight></styled.li>
            </UL>

            <H3>Judges' Decisions</H3>
            <UL>
              <styled.li>All judges' decisions are <Highlight>final</Highlight> and <Highlight>cannot be contested</Highlight></styled.li>
            </UL>

            <H3>Safety</H3>
            <UL>
              <styled.li><Highlight>No</Highlight> external devices emitting smoke, sound, or similarly distracting effects</styled.li>
              <styled.li>Cars must pose <Highlight>no danger</Highlight> to competitors, staff, or spectators</styled.li>
              <styled.li>Batteries must be handled <Highlight>responsibly</Highlight> (e.g., use a LiPo bag for charging)</styled.li>
              <styled.li>Any car deemed unsafe will be <Highlight>disqualified</Highlight></styled.li>
            </UL>
          </CollapsibleCard>

          <CollapsibleCard title="2. Car Regulations">
            <H3>Scale & Dimensions</H3>
            <UL>
              <styled.li>Car must be <Highlight>1:10 scale</Highlight></styled.li>
              <styled.li>Wheelbase: <Highlight>253–275 mm</Highlight></styled.li>
              <styled.li>Width: <Highlight>Maximum 230 mm</Highlight> (measured at the widest point)</styled.li>
              <styled.li>Weight: <Highlight>1400–2000 g</Highlight> (including body)</styled.li>
            </UL>

            <H3>Chassis</H3>
            <UL>
              <styled.li><Highlight>RWD only</Highlight>, with an independently suspended, commercially available chassis</styled.li>
              <styled.li><Highlight>No</Highlight> homemade or prototype chassis or parts</styled.li>
              <styled.li><Highlight>One chassis</Highlight> per driver (no spare "T-cars" unless explicitly allowed)</styled.li>
            </UL>

            <H3>Electronics</H3>
            <Stack gap={2}>
              <P fontWeight="semibold">Battery:</P>
              <UL>
                <styled.li><Highlight>2S LiPo or LiHV</Highlight> (hard-cased)</styled.li>
                <styled.li>Must be mounted <Highlight>between the front and rear axles</Highlight></styled.li>
              </UL>

              <P fontWeight="semibold">Motor:</P>
              <UL>
                <styled.li>Brushless, 540-size, <Highlight>13.5T or 10.5T</Highlight></styled.li>
                <styled.li><Highlight>No</Highlight> prototypes/homemade motors</styled.li>
              </UL>

              <P fontWeight="semibold">ESC:</P>
              <UL>
                <styled.li>Must include <Highlight>reverse function</Highlight></styled.li>
              </UL>

              <P fontWeight="semibold">Transmitter:</P>
              <UL>
                <styled.li><Highlight>2.4 GHz only</Highlight></styled.li>
              </UL>
            </Stack>

            <H3>Wheels & Tires</H3>
            <UL>
              <styled.li>Wheels: <Highlight>Plastic</Highlight>, commercially available (not homemade)</styled.li>
              <styled.li>Tires: Must be the <Highlight>specified control tire</Highlight> for the event/venue</styled.li>
              <styled.li>All four tires must <Highlight>match</Highlight> and be <Highlight>unmodified</Highlight></styled.li>
              <styled.li>Tires must be clean</styled.li>
            </UL>

            <H3>Body Shell</H3>
            <UL>
              <styled.li>Must have a <Highlight>realistic 1:1 car–inspired shell</Highlight></styled.li>
              <styled.li>Body shell must be painted and in good condition; <Highlight>clear windows</Highlight> (front at minimum)</styled.li>
              <styled.li>Aero parts allowed if within width and height limits</styled.li>
              <styled.li><Highlight>No</Highlight> strobe lights or distracting lighting</styled.li>
            </UL>
          </CollapsibleCard>

          <CollapsibleCard title="3. Track Rules">
            <H3>Boundaries</H3>
            <UL>
              <styled.li>Cars must stay <Highlight>within track boundaries</Highlight> at all times</styled.li>
              <styled.li>Leaving the track may result in <Highlight>loss of all points</Highlight> for that run</styled.li>
            </UL>

            <H3>Direction of Travel</H3>
            <UL>
              <styled.li>Follow the <Highlight>designated track layout</Highlight> and direction</styled.li>
              <styled.li>Wrong direction driving may cause <Highlight>disqualification</Highlight></styled.li>
            </UL>

            <P mt={4}>
              All existing track rules for that given feeder round remain in place and can be enforced by the track owner at their discretion.
            </P>
          </CollapsibleCard>

          <CollapsibleCard title="4. Competition Format">
            <P>See Judging Criteria</P>
          </CollapsibleCard>

          <CollapsibleCard title="5. Tandem Battle Rules">
            <P>See Judging Criteria</P>
          </CollapsibleCard>

          <CollapsibleCard title="6. Penalties & Disqualifications">
            <H3>Vehicle Violations</H3>
            <UL>
              <styled.li>Technical infractions may lead to <Highlight>disqualification</Highlight></styled.li>
            </UL>

            <H3>Behavioral Infractions</H3>
            <UL>
              <styled.li>Unsportsmanlike conduct or disregard for safety: <Highlight>immediate disqualification</Highlight></styled.li>
              <styled.li>Verbal abuse is <Highlight>strictly prohibited</Highlight></styled.li>
            </UL>
          </CollapsibleCard>

          <CollapsibleCard title="7. Additional Notes">
            <UL>
              <styled.li><Highlight>No Protests</Highlight> - Judges' decisions are final</styled.li>
              <styled.li><Highlight>Compliance</Highlight> - Technical inspections may occur at any time</styled.li>
              <styled.li><Highlight>Adaptation</Highlight> - Rules may be amended to ensure fairness and safety</styled.li>
            </UL>
          </CollapsibleCard>
        </Stack>

        <P textAlign="center" mt={8}>
          Thank you for respecting the rules and contributing to a fair, fun, and safe RC drift event in the UK!
        </P>
      </Stack>
    </Container>
  );
} 