import { createReadStream } from "fs";
import csv from "csv-parser";
import sql from "mssql";
import dotenv from "dotenv";
dotenv.config();

// === CONFIGURATION ===
const csvFile = "customers-100.csv"; // Path to your CSV file
const tableName = "Customer2"; // Target SQL table
// const columns = ["CustomerID", "Name", "Email", "Phone", "Address"]; // Must match CSV header & DB table columns
const columns = [
  "Index",
  "Customer Id",
  "First Name",
  "Last Name",
  "Company",
  "City",
  "Country",
  "Phone 1",
  "Phone 2",
  "Email",
  "Subscription Date",
  "Website",
]; // Must match CSV header & DB table columns
// === DATABASE CONFIGURATION ===
const config = {
  user: process.env.AZURE_SQL_USER,
  password: process.env.AZURE_SQL_PWD,
  database: process.env.AZURE_SQL_DB,
  server: process.env.AZURE_SQL_SERVER,
  port: parseInt(process.env.AZURE_SQL_PORT),
  options: {
    encrypt: true,
    trustServerCertificate: false,
  },
};

(async () => {
  try {
    // Read CSV data
    const records = [];
    createReadStream(csvFile)
      .pipe(csv())
      .on("data", (data) => {
        // Validate column match
        const keys = Object.keys(data);
        if (
          records.length === 0 &&
          !columns.every((col) => keys.includes(col))
        ) {
          throw new Error("CSV columns don't match expected columns");
        }

        const row = columns.map((col) => data[col]);
        records.push(row);
      })
      .on("end", async () => {
        // Connect to Azure SQL
        // await sql.connect(config);

        // const request = new sql.Request();
        // const placeholders = columns.map(() => "@val").join(", ");
        // const query = `INSERT INTO ${tableName} (${columns.join(
        //   ", "
        // )}) VALUES (${placeholders})`;

        // for (const row of records) {
        //   columns.forEach((_, i) => {
        //     if (i == 0) request.input(`val`, sql.Int, row[i]);
        //     else request.input(`val`, sql.NVarChar, row[i]);
        //   });
        //   await request.query(query);
        // }

        // const columnTypes = [
        //   sql.Int,
        //   sql.NVarChar,
        //   sql.NVarChar,
        //   sql.NVarChar,
        //   sql.NVarChar,
        // ];
        // for (const row of records) {
        //   const request = new sql.Request();
        //   const placeholders = [];
        //   row.forEach((val, i) => {
        //     request.input(
        //       `val${i}`,
        //       columnTypes[i],
        //       columnTypes[i] === sql.Int ? parseInt(val) : val
        //     );
        //     placeholders.push(`@val${i}`);
        //   });
        //   const query = `INSERT INTO ${tableName} (${columns.join(
        //     ", "
        //   )}) VALUES (${placeholders.join(", ")})`;
        //   await request.query(query);
        // }
        // await sql.close();

        const pool = await sql.connect(config);

        const table = new sql.Table(tableName); // same name as the table in DB
        table.create = false; // don't try to create the table
        table.columns.add("Index", sql.Int, { nullable: false });
        table.columns.add("Customer Id", sql.NVarChar(255), {
          nullable: false,
          primary: true,
        });
        table.columns.add("First Name", sql.NVarChar(255), { nullable: true });
        table.columns.add("Last Name", sql.NVarChar(255), { nullable: true });
        table.columns.add("Company", sql.NVarChar(255), { nullable: true });
        table.columns.add("City", sql.NVarChar(255), { nullable: true });
        table.columns.add("Country", sql.NVarChar(255), { nullable: true });
        table.columns.add("Phone 1", sql.NVarChar(255), { nullable: true });
        table.columns.add("Phone 2", sql.NVarChar(255), { nullable: true });
        table.columns.add("Email", sql.NVarChar(255), { nullable: true });
        table.columns.add("Subscription Date", sql.NVarChar(255), {
          nullable: true,
        });
        table.columns.add("Website", sql.NVarChar(255), { nullable: true });

        for (const row of records) {
          table.rows.add(
            parseInt(row[0]),
            row[1],
            row[2],
            row[3],
            row[4],
            row[5],
            row[6],
            row[7],
            row[8],
            row[9],
            row[10],
            row[11]
          );
        }

        await pool.request().bulk(table);
        await pool.close();
        console.log("✅ Data inserted successfully!");
      });
  } catch (err) {
    console.error("Error:", err.message || err);
    await sql.close(); // Ensure cleanup on failure
  }
})();
