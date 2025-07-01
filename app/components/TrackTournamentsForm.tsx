import { useFormik } from "formik";
import type { GetUserOwnedTrackBySlug } from "~/utils/getUserOwnedTrackBySlug.server";
import type { Tournaments } from "@prisma/client";
import { Box, Divider, Flex, styled } from "~/styled-system/jsx";
import { Input } from "./Input";
import { useState } from "react";
import { Dropdown, Option } from "./Dropdown";
import { Button } from "./Button";
import { RiDeleteBinFill } from "react-icons/ri";
import { useFetcher, useFormAction, useSubmit } from "react-router";

interface Props {
  track: GetUserOwnedTrackBySlug;
  tournaments: Tournaments[];
}

export const TrackTournamentsForm = ({ track, tournaments }: Props) => {
  const [search, setSearch] = useState("");
  const [focused, setFocused] = useState(false);
  const submit = useSubmit();

  const formik = useFormik({
    initialValues: {
      tournaments: track.tournaments.map(
        (tournament) => tournament.tournament.id,
      ),
    },
    async onSubmit(values) {
      const formData = new FormData();

      values.tournaments.forEach((tournamentId) => {
        formData.append("tournaments", tournamentId);
      });

      await submit(formData, {
        method: "POST",
        action: `/api/track/${track.id}/tournaments`,
      });
    },
  });

  const filteredTournaments = tournaments.filter((tournament) => {
    return (
      tournament.name.toLowerCase().includes(search.toLowerCase()) &&
      !formik.values.tournaments.includes(tournament.id)
    );
  });

  return (
    <form onSubmit={formik.handleSubmit}>
      {formik.values.tournaments.length > 0 && (
        <Box
          bgColor="gray.900"
          rounded="lg"
          mb={2}
          overflow="hidden"
          borderWidth={1}
          borderColor="gray.800"
        >
          <Box mb="-1px">
            {formik.values.tournaments.map((tournamentId, i) => {
              const tournament = tournaments.find(
                (tournament) => tournament.id === tournamentId,
              );

              return (
                <Flex
                  key={tournamentId}
                  gap={1}
                  borderBottomWidth={1}
                  borderBottomColor="gray.800"
                >
                  <input
                    type="hidden"
                    name="tournaments"
                    value={tournamentId}
                  />
                  <styled.p py={1} px={4} flex={1}>
                    {tournament?.name}
                  </styled.p>

                  <Box p={1}>
                    <Button
                      px={1}
                      size="xs"
                      type="button"
                      variant="ghost"
                      onClick={() => {
                        formik.setFieldValue(
                          "tournaments",
                          formik.values.tournaments.filter(
                            (_id, index) => index !== i,
                          ),
                        );
                      }}
                    >
                      <RiDeleteBinFill />
                    </Button>
                  </Box>
                </Flex>
              );
            })}
          </Box>
        </Box>
      )}

      <Box pos="relative">
        <Input
          placeholder="Type to search..."
          onBlur={(e) => {
            setTimeout(() => {
              const active = document.activeElement;
              const listbox = document.querySelector('[role="listbox"]');
              if (!listbox?.contains(active)) {
                setFocused(false);
              }
            }, 0);
          }}
          onFocus={() => setFocused(true)}
          onChange={(e) => setSearch(e.target.value)}
          value={search}
        />
        {focused && search.length > 0 && (
          <Dropdown role="listbox">
            {filteredTournaments.length === 0 && (
              <styled.p px={2} py={1} fontWeight="semibold">
                No tournaments found
              </styled.p>
            )}

            {filteredTournaments.map((tournament) => {
              return (
                <Option
                  key={tournament.id}
                  type="button"
                  onClick={() => {
                    formik.setFieldValue("tournaments", [
                      ...formik.values.tournaments,
                      tournament.id,
                    ]);
                    setSearch("");
                  }}
                >
                  {tournament.name}
                </Option>
              );
            })}
          </Dropdown>
        )}
      </Box>

      <Divider borderColor="gray.800" my={4} />

      <Button type="submit" w="full">
        Save Changes
      </Button>
    </form>
  );
};
