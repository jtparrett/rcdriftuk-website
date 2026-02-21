import { useState, useRef, useEffect, useMemo } from "react";
import { Box, Flex, styled } from "~/styled-system/jsx";
import { Textarea } from "./Textarea";
import { Dropdown, Option } from "./Dropdown";
import { useUserSearch, type SearchUser } from "~/hooks/useUserSearch";

interface MentionInfo {
  start: number;
  end: number;
  query: string;
}

const findCurrentMention = (
  text: string,
  cursorPosition: number,
): MentionInfo | null => {
  let atIndex = -1;
  for (let i = cursorPosition - 1; i >= 0; i--) {
    if (text[i] === "@") {
      atIndex = i;
      break;
    }
    if (text[i] === " " || text[i] === "\n") {
      break;
    }
  }

  if (atIndex === -1) return null;

  let endIndex = cursorPosition;
  for (let i = atIndex + 1; i < text.length; i++) {
    if (text[i] === " " || text[i] === "\n") {
      endIndex = i;
      break;
    }
    if (i === text.length - 1) {
      endIndex = i + 1;
      break;
    }
  }

  const query = text.slice(atIndex + 1, cursorPosition);

  return {
    start: atIndex,
    end: endIndex,
    query,
  };
};

export const UserTaggingInput = ({
  value,
  onChange,
  placement = "bottom",
  ...props
}: {
  value: string;
  onChange: (value: string) => void;
  placement?: "top" | "bottom";
} & Omit<React.ComponentProps<typeof Textarea>, "onChange" | "value">) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [cursorPosition, setCursorPosition] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);

  const currentMention = useMemo(() => {
    return findCurrentMention(value, cursorPosition);
  }, [value, cursorPosition]);

  const { data: users = [], isLoading } = useUserSearch(
    currentMention?.query || "",
  );

  const handleTextareaChange = (newValue: string) => {
    onChange(newValue);

    // Update cursor position after change
    setTimeout(() => {
      if (textareaRef.current) {
        setCursorPosition(textareaRef.current.selectionStart || 0);
      }
    }, 300);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Escape" && showDropdown) {
      setShowDropdown(false);
      e.preventDefault();
    }

    props.onKeyDown?.(e);
  };

  const handleSelectionChange = () => {
    if (textareaRef.current) {
      setCursorPosition(textareaRef.current.selectionStart || 0);
    }
  };

  const handleUserSelect = (user: SearchUser) => {
    if (!currentMention) return;

    const userName = `${user.firstName || ""} ${user.lastName || ""}`.trim();
    const replacement = `@${user.driverId}(${userName})`;

    const newValue =
      value.slice(0, currentMention.start) +
      replacement +
      value.slice(currentMention.end);

    onChange(newValue);
    setShowDropdown(false);

    // Move cursor to after the replacement
    setTimeout(() => {
      if (textareaRef.current) {
        const newPosition = currentMention.start + replacement.length;
        textareaRef.current.setSelectionRange(newPosition, newPosition);
        textareaRef.current.focus();
        setCursorPosition(newPosition);
      }
    }, 300);
  };

  // Show dropdown when we have a current mention with a query
  useEffect(() => {
    const shouldShow = currentMention && currentMention.query.length > 0;
    setShowDropdown(!!shouldShow);
  }, [currentMention]);

  return (
    <Box pos="relative">
      <Textarea
        ref={textareaRef}
        enterKeyHint="enter"
        value={value}
        onChange={(e) => handleTextareaChange(e.target.value)}
        onKeyDown={handleKeyDown}
        onSelect={handleSelectionChange}
        onFocus={() => {
          if (textareaRef.current) {
            setCursorPosition(textareaRef.current.selectionStart || 0);
          }
        }}
        onBlur={(e) => {
          // Delay hiding dropdown to allow for clicks
          setTimeout(() => {
            const active = document.activeElement;
            const dropdown = document.querySelector('[role="listbox"]');
            if (!dropdown?.contains(active)) {
              setShowDropdown(false);
            }
          }, 150);

          props.onBlur?.(e);
        }}
        {...props}
      />

      {showDropdown && currentMention && (
        <Dropdown
          role="listbox"
          top={placement === "top" ? "unset" : "100%"}
          bottom={placement === "top" ? "100%" : "unset"}
          mt={placement === "top" ? 0 : 1}
          mb={placement === "top" ? 1 : 0}
        >
          {isLoading && (
            <Box px={2} py={1} color="gray.500">
              Searching...
            </Box>
          )}

          {!isLoading && users.length === 0 && (
            <Box px={2} py={1} color="gray.500">
              No users found
            </Box>
          )}

          {users.map((user) => (
            <Option
              key={user.driverId}
              type="button"
              onClick={() => handleUserSelect(user)}
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
  );
};
