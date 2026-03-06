import { styled, Box, Flex, Grid } from "~/styled-system/jsx";
import { Input } from "./Input";
import { Button } from "./Button";
import { Select } from "./Select";
import { Label } from "./Label";
import { useState } from "react";
import { RiCloseLine, RiDraggable } from "react-icons/ri";
import { Dropdown, Option } from "./Dropdown";
import { Reorder } from "motion/react";
import { useUserSearch } from "~/hooks/useUserSearch";

export interface JudgeEntry {
  driverId: string;
  firstName?: string | null;
  lastName?: string | null;
  image?: string | null;
  points: number;
  alias: string;
}

export interface JudgeEntryError {
  alias?: string;
  points?: string;
}

interface JudgesFormProps {
  disabled?: boolean;
  onChange: (value: JudgeEntry[]) => void;
  value: JudgeEntry[];
  errors?: (JudgeEntryError | undefined)[];
}

const POINTS_OPTIONS = Array.from({ length: 10 }, (_, i) => (i + 1) * 10);

const buildDefaultAlias = (
  firstName?: string | null,
  lastName?: string | null,
) => {
  return `${firstName ?? ""} ${lastName ?? ""}`.trim();
};

export const JudgesForm = ({
  value,
  onChange,
  disabled = false,
  errors,
}: JudgesFormProps) => {
  const [focused, setFocused] = useState(false);
  const [search, setSearch] = useState("");

  const { data: searchResults = [], isLoading } = useUserSearch(search);

  const selectedDriverIds = new Set(value.map((v) => v.driverId));
  const filteredResults = searchResults.filter(
    (u) => !selectedDriverIds.has(u.driverId.toString()),
  );

  return (
    <Box>
      {value.length > 0 && (
        <Flex flexDir="column" gap={3} mb={3}>
          <Reorder.Group
            axis="y"
            values={value}
            onReorder={onChange}
            style={{
              margin: 0,
              padding: 0,
              listStyle: "none",
              display: "flex",
              flexDirection: "column",
              gap: "12px",
            }}
          >
            {value.map((judge, i) => (
              <Reorder.Item
                key={judge.driverId}
                value={judge}
                style={{ listStyle: "none" }}
                whileDrag={{ zIndex: 1000, scale: 1.02 }}
                dragElastic={0.1}
                drag={!disabled}
              >
                <Box
                  bgColor="gray.900"
                  rounded="xl"
                  borderWidth={1}
                  borderColor="gray.800"
                  overflow="hidden"
                  transition="all 0.15s ease"
                  _hover={{ borderColor: disabled ? "gray.800" : "gray.700" }}
                >
                  {/* Header row: drag handle, avatar, judge letter, remove */}
                  <Flex
                    alignItems="center"
                    gap={3}
                    px={3}
                    pt={3}
                    pb={2}
                    cursor={disabled ? "default" : "grab"}
                    _active={{ cursor: disabled ? "default" : "grabbing" }}
                  >
                    {!disabled && (
                      <Box color="gray.600" flexShrink={0}>
                        <RiDraggable size={18} />
                      </Box>
                    )}

                    <styled.img
                      src={judge.image ?? "/blank-driver-right.jpg"}
                      alt={judge.alias || ""}
                      w={9}
                      h={9}
                      rounded="full"
                      objectFit="cover"
                      flexShrink={0}
                      borderWidth={2}
                      borderColor="gray.700"
                    />

                    <Box flex={1} minW={0}>
                      <styled.p fontWeight="semibold" fontSize="sm">
                        Judge {String.fromCharCode(65 + i)}
                      </styled.p>
                      <styled.p color="gray.500" fontSize="xs">
                        {buildDefaultAlias(judge.firstName, judge.lastName) ||
                          `#${judge.driverId}`}
                      </styled.p>
                    </Box>

                    {!disabled && (
                      <Button
                        px={1}
                        size="xs"
                        type="button"
                        variant="ghost"
                        flexShrink={0}
                        onClick={() => {
                          onChange(value.filter((_, index) => index !== i));
                        }}
                      >
                        <RiCloseLine size={16} />
                      </Button>
                    )}
                  </Flex>

                  {/* Fields row */}
                  <Grid
                    columns={2}
                    gap={3}
                    px={3}
                    pb={3}
                    pl={!disabled ? "46px" : 3}
                  >
                    <Box>
                      <Label fontSize="xs" color="gray.400" mb="2px">
                        Alias
                      </Label>
                      <Input
                        py={1.5}
                        px={3}
                        fontSize="sm"
                        placeholder="Display name..."
                        value={judge.alias}
                        disabled={disabled}
                        borderColor={
                          errors?.[i]?.alias ? "brand.500" : undefined
                        }
                        onChange={(e) => {
                          onChange(
                            value.map((p, index) =>
                              index === i
                                ? { ...p, alias: e.target.value }
                                : p,
                            ),
                          );
                        }}
                      />
                      {errors?.[i]?.alias && (
                        <styled.p color="brand.500" fontSize="xs" mt="2px">
                          {errors[i].alias}
                        </styled.p>
                      )}
                    </Box>

                    <Box>
                      <Label fontSize="xs" color="gray.400" mb="2px">
                        Max Points
                      </Label>
                      <Select
                        fontSize="sm"
                        py={1.5}
                        value={judge.points}
                        disabled={disabled}
                        onChange={(e) => {
                          onChange(
                            value.map((p, index) =>
                              index === i
                                ? { ...p, points: Number(e.target.value) }
                                : p,
                            ),
                          );
                        }}
                      >
                        {POINTS_OPTIONS.map((points) => (
                          <option key={points} value={points}>
                            {points} pts
                          </option>
                        ))}
                      </Select>
                    </Box>
                  </Grid>
                </Box>
              </Reorder.Item>
            ))}
          </Reorder.Group>
        </Flex>
      )}

      {!disabled && (
        <Box pos="relative">
          <Input
            placeholder="Search for a judge to add..."
            onBlur={() => {
              setTimeout(() => {
                const active = document.activeElement;
                const listbox = document.querySelector('[role="listbox"]');
                if (!listbox?.contains(active)) {
                  setFocused(false);
                }
              }, 300);
            }}
            onFocus={() => setFocused(true)}
            onChange={(e) => setSearch(e.target.value)}
            value={search}
          />
          {focused && search.length > 0 && (
            <Dropdown role="listbox">
              {isLoading && (
                <styled.p px={2} py={1} color="gray.500">
                  Searching...
                </styled.p>
              )}

              {!isLoading && filteredResults.length === 0 && (
                <styled.p px={2} py={1} fontWeight="semibold">
                  No results found
                </styled.p>
              )}

              {filteredResults.map((user) => (
                <Option
                  key={user.driverId}
                  type="button"
                  onClick={() => {
                    onChange([
                      ...value,
                      {
                        driverId: user.driverId.toString(),
                        firstName: user.firstName,
                        lastName: user.lastName,
                        image: user.image,
                        points: 100,
                        alias: buildDefaultAlias(
                          user.firstName,
                          user.lastName,
                        ),
                      },
                    ]);
                    setSearch("");
                  }}
                >
                  <Flex alignItems="center" gap={2}>
                    <styled.img
                      src={user.image ?? "/blank-driver-right.jpg"}
                      alt={user.firstName ?? ""}
                      w={6}
                      h={6}
                      rounded="full"
                      objectFit="cover"
                    />
                    <styled.span>
                      {user.firstName} {user.lastName}
                    </styled.span>
                  </Flex>
                </Option>
              ))}
            </Dropdown>
          )}
        </Box>
      )}
    </Box>
  );
};
