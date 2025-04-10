Absolutely! Here's a detailed `README.md` file you can use for your **Excel-to-SQLite Migration Utility** project:

---

# 📊 Excel to SQLite Migration Utility

This Node.js utility allows users to **easily migrate data from an Excel sheet to a SQLite database table** with a guided CLI experience. It handles data validation, provides file-picking via CLI prompts, and even remembers your previously selected files to improve usability.

---

## 🚀 Features

- ✅ CLI-based **file picker** for both Excel and SQLite DB files  
- ✅ **Case-insensitive** column matching between Excel and DB  
- ✅ **Modular code** structure for better readability and maintenance  
- ✅ Validates column names before migration  
- ✅ Stores and reuses **last used file paths** for convenience  
- ✅ Uses **`inquirer`** for interactive CLI prompts  
- ✅ Supports `.xlsx`, `.xls`, and `.db` file types

---

## 📦 Project Structure

```
migration-utility/
│
├── migrate.js                # Main file that runs the migration logic
├── utils.js                  # Modular functions (Excel read, DB connect, insert logic)
├── .lastUsed.json            # Auto-generated, stores previously used file paths
├── package.json              # Project dependencies and scripts
└── README.md                 # You're reading it!
```

---

## 🔧 Prerequisites

Make sure you have **Node.js** installed.

### Install dependencies:

```bash
npm install
```

---

## 📝 Usage

To run the migration utility:

```bash
node migrate.js
```

You will be prompted to:

1. **Select an Excel file** (`.xlsx` or `.xls`)
2. **Select a SQLite database file** (`.db`)
3. **Pick the destination table** from the database
4. The utility will:
   - Match Excel columns to DB table columns (case-insensitive)
   - Validate compatibility
   - Insert the data row-by-row

---

## 📁 Example Input

### Excel File:
| ID | name | hobby |
|----|------|--------|
| 1  | John | Chess  |
| 2  | Jane | Guitar |

### DB Table:
```sql
CREATE TABLE users (
  id INTEGER,
  NAME TEXT,
  Hobby TEXT
);
```

> ✅ Even if column names differ in case (`ID` vs `id`, `name` vs `NAME`), the utility will map them correctly.

---

## 📂 Saved Paths Feature

This tool stores your last used file paths in `.lastUsed.json`. The next time you run it, **those paths are offered as defaults**, so you don’t have to paste them again.

---

## 🛠️ Tech Stack

- Node.js
- Inquirer
- SQLite3
- XLSX (SheetJS)
- File System & Promises API

---

## 🧠 Tips

- Make sure your **Excel headers match the DB columns** (at least in terms of logic, even if casing differs).
- This utility **does not overwrite existing data**—it only appends.

---

## 💡 Future Improvements

- GUI file picker using Electron
- Column mapping UI
- Schema validation before migration
- Logs for successful/failed row insertions

---
