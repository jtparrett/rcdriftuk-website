import { styled, Box, Flex } from "~/styled-system/jsx";
import { Input } from "./Input";
import { Button } from "./Button";
import { useState } from "react";
import { RiDeleteBinFill, RiDraggable } from "react-icons/ri";
import { Dropdown, Option } from "./Dropdown";
import { Reorder } from "motion/react";
import pluralize from "pluralize";
import { useUserSearch } from "~/hooks/useUserSearch";

export interface PersonEntry {
  driverId: string;
  firstName?: string | null;
  lastName?: string | null;
  image?: string | null;
  points?: number;
  isNew?: boolean;
}

interface PeopleFormProps {
  name: string;
  allowNewDrivers?: boolean;
  allowPoints?: boolean;
  disabled?: boolean;
  onChange: (value: PersonEntry[]) => void;
  value: PersonEntry[];
}

export const PeopleForm = ({
  value,
  onChange,
  name,
  allowNewDrivers = false,
  allowPoints = false,
  disabled = false,
}: PeopleFormProps) => {
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
        <Box
          bgColor="gray.900"
          rounded="lg"
          mb={2}
          overflow="hidden"
          borderWidth={1}
          borderColor="gray.800"
        >
          <Reorder.Group
            axis="y"
            values={value}
            onReorder={onChange}
            style={{
              margin: 0,
              padding: 0,
              listStyle: "none",
              marginBottom: "-1px",
            }}
          >
            {value
              .filter((p) => p.driverId !== "0")
              .map((person, i) => {
                const displayName = person.firstName
                  ? `${person.firstName} ${person.lastName ?? ""}`.trim()
                  : null;

                return (
                  <Reorder.Item
                    key={person.driverId}
                    value={person}
                    style={{ listStyle: "none" }}
                    whileDrag={{
                      zIndex: 1000,
                    }}
                    dragElastic={0.1}
                    drag={!disabled}
                  >
                    <Flex
                      gap={2}
                      borderBottomWidth={1}
                      borderBottomColor="gray.800"
                      cursor={disabled ? "default" : "grab"}
                      _active={{ cursor: disabled ? "default" : "grabbing" }}
                      transition="all 0.2s ease"
                      _hover={{ bgColor: disabled ? undefined : "gray.800" }}
                      alignItems="center"
                      pl={2}
                    >
                      {!disabled && <RiDraggable size={16} />}

                      <styled.img
                        src={person.image ?? "/blank-driver-right.jpg"}
                        alt={displayName ?? ""}
                        w={5}
                        h={5}
                        rounded="full"
                        objectFit="cover"
                        flexShrink={0}
                      />

                      <styled.p
                        flex={1}
                        userSelect="none"
                        whiteSpace="nowrap"
                        textOverflow="ellipsis"
                        overflow="hidden"
                        py={1}
                      >
                        {displayName ? (
                          <>
                            {displayName}{" "}
                            <styled.span
                              color="gray.500"
                              fontSize="sm"
                              verticalAlign="middle"
                            >
                              #{person.driverId}
                            </styled.span>
                          </>
                        ) : person.isNew ? (
                          <>
                            {person.driverId}{" "}
                            <styled.span
                              color="gray.500"
                              fontSize="sm"
                              verticalAlign="middle"
                            >
                              (new)
                            </styled.span>
                          </>
                        ) : (
                          <>
                            Driver{" "}
                            <styled.span
                              color="gray.500"
                              fontSize="sm"
                              verticalAlign="middle"
                            >
                              #{person.driverId}
                            </styled.span>
                          </>
                        )}
                      </styled.p>

                      {allowPoints && (
                        <styled.select
                          name={name + "Points"}
                          fontSize="sm"
                          borderWidth={1}
                          borderColor="gray.800"
                          rounded="sm"
                          fontFamily="mono"
                          value={person.points}
                          disabled={disabled}
                          onChange={(e) => {
                            onChange(
                              value.map((p, index) =>
                                index === i
                                  ? {
                                      ...p,
                                      points: Number(e.target.value),
                                    }
                                  : p,
                              ),
                            );
                          }}
                        >
                          {Array.from({ length: 10 }, (_, i) => i + 1).map(
                            (points) => (
                              <option key={points} value={points * 10}>
                                {points * 10} Max Points
                              </option>
                            ),
                          )}
                        </styled.select>
                      )}

                      {!disabled && (
                        <Box p={1}>
                          <Button
                            px={1}
                            size="xs"
                            type="button"
                            variant="ghost"
                            onClick={() => {
                              onChange(
                                value.filter((_id, index) => index !== i),
                              );
                            }}
                          >
                            <RiDeleteBinFill />
                          </Button>
                        </Box>
                      )}
                    </Flex>
                  </Reorder.Item>
                );
              })}
          </Reorder.Group>

          <Box px={2} py={1}>
            <styled.p textAlign="right" fontSize="sm" color="gray.500">
              {pluralize(
                "People",
                value.filter((p) => p.driverId !== "0").length,
                true,
              )}
            </styled.p>
          </Box>
        </Box>
      )}

      {!disabled && (
        <Box pos="relative">
          <Input
            placeholder="Type to search for people..."
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

              {!isLoading &&
                filteredResults.length === 0 &&
                !allowNewDrivers && (
                  <styled.p px={2} py={1} fontWeight="semibold">
                    No results found
                  </styled.p>
                )}

              {filteredResults.map((user) => {
                return (
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
                );
              })}

              {allowNewDrivers &&
                !isLoading &&
                filteredResults.length === 0 &&
                search
                  .trim()
                  .split(" ")
                  .every((part) => part.length > 0) && (
                  <Option
                    type="button"
                    onClick={() => {
                      onChange([
                        ...value,
                        {
                          driverId: search.trim(),
                          points: 100,
                          isNew: true,
                        },
                      ]);
                      setSearch("");
                    }}
                  >
                    Create "{search.trim()}" as a new driver
                  </Option>
                )}
            </Dropdown>
          )}
        </Box>
      )}
    </Box>
  );
};
