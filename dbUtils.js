// dbUtils.js
import sqlite3 from "sqlite3";
import xlsx from "xlsx";
import fs from "fs";
import inquirer from "inquirer";

// Enable verbose mode for SQLite
const sqlite = sqlite3.verbose();
const CONFIG_FILE = "config.json"; // File to store last used paths

// Load last used paths
function loadConfig() {
  if (fs.existsSync(CONFIG_FILE)) {
    return JSON.parse(fs.readFileSync(CONFIG_FILE, "utf8"));
  }
  return {};
}

// Save last used paths
function saveConfig(data) {
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(data, null, 2));
}

// Function to browse and select a file with prefilled last used path
export async function selectFile(fileType, extensions, key) {
  const config = loadConfig();
  const defaultPath = config[key] || "";

  const answers = await inquirer.prompt([
    {
      type: "input",
      name: "filePath",
      message: `Select your ${fileType} file:`,
      default: defaultPath, // Prefill with last used path
      validate: (input) =>
        fs.existsSync(input) && extensions.some((ext) => input.endsWith(ext))
          ? true
          : `File not found or invalid format! Allowed: ${extensions.join(
              ", "
            )}`,
    },
  ]);

  // Save selected path
  config[key] = answers.filePath;
  saveConfig(config);

  return answers.filePath;
}

// Function to select a table from the database
export async function selectTable(db) {
  const allTables = await getTables(db);
  if (allTables.length === 0)
    throw new Error("No tables found in the database.");

  const answers = await inquirer.prompt([
    {
      type: "list",
      name: "table",
      message: "Select the table to insert data:",
      choices: allTables,
    },
  ]);

  return answers.table;
}

// Function to get tables from the database
export async function getTables(db) {
  return new Promise((resolve, reject) => {
    db.all("SELECT name FROM sqlite_master WHERE type='table'", (err, rows) => {
      if (err) reject(err);
      else resolve(rows.map((row) => row.name));
    });
  });
}

// Function to get column names from a table
export async function getColumns(db, table) {
  return new Promise((resolve, reject) => {
    db.all(`PRAGMA table_info(${table})`, (err, rows) => {
      if (err) reject(err);
      else resolve(rows.map((row) => row.name));
    });
  });
}

// Function to read Excel data
export function readExcel(filePath) {
  const workbook = xlsx.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  return xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);
}

// Function to insert data into SQLite
export async function insertData(db, table, columns, data) {
  const placeholders = columns.map(() => "?").join(",");
  const query = `INSERT INTO ${table} (${columns.join(
    ","
  )}) VALUES (${placeholders})`;

  try {
    // Prepare statement
    const stmt = await new Promise((resolve, reject) => {
      db.prepare(query, function (err) {
        if (err) reject(err);
        else resolve(this);
      });
    });

    // Insert each row
    for (const row of data) {
      const values = columns.map((col) => row[col]);
      await new Promise((resolve, reject) => {
        stmt.run(values, function (err) {
          if (err) reject(err);
          else resolve();
        });
      });
    }

    // Finalize statement
    await new Promise((resolve, reject) => {
      stmt.finalize((err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    console.log("Data inserted successfully.");
  } catch (err) {
    console.error("Error inserting data:", err.message);
  }
}
