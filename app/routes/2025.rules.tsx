import { Box, Container, Stack, styled } from "~/styled-system/jsx";
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
        <Box textAlign="center">
          <styled.h1
            fontSize="4xl"
            fontWeight="extrabold"
            lineHeight={1.1}
            mb={2}
          >
            Rules & Regulations
          </styled.h1>

          <styled.span fontSize="sm" color="gray.500">
            Last updated: 29/01/2025
          </styled.span>
        </Box>

        <Box rounded="xl" bgColor="brand.900" p={1}>
          <Box
            rounded="lg"
            borderWidth={1}
            borderColor="brand.700"
            borderStyle="dashed"
            px={4}
            py={3}
          >
            <styled.p color="brand.400" fontSize="sm">
              By attending any RCDrift.uk-sanctioned event, all participants
              expressly acknowledge and agree to comply with the following rules
              and regulations. Any failure to adhere to these provisions may
              result in immediate disqualification from the ongoing competition,
              without the possibility of appeal.
            </styled.p>
          </Box>
        </Box>

        <Stack gap={4}>
          <CollapsibleCard title="1. General Conduct" defaultOpen={true}>
            <H3>Sportsmanship</H3>
            <UL>
              <styled.li>
                All <Highlight>event attendees</Highlight> are required to
                conduct themselves in a{" "}
                <Highlight>
                  respectful, courteous, and professional manner toward drivers,
                  event staff, and spectators
                </Highlight>{" "}
                at all times.
              </styled.li>
              <styled.li>
                Any <Highlight>unsportsmanlike conduct</Highlight> shall result
                in <Highlight>immediate disqualification</Highlight> from the{" "}
                <Highlight>ongoing tournament</Highlight> without the
                possibility of appeal.
              </styled.li>
            </UL>

            <H3>Judges Discretion</H3>
            <UL>
              <styled.li>
                All decisions rendered by the judges shall be{" "}
                <Highlight>final and binding</Highlight>, unless a formal
                protest is <Highlight>filed immediately</Highlight> in
                accordance with the established procedures.
              </styled.li>
            </UL>

            <H3>Protesting Criteria</H3>
            <UL>
              <styled.li>
                Protests must be submitted <Highlight>immediately</Highlight>{" "}
                following the run in question, prior to the continuation of the
                tournament.
              </styled.li>
              <styled.li>
                A <Highlight>protest fee</Highlight> equal to the event's{" "}
                <Highlight>entrance fee</Highlight> must be paid in full at the
                time of submission.
              </styled.li>
              <styled.li>
                Should the protest be deemed <Highlight>successful</Highlight>,
                the fee will be <Highlight>refunded in full</Highlight>.
              </styled.li>
              <styled.li>
                If the protest is <Highlight>overruled</Highlight>, the fee will
                be <Highlight>forfeited</Highlight>.
              </styled.li>
            </UL>

            <H3>Safety</H3>
            <UL>
              <styled.li>
                <Highlight>External devices</Highlight> emitting smoke, sound,
                or any similarly distracting effects are{" "}
                <Highlight>prohibited</Highlight>
              </styled.li>
              <styled.li>
                All equipment, including but not limited to vehicles, must be
                maintained in a manner that ensures{" "}
                <Highlight>no risk or hazard</Highlight> to event attendees
              </styled.li>
              <styled.li>
                Batteries must be handled <Highlight>responsibly</Highlight>,
                including but not limited to the use of a{" "}
                <Highlight>LiPo bag</Highlight> during charging procedures
              </styled.li>
              <styled.li>
                Any vehicle deemed unsafe will result in the{" "}
                <Highlight>disqualification</Highlight> of the competitor from
                the ongoing event
              </styled.li>
            </UL>
          </CollapsibleCard>

          <CollapsibleCard title="2. Vehicle Regulations">
            <H3>Scale & Dimension Requirements</H3>
            <UL>
              <styled.li>
                Must be: <Highlight>1:10 scale</Highlight>
              </styled.li>
              <styled.li>
                Wheelbase within: <Highlight>253–275 mm</Highlight>
              </styled.li>
              <styled.li>
                Width: <Highlight>Maximum 230 mm</Highlight> (measured at the
                widest point)
              </styled.li>
              <styled.li>
                Weight: <Highlight>1400–2000 g</Highlight> (including body)
              </styled.li>
              <styled.li>
                Ride height at full weight (including battery):{" "}
                <Highlight>Minimum 5 mm</Highlight> from ground to chassis
              </styled.li>
              <styled.li>
                Maximum height at full weight: <Highlight>150 mm</Highlight> for
                any aerodynamic components (wings, spoilers, side dams) measured
                with vehicle at rest
              </styled.li>
            </UL>

            <H3>Chassis Requirements</H3>
            <UL>
              <styled.li>
                <Highlight>Rear Wheel Drive (RWD) only</Highlight>, with
                independent suspension.
              </styled.li>
              <styled.li>
                The chassis{" "}
                <Highlight>must be commercially available</Highlight>
              </styled.li>
              <styled.li>
                <Highlight>Solid axle chassis are prohibited</Highlight>
              </styled.li>
              <styled.li>
                <Highlight>Homemade/prototype</Highlight> chassis or parts are
                prohibited
              </styled.li>
              <styled.li>
                <Highlight>One chassis</Highlight> per driver (no spare "T-cars"
                unless explicitly allowed)
              </styled.li>
            </UL>

            <H3>Electronics Requirements</H3>
            <Stack gap={2}>
              <P fontWeight="semibold">Battery:</P>
              <UL>
                <styled.li>
                  <Highlight>2S LiPo or LiHV</Highlight> (hard-cased)
                </styled.li>
                <styled.li>
                  Must be mounted{" "}
                  <Highlight>between the front and rear axles</Highlight>
                </styled.li>
              </UL>

              <P fontWeight="semibold">Motor:</P>
              <UL>
                <styled.li>
                  Brushless, 540-size, <Highlight>13.5T or 10.5T</Highlight>
                </styled.li>
                <styled.li>
                  <Highlight>Homemade/prototypes motors</Highlight> are
                  prohibited
                </styled.li>
              </UL>

              <P fontWeight="semibold">ESC:</P>
              <UL>
                <styled.li>
                  Must include <Highlight>reverse functionality</Highlight>
                </styled.li>
              </UL>

              <P fontWeight="semibold">Transmitter:</P>
              <UL>
                <styled.li>
                  <Highlight>2.4 GHz only</Highlight>
                </styled.li>
              </UL>
            </Stack>

            <H3>Wheels & Tires Requirements</H3>
            <UL>
              <styled.li>
                Wheels: <Highlight>Plastic</Highlight>, commercially available
                (not homemade)
              </styled.li>
              <styled.li>
                Wheels must be <Highlight>covered by body arches</Highlight> -
                the top of the wheel/tire cannot extend beyond the body when
                viewed from above
              </styled.li>
              <styled.li>
                Tires must be the <Highlight>specified control tire</Highlight>{" "}
                for the event/venue in compliance with venue rules
              </styled.li>
              <styled.li>
                All four tires must <Highlight>match</Highlight> and be{" "}
                <Highlight>unmodified</Highlight>
              </styled.li>
              <styled.li>Tires must be clean and in good condition</styled.li>
            </UL>

            <H3>Body Shell Requirements</H3>
            <UL>
              <styled.li>
                Must have a{" "}
                <Highlight>realistic 1:1 car–inspired body shell</Highlight>
              </styled.li>
              <styled.li>
                Body shell must be painted and in good condition;{" "}
                <Highlight>clear windows</Highlight> (front at minimum)
              </styled.li>
              <styled.li>
                Aero parts allowed if within width and height limits
              </styled.li>
              <styled.li>
                No part of the wing or body may extend more than{" "}
                <Highlight>25mm behind the rear bumper</Highlight>
              </styled.li>
              <styled.li>
                <Highlight>No strobe lights or distracting lighting</Highlight>
              </styled.li>
            </UL>
          </CollapsibleCard>

          <CollapsibleCard title="3. Track Rules">
            <UL>
              <styled.li>
                All competitors must{" "}
                <Highlight>follow the designated track layout</Highlight> and{" "}
                <Highlight>direction</Highlight>
              </styled.li>
              <styled.li>
                <Highlight>Driving in the wrong direction</Highlight> may result
                in <Highlight>disqualification</Highlight> from the ongoing
                event
              </styled.li>
              <styled.li>
                All existing <Highlight>track/venue rules</Highlight> for the
                specific event will remain in effect and may be{" "}
                <Highlight>
                  enforced by the track owner or event organiser
                </Highlight>{" "}
                at their discretion
              </styled.li>
            </UL>
          </CollapsibleCard>

          <CollapsibleCard title="4. Competition Format">
            <P>
              Event and track owners are responsible for defining and
              communicating the competition format and schedule for their
              respective events.
            </P>

            <H3>Schedule Compliance</H3>
            <UL>
              <styled.li>
                All drivers must <Highlight>strictly follow</Highlight> the
                defined format and schedule
              </styled.li>
              <styled.li>
                Drivers must be <Highlight>ready to compete</Highlight> at their
                designated time
              </styled.li>
              <styled.li>
                Failure to comply with schedules may result in{" "}
                <Highlight>penalties at judges' discretion</Highlight>
              </styled.li>
            </UL>

            <P mt={4}>
              The competition format and schedule will be communicated to all
              participants before the event. It is each driver's responsibility
              to be aware of and follow the timeline.
            </P>
          </CollapsibleCard>

          <CollapsibleCard title="5. Penalties & Disqualifications">
            <H3>Vehicle Violations</H3>
            <UL>
              <styled.li>
                Technical infractions may lead to{" "}
                <Highlight>
                  disqualification from the current event if not rectified
                  before qualification/battles start
                </Highlight>
              </styled.li>
            </UL>

            <H3>Behavioral Infractions</H3>
            <UL>
              <styled.li>
                Unsportsmanlike conduct or disregard for safety may result in{" "}
                <Highlight>
                  immediate disqualification from the current event
                </Highlight>
              </styled.li>
              <styled.li>
                Verbal abuse is <Highlight>strictly prohibited</Highlight>
              </styled.li>
            </UL>
          </CollapsibleCard>

          <CollapsibleCard title="6. Additional Notes">
            <UL>
              <styled.li>
                <Highlight>Compliance</Highlight> - Technical inspections may
                occur at any time
              </styled.li>
              <styled.li>
                <Highlight>Adaptation</Highlight> - Rules may be amended to
                ensure fairness and safety but an update will be published
                alerting competitors
              </styled.li>
            </UL>
          </CollapsibleCard>
        </Stack>

        <P textAlign="center" mt={8}>
          Thank you for respecting the rules and contributing to a fair, fun,
          and safe RC drift event in the UK!
        </P>
      </Stack>
    </Container>
  );
}
