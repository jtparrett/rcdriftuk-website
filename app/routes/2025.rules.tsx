import { Box, Container, Stack, styled } from "~/styled-system/jsx";
import type { Route } from "./+types/2025";
import { CollapsibleCard } from "~/components/CollapsibleCard";

export const meta: Route.MetaFunction = () => {
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
    fontWeight: "extrabold",
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
        <Box textAlign={{ md: "center" }}>
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

        <Stack gap={4}>
          <CollapsibleCard title="1. General Conduct">
            <H3>Sportsmanship</H3>
            <UL>
              <styled.li>
                All <Highlight>participants</Highlight> are required to conduct
                themselves in a{" "}
                <Highlight>
                  respectful, courteous, and professional manner toward fellow
                  participants
                </Highlight>{" "}
                at all times.
              </styled.li>
              <styled.li>
                Any <Highlight>unsportsmanlike conduct</Highlight> shall result
                in <Highlight>immediate disqualification</Highlight> from any{" "}
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
                <Highlight>no risk or hazard</Highlight> to fellow participants
              </styled.li>
              <styled.li>
                Batteries must be handled <Highlight>responsibly</Highlight>,
                including but not limited to the use of a{" "}
                <Highlight>LiPo bag</Highlight> during charging procedures
              </styled.li>
              <styled.li>
                Any vehicle deemed unsafe will result in the{" "}
                <Highlight>disqualification</Highlight> of the competitor from
                any ongoing tournament
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
                Wheelbase within: <Highlight>253–275mm</Highlight>
              </styled.li>
              <styled.li>
                Width: <Highlight>Maximum 230mm</Highlight> (measured at the
                widest point)
              </styled.li>
              <styled.li>
                Weight: <Highlight>1400–2000g</Highlight> (including body)
              </styled.li>
              <styled.li>
                Ride height at full weight (including battery and body):{" "}
                <Highlight>Minimum 5mm</Highlight> from the ground to the bottom
                of the chassis with vehicle at rest
              </styled.li>
              <styled.li>
                Maximum height at full weight: <Highlight>150mm</Highlight> for
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
                <Highlight>One chassis</Highlight> per competitor (no spare
                "T-cars" unless explicitly allowed)
              </styled.li>
              <styled.li>
                No <Highlight>loose parts</Highlight>, including{" "}
                <Highlight>screws</Highlight>, shall be permitted at any time
                during the event. All components must be securely fastened.
              </styled.li>
            </UL>

            <H3>Electronics Requirements</H3>
            <Stack gap={2}>
              <P fontWeight="semibold">General:</P>
              <UL>
                <styled.li>
                  All <Highlight>electronic components</Highlight> must be{" "}
                  <Highlight>firmly and securely mounted</Highlight> to the{" "}
                  <Highlight>chassis</Highlight> at all times, ensuring no
                  movement or risk of detachment during the event.
                </styled.li>
              </UL>

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
                Wheels without visible spokes (e.g. turbofans or solid-face
                designs){" "}
                <Highlight>
                  must have a visible marking on the outer face
                </Highlight>{" "}
                to indicate orientation.
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
                The body shell must be{" "}
                <Highlight>modeled after a realistic 1:1 car design</Highlight>
              </styled.li>
              <styled.li>
                The body shell must be <Highlight>properly painted</Highlight>{" "}
                and maintained in <Highlight>good condition</Highlight>, with{" "}
                <Highlight>clear windows</Highlight> (at a minimum, the front
                window)
              </styled.li>
              <styled.li>
                <Highlight>Aero components</Highlight> are permissible, provided
                they comply with the specified <Highlight>width</Highlight> and{" "}
                <Highlight>height</Highlight> limitations
              </styled.li>
              <styled.li>
                No part of the <Highlight>wing</Highlight> or{" "}
                <Highlight>body</Highlight> shall extend more than{" "}
                <Highlight>25mm beyond the rear bumper</Highlight>
              </styled.li>
              <styled.li>
                The use of <Highlight>strobe lights</Highlight> or any other
                form of <Highlight>distracting lighting</Highlight> is strictly
                prohibited
              </styled.li>
            </UL>
          </CollapsibleCard>

          <CollapsibleCard title="3. Track Rules">
            <UL>
              <styled.li>
                All competitors are required to{" "}
                <Highlight>adhere to the designated track layout</Highlight> and{" "}
                <Highlight>direction</Highlight> at all times.
              </styled.li>
              <styled.li>
                <Highlight>Driving in the incorrect direction</Highlight> may
                result in <Highlight>disqualification</Highlight> from any
                ongoing tournament.
              </styled.li>
              <styled.li>
                All existing <Highlight>track</Highlight> and{" "}
                <Highlight>venue rules</Highlight> applicable to the specific
                event shall remain in effect and may be enforced by the{" "}
                <Highlight>track owner</Highlight> or{" "}
                <Highlight>event organiser</Highlight> at their sole discretion.
              </styled.li>
            </UL>
          </CollapsibleCard>

          <CollapsibleCard title="4. Tournament Format">
            <P>
              Event and track owners are solely responsible for{" "}
              <Highlight>defining</Highlight> and{" "}
              <Highlight>communicating</Highlight> the tournament format and
              schedule for their respective events.
            </P>

            <H3>Schedule Compliance</H3>
            <UL>
              <styled.li>
                All competitors are required to{" "}
                <Highlight>adhere strictly</Highlight> to the defined format and
                schedule
              </styled.li>
              <styled.li>
                Competitors must be <Highlight>prepared</Highlight> to compete
                at their designated time
              </styled.li>
              <styled.li>
                Failure to comply with the established schedule may result in{" "}
                <Highlight>penalties</Highlight> at the sole discretion of the
                judges
              </styled.li>
            </UL>

            <P>
              The tournament format and schedule will be{" "}
              <Highlight>communicated</Highlight> to all participants prior to
              the event. It is the responsibility of each competitor to be fully
              aware of and comply with the <Highlight>timeline</Highlight>.
            </P>
          </CollapsibleCard>

          <CollapsibleCard title="5. Penalties & Disqualifications">
            <H3>Vehicle Violations</H3>
            <UL>
              <styled.li>
                Any <Highlight>technical infractions</Highlight> must be
                rectified before the start of{" "}
                <Highlight>qualification or battles</Highlight>. Failure to do
                so may result in <Highlight>disqualification</Highlight> from
                any ongoing tournament
              </styled.li>
            </UL>

            <H3>Behavioral Infractions</H3>
            <UL>
              <styled.li>
                <Highlight>Unsportsmanlike conduct</Highlight> or disregard for
                safety may result in{" "}
                <Highlight>immediate disqualification</Highlight> from any
                ongoing tournament
              </styled.li>
              <styled.li>
                <Highlight>Verbal abuse</Highlight> is strictly prohibited and
                will not be tolerated under any circumstances
              </styled.li>
            </UL>
          </CollapsibleCard>

          <CollapsibleCard title="6. Additional Notes">
            <H3>Compliance</H3>
            <UL>
              <styled.li>
                <Highlight>Technical inspections</Highlight> may be conducted at
                any time during the event to ensure adherence to the established{" "}
                <Highlight>rules and regulations</Highlight>.
              </styled.li>
            </UL>

            <H3>Adaptation</H3>
            <UL>
              <styled.li>
                The rules may be <Highlight>amended</Highlight> as necessary to
                ensure <Highlight>fairness</Highlight> and{" "}
                <Highlight>safety</Highlight>. Any updates or changes will be{" "}
                <Highlight>published promptly</Highlight> and all competitors
                will be notified accordingly.
              </styled.li>
            </UL>
          </CollapsibleCard>
        </Stack>
      </Stack>
    </Container>
  );
}
