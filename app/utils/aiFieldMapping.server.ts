import OpenAI from "openai";
import type { ParsedFile } from "./parseImportFile.server";

let _openai: OpenAI | null = null;
function getOpenAI() {
  if (!_openai) {
    _openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return _openai;
}

export type BattleFieldType =
  | "driver_left_name"
  | "driver_right_name"
  | "driver_left_id"
  | "driver_right_id"
  | "winner_name"
  | "winner_id"
  | "loser_name"
  | "loser_id"
  | "round"
  | "bracket"
  | "ignore";

export interface FieldMapping {
  column: string;
  mappedTo: string;
}

export interface BattleMapping {
  mappings: FieldMapping[];
  namesHaveTrailingNumbers: boolean;
}

export async function mapBattleFields(
  file: ParsedFile,
): Promise<BattleMapping> {
  const sampleRows = file.rows.slice(0, 5);

  const response = await getOpenAI().chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: `You are a data mapping assistant. Given column headers and sample data from a battle/tandem results spreadsheet for an RC drift tournament, map each column to one of these field types:

- "driver_left_name": Name of the left/first driver in the battle
- "driver_right_name": Name of the right/second driver in the battle
- "driver_left_id": Numeric ID of the left driver
- "driver_right_id": Numeric ID of the right driver
- "winner_name": Name of the battle winner
- "winner_id": Numeric ID of the winner
- "loser_name": Name of the battle loser
- "loser_id": Numeric ID of the loser
- "round": The bracket round number
- "bracket": Upper or lower bracket indicator
- "ignore": Column should be ignored

Rules:
- "Driver 1" / "Driver A" / "Lead" type columns should map to driver_left
- "Driver 2" / "Driver B" / "Chase" type columns should map to driver_right
- "Winner" / "Victor" columns with driver names map to winner_name
- "Loser" / "Defeated" columns with driver names map to loser_name
- If the file only has "winner" and "loser" columns (no explicit left/right drivers), map them as winner_name and loser_name
- Also detect if driver name values contain trailing numbers that look like car/driver numbers (e.g. "John Smith 39" where 39 is a car number, not part of the name). Set namesHaveTrailingNumbers to true if so.
- Return JSON: { "mappings": [{ "column": "...", "mappedTo": "..." }], "namesHaveTrailingNumbers": <boolean> }`,
      },
      {
        role: "user",
        content: `Headers: ${JSON.stringify(file.headers)}\n\nSample rows:\n${JSON.stringify(sampleRows, null, 2)}`,
      },
    ],
  });

  const content = response.choices[0]?.message?.content;
  if (!content) throw new Error("No response from AI for battle mapping");

  const parsed = JSON.parse(content) as {
    mappings: FieldMapping[];
    namesHaveTrailingNumbers?: boolean;
  };

  return {
    mappings: parsed.mappings,
    namesHaveTrailingNumbers: parsed.namesHaveTrailingNumbers ?? false,
  };
}
