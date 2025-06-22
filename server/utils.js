import sql from "mssql";
import { sqlConfig } from "./index.js";

export async function fetchStorageFromDB() {
  let refreshToken = null;
  let accessToken = null;
  let instanceUrl = null;
  try {
    const pool = await sql.connect(sqlConfig);
    const result = await pool.request().query("SELECT * FROM Storage");
    const storageResult = result.recordset;
    await pool.close();
    for (const s of storageResult) {
      if (s.Key === "refresh_token") refreshToken = s.Value;
      if (s.Key === "access_token") accessToken = s.Value;
      if (s.Key === "instance_url") instanceUrl = s.Value;
    }
    return { refreshToken, accessToken, instanceUrl };
  } catch (error) {
    console.error(
      "Error fetching Storage from DB: ",
      error.response?.data || error.message
    );
    return {
      refreshToken: null,
      accessToken: null,
      instanceUrl: null,
    };
  }
}

export async function updateStorageInDB(
  refreshToken,
  accessToken,
  instanceUrl
) {
  try {
    const pool = await sql.connect(sqlConfig);
    await pool
      .request()
      .input("value", sql.NVarChar, refreshToken)
      .input("key", sql.NVarChar, "refresh_token")
      .query(`UPDATE Storage SET "Value" = @value WHERE "Key" = @key`);

    await pool
      .request()
      .input("value", sql.NVarChar, accessToken)
      .input("key", sql.NVarChar, "access_token")
      .query(`UPDATE Storage SET "Value" = @value WHERE "Key" = @key`);

    await pool
      .request()
      .input("value", sql.NVarChar, instanceUrl)
      .input("key", sql.NVarChar, "instance_url")
      .query(`UPDATE Storage SET "Value" = @value WHERE "Key" = @key`);
    await pool.close();
    return { success: true };
  } catch (error) {
    console.error(
      "Error updating Storage in DB: ",
      error.response?.data || error.message
    );
    return { success: false };
  }
}
