import inquirer from "inquirer";
import sqlite3 from "sqlite3";
import xlsx from "xlsx";
import fs from "fs";
import path from "path";
import { promisify } from "util";

// Enable verbose mode for SQLite
const sqlite = sqlite3.verbose();

// Function to browse and select a file
async function selectFile(fileType, extensions) {
  const answers = await inquirer.prompt([
    {
      type: "input",
      name: "filePath",
      message: `Select your ${fileType} file:`,
      validate: (input) =>
        fs.existsSync(input) && extensions.some((ext) => input.endsWith(ext))
          ? true
          : `File not found or invalid format! Allowed: ${extensions.join(
              ", "
            )}`,
    },
  ]);
  return answers.filePath;
}

// Function to select a table from the database
async function selectTable(db) {
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
async function getTables(db) {
  return new Promise((resolve, reject) => {
    db.all("SELECT name FROM sqlite_master WHERE type='table'", (err, rows) => {
      if (err) reject(err);
      else resolve(rows.map((row) => row.name));
    });
  });
}

// Function to get column names from a table
async function getColumns(db, table) {
  return new Promise((resolve, reject) => {
    db.all(`PRAGMA table_info(${table})`, (err, rows) => {
      if (err) reject(err);
      else resolve(rows.map((row) => row.name));
    });
  });
}

// Function to read Excel data
function readExcel(filePath) {
  const workbook = xlsx.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  return xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);
}

async function insertData(db, table, columns, data) {
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

// Main function
async function migrateData() {
  try {
    const excelFilePath = await selectFile("Excel", [".xlsx", ".xls"]);
    console.log(`Selected Excel File: ${excelFilePath}`);

    const dbPath = await selectFile("SQLite Database", [".db"]);
    console.log(`Selected Database File: ${dbPath}`);

    const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE, (err) => {
      if (err) {
        console.error("Error opening database:", err.message);
        return;
      }
    });

    const table = await selectTable(db);
    console.log(`Selected Table: ${table}`);

    const dbColumns = await getColumns(db, table);
    console.log(`Table Columns: ${dbColumns.join(", ")}`);

    const excelData = readExcel(excelFilePath);
    if (excelData.length === 0) throw new Error("Excel file is empty!");

    const excelColumns = Object.keys(excelData[0]);
    console.log(`Excel Columns: ${excelColumns.join(", ")}`);

    // Check if columns match
    if (!excelColumns.every((col) => dbColumns.includes(col))) {
      throw new Error("Excel columns do not match database table columns!");
    }

    // Insert data
    await insertData(db, table, excelColumns, excelData);

    db.close();
  } catch (error) {
    console.error("Error:", error.message);
  }
}

// Run the migration
migrateData();
