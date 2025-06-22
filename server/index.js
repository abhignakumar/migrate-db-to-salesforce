import express from "express";
import sql from "mssql";
import dotenv from "dotenv";
import cors from "cors";
import axios from "axios";
import qs from "qs";
import { fetchStorageFromDB, updateStorageInDB } from "./utils.js";
import { Parser } from "json2csv";
dotenv.config();

const app = express();

app.use(cors());

export const sqlConfig = {
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

const AUTH_URL = `https://login.salesforce.com/services/oauth2/authorize?client_id=${process.env.SF_CLIENT_ID}&redirect_uri=${process.env.SF_REDIRECT_URI}&response_type=code`;
const TOKEN_URL = "https://login.salesforce.com/services/oauth2/token";

var refreshToken = null,
  accessToken = null,
  instanceUrl = null;

fetchStorageFromDB().then((data) => {
  refreshToken = data.refreshToken;
  accessToken = data.accessToken;
  instanceUrl = data.instanceUrl;
});

app.get("/is-authenticated", (req, res) => {
  if (refreshToken) return res.json({ isAuthenticated: true });
  else return res.json({ isAuthenticated: false });
});

app.get("/login", (req, res) => {
  res.json({ authUrl: AUTH_URL });
});

app.get("/logout", async (req, res) => {
  refreshToken = null;
  accessToken = null;
  instanceUrl = null;
  const response = await updateStorageInDB(null, null, null);
  if (response.success) res.json({ message: "Logout Successful" });
  else res.status(500).json({ message: "Logout Failed" });
});

app.get("/oauth/callback", async (req, res) => {
  const code = req.query.code;
  if (!code) return res.status(400).json({ message: "Missing code" });

  try {
    const response = await axios.post(
      TOKEN_URL,
      qs.stringify({
        grant_type: "authorization_code",
        code,
        client_id: process.env.SF_CLIENT_ID,
        client_secret: process.env.SF_CLIENT_SECRET,
        redirect_uri: process.env.SF_REDIRECT_URI,
      }),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );
    accessToken = response.data.access_token;
    refreshToken = response.data.refresh_token;
    instanceUrl = response.data.instance_url;
    await updateStorageInDB(
      response.data.refresh_token,
      response.data.access_token,
      response.data.instance_url
    );
    res.redirect(process.env.FRONTEND_URL);
  } catch (error) {
    console.error(error.response?.data || error.message);
    res.status(500).json({ message: "Token exchange failed" });
  }
});

app.get("/sync-customers-bulk", async (req, res) => {
  if (!accessToken || !instanceUrl) {
    res.status(500).json({ message: "accessToken or instanceUrl is null" });
    return;
  }
  let customers = [];
  try {
    const pool = await sql.connect(sqlConfig);
    const result = await pool.request().query("SELECT * FROM Customer");
    customers = result.recordset;
    await pool.close();
  } catch (error) {
    console.error(err.response?.data || err.message);
    res.status(500).json({ message: "Error fetching customers from DB" });
    return;
  }
  const customerPayload = customers.map((c) => ({
    Name: c.Name,
    Phone: c.Phone,
    BillingStreet: c.Address,
    Email__c: c.Email,
    ExternalId__c: c.CustomerID.toString(),
  }));
  const fields = [
    "Name",
    "Phone",
    "BillingStreet",
    "Email__c",
    "ExternalId__c",
  ];
  const parser = new Parser({ fields });
  const csvPayload = parser.parse(customerPayload);
  try {
    const createJobResponse = await axios.post(
      `${instanceUrl}/services/data/v58.0/jobs/ingest`,
      {
        object: "Account",
        contentType: "CSV",
        operation: "upsert",
        externalIdFieldName: "ExternalId__c",
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );
    const jobId = createJobResponse.data.id;
    await axios.put(
      `${instanceUrl}/services/data/v58.0/jobs/ingest/${jobId}/batches`,
      csvPayload,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "text/csv",
        },
      }
    );
    await axios.patch(
      `${instanceUrl}/services/data/v58.0/jobs/ingest/${jobId}`,
      { state: "UploadComplete" },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );
    res.json({ message: "Bulk Job Created", jobId });
  } catch (err) {
    console.error("Bulk API error:", err.response?.data || err.message);
    res.status(500).json({ message: "Failed to sync customers via bulk API" });
  }
});

app.get("/sync-customers", async (req, res) => {
  if (!accessToken || !instanceUrl) {
    res.status(500).json({ message: "accessToken or instanceUrl is null" });
    return;
  }
  let customers = [];
  try {
    const pool = await sql.connect(sqlConfig);
    const result = await pool.request().query("SELECT * FROM Customer");
    customers = result.recordset;
    await pool.close();
  } catch (error) {
    console.error(err.response?.data || err.message);
    res.status(500).json({ message: "Error fetching customers from DB" });
    return;
  }
  const customerPayload = {
    records: customers.map((c, index) => ({
      attributes: { type: "Account", referenceId: `ref${index}` },
      Name: c.Name,
      Phone: c.Phone,
      BillingStreet: c.Address,
      Email__c: c.Email,
      ExternalId__c: c.CustomerID.toString(),
    })),
  };
  try {
    await axios.post(
      `${instanceUrl}/services/data/v58.0/composite/tree/Account`,
      customerPayload,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );
    res.json({ message: "Successfully migrated the customers" });
  } catch (err) {
    console.error("Request error:", err.response?.data || err.message);
    res.status(500).json({ message: "Failed to sync customers" });
  }
});

app.listen(3000, () => console.log("App running on port 3000"));
