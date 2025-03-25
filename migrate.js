import sqlite3 from "sqlite3";
import {
  selectFile,
  selectTable,
  getColumns,
  readExcel,
  insertData,
} from "./dbUtils.js";

// --------------------------------------------------------------------------------------------------------------------------------------------------------
// The code below is a simple script that reads an Excel file and migrates the data to an SQLite database.
// It uses the sqlite3 module to interact with the SQLite database and the exceljs module to read the Excel file.

// The script contains the following functions:

// selectFile : Opens a file dialog to select a file.
// selectTable : Prompts the user to select a table from the database.
// getColumns : Retrieves the columns of a table from the database.
// readExcel : Reads an Excel file and returns the data as an array of objects.
// insertData : Inserts data into a table in the database.

// The  migrateData function is the main function that orchestrates the migration process.
// It first prompts the user to select an Excel file and a database file.
// Then, it asks the user to select a table from the database.
// It reads the Excel file and retrieves the columns of the selected table from the database.
// If the columns in the Excel file match the columns in the database table, it inserts the data into the table.
// Finally, it closes the database connection.

// To run the script, save it as  migrate.js  and execute it using Node.js:
// node migrate.js --> write this command in terminal
// --------------------------------------------------------------------------------------------------------------------------------------------------------

const sqlite = sqlite3.verbose();

// Main function
async function migrateData() {
  try {
    const excelFilePath = await selectFile("Excel", [".xlsx", ".xls"]);
    console.log(`Selected Excel File: ${excelFilePath}`);

    const dbPath = await selectFile("SQLite Database", [".db"]);
    console.log(`Selected Database File: ${dbPath}`);

    const db = new sqlite.Database(dbPath, sqlite3.OPEN_READWRITE, (err) => {
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

migrateData();
