import { styled, Box, Flex } from "~/styled-system/jsx";
import { Input } from "./Input";
import { Button } from "./Button";
import type { GetUsers } from "~/utils/getUsers.server";
import { useMemo, useState } from "react";
import { RiDeleteBinFill, RiDraggable } from "react-icons/ri";
import { Dropdown, Option } from "./Dropdown";
import { Reorder } from "motion/react";
import pluralize from "pluralize";

interface PeopleFormProps {
  users: GetUsers;
  name: string;
  allowNewDrivers?: boolean;
  allowPoints?: boolean;
  disabled?: boolean;
  onChange: (value: { driverId: string; points?: number }[]) => void;
  value: { driverId: string; points?: number }[];
}

export const PeopleForm = ({
  users,
  value,
  onChange,
  name,
  allowNewDrivers = false,
  allowPoints = false,
  disabled = false,
}: PeopleFormProps) => {
  const [focused, setFocused] = useState(false);
  const [search, setSearch] = useState("");

  const filteredUsers = useMemo(() => {
    return users.filter(
      (user) =>
        !value.some((v) => v.driverId === user.driverId.toString()) &&
        `${user.firstName} ${user.lastName}`
          .toLowerCase()
          .includes(search.toLowerCase()),
    );
  }, [users, value, search]);

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
                const user = users.find(
                  (user) => user.driverId.toString() === person.driverId,
                );

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

                      <styled.p
                        flex={1}
                        userSelect="none"
                        whiteSpace="nowrap"
                        textOverflow="ellipsis"
                        overflow="hidden"
                        py={1}
                      >
                        {user ? (
                          <>
                            {user.firstName} {user.lastName}{" "}
                            <styled.span
                              color="gray.500"
                              fontSize="sm"
                              verticalAlign="middle"
                            >
                              #{person.driverId}
                            </styled.span>
                          </>
                        ) : (
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
                                {points * 10}
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
              {pluralize("People", value.length, true)}
            </styled.p>
          </Box>
        </Box>
      )}

      {!disabled && (
        <Box pos="relative">
          <Input
            placeholder="Type to search for people..."
            onBlur={(_e) => {
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
              {filteredUsers.map((user) => {
                return (
                  <Option
                    key={user.driverId}
                    type="button"
                    onClick={() => {
                      onChange([
                        ...value,
                        {
                          driverId: user.driverId.toString(),
                          points: 100,
                        },
                      ]);
                      setSearch("");
                    }}
                  >
                    {user.firstName} {user.lastName} (#{user.driverId})
                  </Option>
                );
              })}

              {!allowNewDrivers && filteredUsers.length === 0 && (
                <styled.p px={2} py={1} fontWeight="semibold">
                  No results found
                </styled.p>
              )}

              {allowNewDrivers &&
                filteredUsers.length === 0 &&
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
