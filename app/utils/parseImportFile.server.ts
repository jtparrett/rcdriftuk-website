import Papa from "papaparse";
import * as XLSX from "xlsx";

export interface ParsedFile {
  headers: string[];
  rows: Record<string, string>[];
}

export async function parseImportFile(file: File): Promise<ParsedFile> {
  const name = file.name.toLowerCase();

  if (name.endsWith(".xlsx") || name.endsWith(".xls")) {
    return parseExcelFile(file);
  }

  return parseCsvFile(file);
}

async function parseCsvFile(file: File): Promise<ParsedFile> {
  const text = await file.text();
  const result = Papa.parse<Record<string, string>>(text, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (header) => header.trim(),
  });

  if (result.errors.length > 0 && result.data.length === 0) {
    throw new Error("Failed to parse CSV file");
  }

  return {
    headers: result.meta.fields || [],
    rows: result.data,
  };
}

async function parseExcelFile(file: File): Promise<ParsedFile> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "array" });
  const firstSheetName = workbook.SheetNames[0];

  if (!firstSheetName) {
    throw new Error("Excel file has no sheets");
  }

  const sheet = workbook.Sheets[firstSheetName];
  const jsonRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
    defval: "",
  });

  if (jsonRows.length === 0) {
    throw new Error("Excel sheet is empty");
  }

  const headers = Object.keys(jsonRows[0]);
  const rows = jsonRows.map((row) => {
    const record: Record<string, string> = {};
    for (const key of headers) {
      record[key] = String(row[key] ?? "");
    }
    return record;
  });

  return { headers, rows };
}
