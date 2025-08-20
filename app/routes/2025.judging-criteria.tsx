import { Box, Container, Stack, styled } from "~/styled-system/jsx";
import type { Route } from "./+types/2025";
import { CollapsibleCard } from "~/components/CollapsibleCard";

export const meta: Route.MetaFunction = () => {
  return [
    { title: "RC Drift UK | 2025 Judging Criteria" },
    {
      name: "description",
      content:
        "Official judging criteria and scoring system for RCDrift UK 2025 events",
    },
    {
      property: "og:image",
      content: "https://rcdrift.uk/og-image.jpg",
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

export default function JudgingCriteriaPage() {
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
            Judging Criteria
          </styled.h1>
          <styled.span fontSize="sm" color="gray.500">
            Last updated: 14/03/2025
          </styled.span>
        </Box>

        <Stack gap={4}>
          <CollapsibleCard title="1. Scoring System">
            <P>
              The tournament consists of{" "}
              <Highlight>solo qualifying runs</Highlight> and{" "}
              <Highlight>tandem battles</Highlight>. Each is judged using
              specific criteria to ensure fairness and consistency.
            </P>

            <P>
              <Highlight>
                Qualifying is optional and will be implemented at the discretion
                of the tournament organizers.
              </Highlight>
            </P>

            <H3>Solo Run Scoring (100-Point Scale)</H3>
            <P>
              Each qualifying run is scored out of a maximum of 100 points,
              divided into three key categories: <Highlight>Line</Highlight>,{" "}
              <Highlight>Angle</Highlight>, and <Highlight>Style</Highlight>.
              All drivers are judged by the same criteria, ensuring a universal
              standard of evaluation. Judges will brief competitors on the
              specific track layout, including the{" "}
              <Highlight>designated drift line</Highlight> and{" "}
              <Highlight>clipping points/zones</Highlight>, before the
              tournament. Scoring starts at 100 points, and deductions are
              applied for mistakes.
            </P>

            <H3>Scoring Categories</H3>
            <H3>Line (60 points max)</H3>
            <UL>
              <styled.li>
                Drivers must adhere to the{" "}
                <Highlight>designated drift line</Highlight> defined in the
                drivers' briefing.
              </styled.li>
              <styled.li>
                <Highlight>Clipping points</Highlight> and zones must be
                accurately targeted.
              </styled.li>
              <styled.li>
                Deviation from the <Highlight>ideal line</Highlight> results in
                deductions.
              </styled.li>
            </UL>

            <H3>Angle (20 points max)</H3>
            <UL>
              <styled.li>
                Drivers must maintain the{" "}
                <Highlight>correct drift angle</Highlight> for different track
                sections.
              </styled.li>
              <styled.li>
                <Highlight>Over-rotating</Highlight> or going beyond the optimal
                required angle will result in deductions.
              </styled.li>
              <styled.li>
                <Highlight>Inconsistent angles</Highlight>, corrections, or
                shallow drifts will result in deductions.
              </styled.li>
            </UL>

            <H3>Style (20 points max)</H3>
            <UL>
              <styled.li>
                Judges assess <Highlight>initiation techniques</Highlight>,
                smoothness of transitions, and overall commitment.
              </styled.li>
              <styled.li>
                <Highlight>Fluid and aggressive driving</Highlight> that
                demonstrates control will be rewarded.
              </styled.li>
              <styled.li>
                <Highlight>Hesitation</Highlight>, wobbling, or lack of
                commitment leads to deductions.
              </styled.li>
            </UL>
          </CollapsibleCard>

          <CollapsibleCard title="2. Scoring Battles (Tandem Runs)">
            <H3>General Battle Scoring</H3>
            <P>
              In tandem battles, judges score based on how well the{" "}
              <Highlight>lead car</Highlight> follows the ideal line while
              maintaining style and angle, and how well the{" "}
              <Highlight>chase car</Highlight> maintains proximity while
              mirroring the lead driver's drift.
            </P>
            <UL>
              <styled.li>
                Judges start with an even score and{" "}
                <Highlight>deduct points</Highlight> based on errors.
              </styled.li>
              <styled.li>
                The driver with <Highlight>fewer mistakes</Highlight> at the end
                of the battle wins.
              </styled.li>
              <styled.li>
                If the score difference is too close to call, an{" "}
                <Highlight>OMT (One More Time)</Highlight> may be requested.
              </styled.li>
            </UL>

            <H3>Lead Car Expectations</H3>
            <UL>
              <styled.li>
                Follow the <Highlight>ideal drift line</Highlight> as set in the
                drivers' briefing.
              </styled.li>
              <styled.li>
                Maintain a <Highlight>consistent angle</Highlight> and speed
                throughout the run.
              </styled.li>
              <styled.li>
                Make <Highlight>no erratic maneuvers</Highlight> that would
                hinder the chase driver.
              </styled.li>
            </UL>

            <H3>Chase Car Expectations</H3>
            <UL>
              <styled.li>
                Maintain <Highlight>proximity</Highlight> without making
                contact.
              </styled.li>
              <styled.li>
                <Highlight>Mirror</Highlight> the lead driver's angle and
                transitions smoothly.
              </styled.li>
              <styled.li>
                Avoid <Highlight>shallowing angle</Highlight> or straightening
                to catch up.
              </styled.li>
            </UL>

            <H3>Lead Car Errors</H3>
            <UL>
              <styled.li>
                Going <Highlight>off-line</Highlight> or missing clipping points
                results in deductions.
              </styled.li>
              <styled.li>
                <Highlight>Inconsistent angle</Highlight> or corrections will be
                penalized.
              </styled.li>
              <styled.li>
                <Highlight>Over-rotating</Highlight> or going beyond the optimal
                required angle will result in deductions.
              </styled.li>
              <styled.li>
                <Highlight>Major error</Highlight> (spin, off-track, wall
                contact) results in a 0 score for that run.
              </styled.li>
            </UL>

            <H3>Chase Car Errors</H3>
            <UL>
              <styled.li>
                <Highlight>Excessive distance</Highlight> from the lead car
                results in deductions.
              </styled.li>
              <styled.li>
                <Highlight>Shallow angle</Highlight> or straightening is
                penalized.
              </styled.li>
              <styled.li>
                <Highlight>Major error</Highlight> (spin, off-track, wall
                contact) results in a 0 score for that run.
              </styled.li>
              <styled.li>
                <Highlight>Contact</Highlight> that disrupts the lead car's run
                will result in penalties at the judges' discretion.
              </styled.li>
            </UL>
            <P>
              If both drivers make equivalent mistakes, the run may be
              considered a tie and <Highlight>OMT (One More Time)</Highlight>{" "}
              may be called.
            </P>
          </CollapsibleCard>

          <CollapsibleCard title="3. Major Errors – Zero Score (Incomplete Run)">
            <P>
              Certain <Highlight>major mistakes</Highlight> result in an
              automatic zero score for the run. These severe errors indicate a
              loss of control or failure to maintain drifting and thus nullify
              the attempt:
            </P>
            <UL>
              <styled.li>
                <Highlight>Spinning Out</Highlight>: Any spin (a rotation
                greater than 180 degrees) results in a zero score for that run.
              </styled.li>
              <styled.li>
                <Highlight>Going Off Track</Highlight>: If the car leaves the
                designated track boundaries (two or more wheels fully over any
                track line), the run is scored as zero.
              </styled.li>
              <styled.li>
                <Highlight>Wall Contact</Highlight>: Any contact with walls or
                track barriers results in an automatic zero.
              </styled.li>
              <styled.li>
                <Highlight>Understeering or Straightening</Highlight>: If the
                car straightens out (fully losing drift angle) or displays
                excessive understeer through a critical section, it is scored as
                zero.
              </styled.li>
              <styled.li>
                <Highlight>Mechanical Failure or Stoppage</Highlight>: If a car
                breaks down or stops mid-run for any reason, it is considered
                incomplete and receives a zero score.
              </styled.li>
            </UL>
            <P>
              These rules ensure only fully executed, controlled drifts are
              rewarded. Judges will immediately call out a{" "}
              <Highlight>zero score</Highlight> when applicable to maintain
              consistency.
            </P>
          </CollapsibleCard>

          <CollapsibleCard title="4. Restart Line">
            <P>
              Where applicable, a <Highlight>restart line</Highlight> will be
              designated on the track. If an incident occurs{" "}
              <Highlight>before</Highlight> the restart line, the judges may
              allow the drivers to restart the run. However, if the lead and
              chase cars have already passed the restart line, the run will
              continue, and any errors or incidents will be judged as part of
              the battle. The restart line ensures that both drivers have a fair
              opportunity to initiate their run cleanly before committing to the
              full battle.
            </P>
          </CollapsibleCard>

          <CollapsibleCard title="5. Tie-Breaking Rules">
            <P>
              In the event that two drivers receive identical scores or a battle
              is too close to call,{" "}
              <Highlight>tie-breaking procedures</Highlight> come into play to
              ensure a decisive result:
            </P>

            <H3>One More Time (OMT) Runs</H3>
            <P>
              If judges cannot determine a winner in a tandem battle (or if two
              qualifying scores are exactly even and a rank must be decided), a{" "}
              <Highlight>rematch</Highlight> can be called. Judges will announce
              a <Highlight>One More Time</Highlight> when a battle is
              essentially a draw. The drivers will run the track again in a new
              set of runs to give judges another chance to pick a winner.
              RCDrift.uk follows the common practice of limiting repeated OMT
              calls to keep the tournament moving – up to{" "}
              <Highlight>2 One-More-Time rematches</Highlight> can be called for
              a pair of drivers. After <Highlight>two OMTs</Highlight> (which
              would mean the drivers have run up to three sets of battles
              total), the judges must make a final decision on the winner, no
              matter how close. This rule ensures an endless loop of ties is
              avoided while still giving multiple chances to prove a clear
              victor. Judges are encouraged to use OMT{" "}
              <Highlight>sparingly</Highlight> and only when truly necessary.
            </P>

            <H3>Qualifying Ties</H3>
            <P>
              In qualifying, if drivers end up with the exact same total score
              (and tie-breakers like highest <Highlight>Line score</Highlight>{" "}
              or <Highlight>Style score</Highlight> still don't separate them),
              the organizers will use a <Highlight>sudden-death run</Highlight>{" "}
              to break the tie. Typically, this means each tied driver may be
              asked to do one more qualifying run (under the same criteria) to
              earn a new score. Alternatively, RCDrift.uk may arrange a{" "}
              <Highlight>head-to-head "tie-breaker battle"</Highlight> between
              the tied drivers if time permits, even though it's outside the
              normal bracket, to determine who ranks higher. This head-to-head
              approach is a last resort, used to ensure the qualifying order is
              clear before the tournament battles begin. The goal is to always
              have a <Highlight>distinct ranking</Highlight> so that brackets
              and matchups can be assigned without confusion.
            </P>
          </CollapsibleCard>

          <CollapsibleCard title="6. Additional Guidelines for Judges">
            <UL>
              <styled.li>
                Judges must apply standards <Highlight>consistently</Highlight>{" "}
                to all competitors.
              </styled.li>
              <styled.li>
                <Highlight>Visual aids</Highlight> (such as placing RC cars on
                the track) should be used in briefings to clarify expectations.
              </styled.li>
              <styled.li>
                Judging should prioritize <Highlight>fluidity</Highlight> and
                execution over mere speed or aggressive maneuvers.
              </styled.li>
              <styled.li>
                All final decisions lie with the judges, and protests will
                follow RCDrift.uk's official procedures.
              </styled.li>
            </UL>
            <P>
              This structured criteria ensures fair, consistent, and transparent
              judging throughout the 2025 RC drift tournament hosted by
              RCDrift.uk.
            </P>
          </CollapsibleCard>
        </Stack>
      </Stack>
    </Container>
  );
}
