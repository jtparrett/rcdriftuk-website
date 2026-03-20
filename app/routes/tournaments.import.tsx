import { redirect, useFetcher } from "react-router";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { z } from "zod";
import { useState, useRef, useEffect } from "react";
import {
  RiUploadCloud2Line,
  RiCheckLine,
  RiUserLine,
  RiUserAddLine,
  RiFileExcel2Line,
  RiLoader4Line,
  RiDownloadLine,
  RiArrowLeftRightLine,
  RiCloseLine,
} from "react-icons/ri";
import { Box, Container, Flex, styled } from "~/styled-system/jsx";
import { Button } from "~/components/Button";
import { Input } from "~/components/Input";
import { Label } from "~/components/Label";
import { FormControl } from "~/components/FormControl";
import { Card, CardContent } from "~/components/CollapsibleCard";
import { Switch } from "~/components/Switch";
import { Dropdown, Option } from "~/components/Dropdown";
import { useUserSearch } from "~/hooks/useUserSearch";
import { getAuth } from "~/utils/getAuth.server";
import { getUser } from "~/utils/getUser.server";
import { parseImportFile } from "~/utils/parseImportFile.server";
import {
  mapBattleFields,
  type FieldMapping,
} from "~/utils/aiFieldMapping.server";
import {
  previewDriverMatches,
  createImportedTournament,
  type ImportBattleEntry,
} from "~/utils/importTournament.server";
import { pow2Ceil } from "~/utils/powFns";
import notFoundInvariant from "~/utils/notFoundInvariant";

// --- Types ---

interface AnalyzedDriver {
  parsedName: string;
  firstName: string;
  lastName: string | null;
  parsedDriverId: number | null;
  matchedDriverId: number | null;
  isNew: boolean;
}

interface AnalyzeResult {
  intent: "analyze";
  drivers: AnalyzedDriver[];
  battles: ImportBattleEntry[];
  battleMappings: FieldMapping[];
  error?: string;
}

interface CreateResult {
  intent: "create";
  error?: string;
}

// --- Loader ---

export const loader = async (args: LoaderFunctionArgs) => {
  const { userId } = await getAuth(args);
  if (!userId) {
    return redirect("/sign-in");
  }

  const user = await getUser(userId);
  notFoundInvariant(user, "User not found");

  return { userId, user };
};

// --- Action ---

export const action = async (args: ActionFunctionArgs) => {
  const { userId } = await getAuth(args);
  if (!userId) {
    throw new Response("Unauthorized", { status: 401 });
  }

  const user = await getUser(userId);
  notFoundInvariant(user, "User not found");

  const contentType = args.request.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    return handleCreate(args, userId, user.driverId);
  }

  return handleAnalyze(args);
};

async function handleAnalyze(args: ActionFunctionArgs): Promise<AnalyzeResult> {
  const formData = await args.request.formData();
  const battleFile = formData.get("battleFile") as File | null;

  if (!battleFile || battleFile.size === 0) {
    return {
      intent: "analyze",
      drivers: [],
      battles: [],
      battleMappings: [],
      error: "Please upload a battle results file.",
    };
  }

  try {
    const allDriverEntries: {
      name: string;
      firstName: string;
      lastName: string | null;
      parsedDriverId: number | null;
    }[] = [];
    const battles: ImportBattleEntry[] = [];

    const parsed = await parseImportFile(battleFile);
    const mapping = await mapBattleFields(parsed);
    const stripTrailingNumbers = mapping.namesHaveTrailingNumbers;

    const getColumn = (type: string) =>
      mapping.mappings.find((m) => m.mappedTo === type)?.column;

    const leftNameCol = getColumn("driver_left_name");
    const rightNameCol = getColumn("driver_right_name");
    const leftIdCol = getColumn("driver_left_id");
    const rightIdCol = getColumn("driver_right_id");
    const winnerNameCol = getColumn("winner_name");
    const winnerIdCol = getColumn("winner_id");
    const loserNameCol = getColumn("loser_name");
    const loserIdCol = getColumn("loser_id");
    const isWinnerLoserFormat =
      !leftNameCol &&
      !rightNameCol &&
      (winnerNameCol || winnerIdCol) &&
      (loserNameCol || loserIdCol);

    const driverMap = new Map<string, number>();

    const cleanName = (raw: string) => {
      const trimmed = raw.trim();
      return stripTrailingNumbers ? stripTrailingNumber(trimmed) : trimmed;
    };

    const findOrAddDriver = (
      name: string,
      idStr: string | undefined,
    ): number => {
      if (idStr) {
        const id = Number(idStr);
        if (!isNaN(id) && id > 0) {
          const key = `id:${id}`;
          if (driverMap.has(key)) return driverMap.get(key)!;
        }
      }

      const nameKey = name.trim().toLowerCase();
      if (driverMap.has(nameKey)) return driverMap.get(nameKey)!;

      const idx = allDriverEntries.length;
      const parts = name.trim().split(/\s+/);
      allDriverEntries.push({
        name: name.trim(),
        firstName: parts[0] || "",
        lastName: parts.length > 1 ? parts.slice(1).join(" ") : null,
        parsedDriverId: idStr ? Number(idStr) || null : null,
      });
      driverMap.set(nameKey, idx);
      return idx;
    };

    for (const row of parsed.rows) {
      let leftName: string;
      let rightName: string;
      let leftId: string | undefined;
      let rightId: string | undefined;

      if (isWinnerLoserFormat) {
        leftName = winnerNameCol ? cleanName(row[winnerNameCol] || "") : "";
        rightName = loserNameCol ? cleanName(row[loserNameCol] || "") : "";
        leftId = winnerIdCol ? row[winnerIdCol]?.trim() : undefined;
        rightId = loserIdCol ? row[loserIdCol]?.trim() : undefined;
      } else {
        leftName = leftNameCol ? cleanName(row[leftNameCol] || "") : "";
        rightName = rightNameCol ? cleanName(row[rightNameCol] || "") : "";
        leftId = leftIdCol ? row[leftIdCol]?.trim() : undefined;
        rightId = rightIdCol ? row[rightIdCol]?.trim() : undefined;
      }

      if (!leftName && !leftId) continue;
      if (!rightName && !rightId) continue;

      const driverLeftIndex = findOrAddDriver(leftName, leftId);
      const driverRightIndex = findOrAddDriver(rightName, rightId);

      let winnerIndex: number | null = null;

      if (isWinnerLoserFormat) {
        winnerIndex = driverLeftIndex;
      } else if (winnerNameCol || winnerIdCol) {
        const rawWinnerName = winnerNameCol
          ? cleanName(row[winnerNameCol] || "")
          : "";
        const winnerId = winnerIdCol ? row[winnerIdCol]?.trim() : undefined;

        if (rawWinnerName || winnerId) {
          const wKey = winnerId
            ? `id:${Number(winnerId)}`
            : rawWinnerName.toLowerCase();
          if (driverMap.has(wKey)) {
            winnerIndex = driverMap.get(wKey)!;
          }
        }
      }

      battles.push({ driverLeftIndex, driverRightIndex, winnerIndex });
    }

    const matchedDrivers = await previewDriverMatches(allDriverEntries);

    return {
      intent: "analyze",
      drivers: matchedDrivers,
      battles,
      battleMappings: mapping.mappings,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Analysis failed";
    return {
      intent: "analyze",
      drivers: [],
      battles: [],
      battleMappings: [],
      error: message,
    };
  }
}

async function handleCreate(
  args: ActionFunctionArgs,
  userId: string,
  ownerDriverId: number,
) {
  try {
    const body = await args.request.json();
    const schema = z.object({
      name: z.string().min(1),
      hasPlayoff: z.boolean(),
      drivers: z.array(
        z.object({
          parsedName: z.string(),
          firstName: z.string(),
          lastName: z.string().nullable(),
          parsedDriverId: z.number().nullable(),
          matchedDriverId: z.number().nullable(),
          isNew: z.boolean(),
        }),
      ),
      battles: z.array(
        z.object({
          driverLeftIndex: z.number(),
          driverRightIndex: z.number(),
          winnerIndex: z.number().nullable(),
        }),
      ),
    });

    const data = schema.parse(body);

    const tournamentId = await createImportedTournament({
      name: data.name,
      userId,
      ownerDriverId,
      drivers: data.drivers,
      battles: data.battles,
      hasPlayoff: data.hasPlayoff,
    });

    return redirect(`/tournaments/${tournamentId}/setup`);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Import failed";
    return { intent: "create" as const, error: message };
  }
}

// --- Component ---

export default function TournamentImportPage() {
  const analyzeFetcher = useFetcher<AnalyzeResult>();
  const createFetcher = useFetcher<CreateResult>();

  const [tournamentName, setTournamentName] = useState("Imported Tournament");
  const [hasPlayoff, setHasPlayoff] = useState(false);
  const [drivers, setDrivers] = useState<AnalyzedDriver[]>([]);
  const [step, setStep] = useState<"upload" | "review">("upload");
  const battleInputRef = useRef<HTMLInputElement>(null);

  const analyzeData = analyzeFetcher.data;
  const isAnalyzing = analyzeFetcher.state !== "idle";
  const isCreating = createFetcher.state !== "idle";

  const createData = createFetcher.data as CreateResult | undefined;

  useEffect(() => {
    if (analyzeData && !analyzeData.error && !isAnalyzing) {
      setDrivers(analyzeData.drivers);
      setStep("review");
    }
  }, [analyzeData, isAnalyzing]);

  const handleAnalyze = () => {
    const formData = new FormData();
    const bFile = battleInputRef.current?.files?.[0];
    if (bFile) formData.append("battleFile", bFile);

    analyzeFetcher.submit(formData, {
      method: "post",
      encType: "multipart/form-data",
    });
  };

  const handleCreate = () => {
    if (!analyzeData) return;

    createFetcher.submit(
      JSON.stringify({
        name: tournamentName,
        hasPlayoff,
        drivers,
        battles: analyzeData.battles,
      }),
      {
        method: "post",
        encType: "application/json",
      },
    );
  };

  return (
    <Container maxW="700px" py={8}>
      <styled.h1
        fontSize={{ base: "2xl", md: "3xl" }}
        fontWeight="extrabold"
        mb={2}
      >
        Import Tournament
      </styled.h1>

      {step === "upload" && (
        <UploadStep
          battleInputRef={battleInputRef}
          isAnalyzing={isAnalyzing}
          error={analyzeData?.error}
          onAnalyze={handleAnalyze}
        />
      )}

      {step === "review" && analyzeData && !analyzeData.error && (
        <ReviewStep
          data={analyzeData}
          drivers={drivers}
          onDriversChange={setDrivers}
          tournamentName={tournamentName}
          onTournamentNameChange={setTournamentName}
          hasPlayoff={hasPlayoff}
          onHasPlayoffChange={setHasPlayoff}
          isCreating={isCreating}
          createError={createData?.error}
          onBack={() => setStep("upload")}
          onCreate={handleCreate}
        />
      )}
    </Container>
  );
}

// --- Upload Step ---

function UploadStep({
  battleInputRef,
  isAnalyzing,
  error,
  onAnalyze,
}: {
  battleInputRef: React.RefObject<HTMLInputElement | null>;
  isAnalyzing: boolean;
  error?: string;
  onAnalyze: () => void;
}) {
  const [battleFileName, setBattleFileName] = useState<string>("");

  return (
    <Flex direction="column" gap={5}>
      <styled.p color="gray.400" fontSize="sm">
        Upload your battle results file. We'll use AI to understand the file
        format, match drivers, and create a tournament.
      </styled.p>

      <Card>
        <CardContent>
          <FormControl>
            <Flex justifyContent="space-between" alignItems="center" mb={1}>
              <Label mb={0}>Battle Results (CSV or Excel)</Label>
              <styled.a
                href="/examples/battles-example.csv"
                download
                fontSize="xs"
                color="gray.500"
                display="inline-flex"
                alignItems="center"
                gap={1}
                _hover={{ color: "gray.300" }}
              >
                <RiDownloadLine />
                Example file
              </styled.a>
            </Flex>
            <FileUploadButton
              inputRef={battleInputRef}
              fileName={battleFileName}
              onFileChange={setBattleFileName}
            />
          </FormControl>
        </CardContent>
      </Card>

      {error && (
        <styled.p color="brand.500" fontSize="sm">
          {error}
        </styled.p>
      )}

      <Button
        onClick={onAnalyze}
        disabled={isAnalyzing}
        isLoading={isAnalyzing}
      >
        {isAnalyzing ? (
          <>
            <RiLoader4Line /> Analyzing...
          </>
        ) : (
          <>
            <RiUploadCloud2Line /> Analyze File
          </>
        )}
      </Button>
    </Flex>
  );
}

// --- File Upload Button ---

function FileUploadButton({
  inputRef,
  fileName,
  onFileChange,
}: {
  inputRef: React.RefObject<HTMLInputElement | null>;
  fileName: string;
  onFileChange: (name: string) => void;
}) {
  return (
    <Box>
      <input
        ref={inputRef}
        type="file"
        accept=".csv,.xlsx,.xls"
        style={{ display: "none" }}
        onChange={(e) => {
          onFileChange(e.target.files?.[0]?.name || "");
        }}
      />
      <Flex
        onClick={() => inputRef.current?.click()}
        alignItems="center"
        gap={3}
        p={4}
        borderWidth={1}
        borderColor="gray.700"
        borderStyle="dashed"
        rounded="xl"
        cursor="pointer"
        transition="all .18s"
        _hover={{ borderColor: "gray.500", bgColor: "gray.800/50" }}
      >
        {fileName ? (
          <>
            <RiFileExcel2Line color="var(--colors-green-400)" />
            <styled.span fontSize="sm" color="gray.200">
              {fileName}
            </styled.span>
          </>
        ) : (
          <>
            <RiUploadCloud2Line color="var(--colors-gray-500)" />
            <styled.span fontSize="sm" color="gray.500">
              Click to select a file...
            </styled.span>
          </>
        )}
      </Flex>
    </Box>
  );
}

// --- Review Step ---

function ReviewStep({
  data,
  drivers,
  onDriversChange,
  tournamentName,
  onTournamentNameChange,
  hasPlayoff,
  onHasPlayoffChange,
  isCreating,
  createError,
  onBack,
  onCreate,
}: {
  data: AnalyzeResult;
  drivers: AnalyzedDriver[];
  onDriversChange: (drivers: AnalyzedDriver[]) => void;
  tournamentName: string;
  onTournamentNameChange: (name: string) => void;
  hasPlayoff: boolean;
  onHasPlayoffChange: (v: boolean) => void;
  isCreating: boolean;
  createError?: string;
  onBack: () => void;
  onCreate: () => void;
}) {
  const existingCount = drivers.filter((d) => !d.isNew).length;
  const newCount = drivers.filter((d) => d.isNew).length;
  const bracketSize = pow2Ceil(
    hasPlayoff ? data.battles.length : data.battles.length + 1,
  );

  const usedDriverIds = new Set(
    drivers.filter((d) => d.matchedDriverId).map((d) => d.matchedDriverId!),
  );

  const handleSwap = (
    index: number,
    user: {
      driverId: number;
      firstName: string | null;
      lastName: string | null;
    },
  ) => {
    const updated = [...drivers];
    updated[index] = {
      ...updated[index],
      matchedDriverId: user.driverId,
      firstName: user.firstName || updated[index].firstName,
      lastName: user.lastName,
      isNew: false,
    };
    onDriversChange(updated);
  };

  const handleResetToNew = (index: number) => {
    const updated = [...drivers];
    const original = data.drivers[index];
    updated[index] = {
      ...updated[index],
      matchedDriverId: null,
      firstName: original.firstName,
      lastName: original.lastName,
      isNew: true,
    };
    onDriversChange(updated);
  };

  return (
    <Flex direction="column" gap={5}>
      <Card>
        <CardContent>
          <FormControl>
            <Label>Tournament Name</Label>
            <Input
              value={tournamentName}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                onTournamentNameChange(e.target.value)
              }
            />
          </FormControl>
        </CardContent>
      </Card>

      {data.battleMappings.length > 0 && (
        <Card>
          <CardContent>
            <styled.h3 fontSize="lg" fontWeight="bold" mb={3}>
              Field Mapping
            </styled.h3>
            <Flex direction="column" gap={1}>
              {data.battleMappings
                .filter((m) => m.mappedTo !== "ignore")
                .map((m) => (
                  <Flex
                    key={m.column}
                    justifyContent="space-between"
                    alignItems="center"
                    py={1.5}
                    px={3}
                    rounded="lg"
                    bgColor="gray.800/50"
                    fontSize="sm"
                  >
                    <styled.span color="gray.300">{m.column}</styled.span>
                    <styled.span color="green.400" fontWeight="medium">
                      {formatMappingLabel(m.mappedTo)}
                    </styled.span>
                  </Flex>
                ))}
            </Flex>
          </CardContent>
        </Card>
      )}

      <Card overflow="visible">
        <CardContent>
          <styled.h3 fontSize="lg" fontWeight="bold" mb={3}>
            Drivers ({drivers.length})
            {existingCount > 0 && newCount > 0 && (
              <styled.span
                fontSize="sm"
                fontWeight="normal"
                color="gray.500"
                ml={2}
              >
                {existingCount} matched, {newCount} new
              </styled.span>
            )}
          </styled.h3>

          <Flex direction="column" gap={1}>
            {drivers.map((d, i) => (
              <DriverRow
                key={i}
                driver={d}
                originalName={data.drivers[i]?.parsedName ?? d.parsedName}
                usedDriverIds={usedDriverIds}
                onSwap={(user) => handleSwap(i, user)}
                onResetToNew={() => handleResetToNew(i)}
              />
            ))}
          </Flex>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <styled.h3 fontSize="lg" fontWeight="bold" mb={3}>
            Options
          </styled.h3>

          <Flex alignItems="center" justifyContent="space-between" mb={4}>
            <Flex direction="column">
              <styled.span fontSize="sm" color="gray.200">
                Includes 3rd place playoff
              </styled.span>
              <styled.span fontSize="xs" color="gray.500">
                Enable if the last-but-one battle is a 3rd place match
              </styled.span>
            </Flex>
            <Switch checked={hasPlayoff} onChange={onHasPlayoffChange} />
          </Flex>

          <Flex direction="column" gap={1.5} fontSize="sm" color="gray.300">
            <styled.p>
              {data.battles.length} battles &rarr; Top{" "}
              <styled.span fontWeight="bold" color="white">
                {bracketSize}
              </styled.span>{" "}
              bracket
            </styled.p>
            <styled.p color="gray.500">You will be added as the judge</styled.p>
          </Flex>
        </CardContent>
      </Card>

      {createError && (
        <styled.p color="brand.500" fontSize="sm">
          {createError}
        </styled.p>
      )}

      <Flex gap={3}>
        <Button onClick={onBack} variant="secondary" disabled={isCreating}>
          Back
        </Button>
        <Button
          onClick={onCreate}
          disabled={isCreating || !tournamentName.trim()}
          isLoading={isCreating}
          flex={1}
        >
          {isCreating ? (
            <>
              <RiLoader4Line /> Creating...
            </>
          ) : (
            <>
              <RiCheckLine /> Create Tournament
            </>
          )}
        </Button>
      </Flex>
    </Flex>
  );
}

// --- Driver Row with swap ---

function DriverRow({
  driver,
  originalName,
  usedDriverIds,
  onSwap,
  onResetToNew,
}: {
  driver: AnalyzedDriver;
  originalName: string;
  usedDriverIds: Set<number>;
  onSwap: (user: {
    driverId: number;
    firstName: string | null;
    lastName: string | null;
  }) => void;
  onResetToNew: () => void;
}) {
  const [isSearching, setIsSearching] = useState(false);
  const [search, setSearch] = useState("");
  const { data: results = [], isLoading } = useUserSearch(search);
  const inputRef = useRef<HTMLInputElement>(null);

  const filteredResults = results.filter((u) => !usedDriverIds.has(u.driverId));

  useEffect(() => {
    if (isSearching) {
      inputRef.current?.focus();
    }
  }, [isSearching]);

  if (isSearching) {
    return (
      <Box pos="relative">
        <Flex gap={2} alignItems="center">
          <Box flex={1}>
            <Input
              ref={inputRef}
              placeholder={`Replace "${originalName}"...`}
              value={search}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setSearch(e.target.value)
              }
              onBlur={() => {
                setTimeout(() => {
                  const active = document.activeElement;
                  const listbox = document.querySelector('[role="listbox"]');
                  if (!listbox?.contains(active)) {
                    setIsSearching(false);
                    setSearch("");
                  }
                }, 200);
              }}
            />
          </Box>
          <styled.button
            type="button"
            onClick={() => {
              setIsSearching(false);
              setSearch("");
            }}
            color="gray.500"
            cursor="pointer"
            _hover={{ color: "gray.300" }}
            p={1}
            flexShrink={0}
          >
            <RiCloseLine size={16} />
          </styled.button>
        </Flex>

        {search.length > 0 && (
          <Dropdown role="listbox">
            {isLoading && (
              <styled.p px={2} py={1} color="gray.500" fontSize="sm">
                Searching...
              </styled.p>
            )}

            {!isLoading && filteredResults.length === 0 && (
              <styled.p px={2} py={1} color="gray.500" fontSize="sm">
                No results
              </styled.p>
            )}

            {filteredResults.map((user) => (
              <Option
                key={user.driverId}
                type="button"
                onMouseDown={(e: React.MouseEvent) => e.preventDefault()}
                onClick={() => {
                  onSwap({
                    driverId: user.driverId,
                    firstName: user.firstName,
                    lastName: user.lastName,
                  });
                  setIsSearching(false);
                  setSearch("");
                }}
              >
                <Flex alignItems="center" gap={2} fontSize="sm">
                  <styled.img
                    src={user.image ?? "/blank-driver-right.jpg"}
                    alt={user.firstName ?? ""}
                    w={5}
                    h={5}
                    rounded="full"
                    objectFit="cover"
                    flexShrink={0}
                  />
                  <styled.span>
                    {user.firstName} {user.lastName}
                  </styled.span>
                  <styled.span color="gray.500" ml="auto">
                    #{user.driverId}
                  </styled.span>
                </Flex>
              </Option>
            ))}
          </Dropdown>
        )}
      </Box>
    );
  }

  const isNew = driver.isNew;
  const wasSwapped =
    driver.parsedName !== originalName ||
    (!isNew && driver.matchedDriverId !== null);
  const displayName = isNew
    ? driver.parsedName
    : `${driver.firstName} ${driver.lastName ?? ""}`.trim();

  return (
    <Flex
      alignItems="center"
      gap={2}
      py={1.5}
      px={3}
      rounded="lg"
      bgColor="gray.800/50"
      fontSize="sm"
    >
      {isNew ? (
        <RiUserAddLine color="var(--colors-yellow-400)" size={14} />
      ) : (
        <RiUserLine color="var(--colors-green-400)" size={14} />
      )}

      <Flex direction="column" flex={1} minW={0}>
        <Flex alignItems="center" gap={1.5}>
          <styled.span
            color="gray.200"
            whiteSpace="nowrap"
            overflow="hidden"
            textOverflow="ellipsis"
          >
            {displayName}
          </styled.span>
          {!isNew && (
            <styled.span color="gray.500" flexShrink={0}>
              #{driver.matchedDriverId}
            </styled.span>
          )}
          {isNew && (
            <styled.span color="yellow.400" flexShrink={0}>
              new
            </styled.span>
          )}
        </Flex>
        {originalName !== displayName && (
          <styled.span color="gray.600" fontSize="xs">
            from: {originalName}
          </styled.span>
        )}
      </Flex>

      <Flex gap={1} flexShrink={0}>
        {!isNew && wasSwapped && (
          <styled.button
            type="button"
            onClick={onResetToNew}
            color="gray.600"
            cursor="pointer"
            _hover={{ color: "gray.400" }}
            p={1}
            title="Reset to create new"
          >
            <RiCloseLine size={14} />
          </styled.button>
        )}
        <styled.button
          type="button"
          onClick={() => setIsSearching(true)}
          color="gray.600"
          cursor="pointer"
          _hover={{ color: "gray.300" }}
          p={1}
          title="Swap driver"
        >
          <RiArrowLeftRightLine size={14} />
        </styled.button>
      </Flex>
    </Flex>
  );
}

// --- Helpers ---

function stripTrailingNumber(name: string): string {
  const match = name.match(/^(.+?)\s+\d+$/);
  return match ? match[1].trim() : name;
}

function formatMappingLabel(mappedTo: string): string {
  const labels: Record<string, string> = {
    driver_left_name: "Driver Left",
    driver_right_name: "Driver Right",
    driver_left_id: "Driver Left ID",
    driver_right_id: "Driver Right ID",
    winner_name: "Winner",
    winner_id: "Winner ID",
    loser_name: "Loser",
    loser_id: "Loser ID",
    round: "Round",
    bracket: "Bracket",
  };
  return labels[mappedTo] || mappedTo;
}
