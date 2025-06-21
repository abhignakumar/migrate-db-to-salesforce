import express from "express";
import sql from "mssql";
import dotenv from "dotenv";
import cors from "cors";
import axios from "axios";
import qs from "qs";
dotenv.config();

const app = express();

app.use(cors());

const sqlConfig = {
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

let refreshToken = null;
let accessToken = null;
let instanceUrl = null;
let exchangeTokenCodeResponse = null;

app.get("/is-authenticated", (req, res) => {
  if (refreshToken && instanceUrl) return res.json({ isAuthenticated: true });
  else return res.json({ isAuthenticated: false });
});

app.get("/login", (req, res) => {
  res.json({ authUrl: AUTH_URL });
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
    exchangeTokenCodeResponse = response.data;
    accessToken = response.data.access_token;
    refreshToken = response.data.refresh_token;
    instanceUrl = response.data.instance_url;
    console.log(exchangeTokenCodeResponse);
    console.log(accessToken);
    console.log(refreshToken);
    console.log(instanceUrl);
    res.redirect("http://localhost:5173");
  } catch (error) {
    console.error(error.response?.data || error.message);
    res.status(500).json({ message: "Token exchange failed" });
  }
});

app.get("/sync-customers", async (req, res) => {
  if (!accessToken || !instanceUrl) {
    res.status(500).json({ message: "accessToken or instanceUrl is null" });
    return;
  }
  try {
    const pool = await sql.connect(sqlConfig);
    const result = await pool.request().query("SELECT * FROM Customer");
    var customers = result.recordset;
    await pool.close();
  } catch (error) {
    console.error(err.response?.data || err.message);
    res.status(500).json({ message: "Error fetching customers from DB" });
    return;
  }
  customers.forEach(async (c) => {
    const accountPayload = {
      Name: c.Name,
      Phone: c.Phone,
      BillingStreet: c.Address,
      Email__c: c.Email,
      ExternalId__c: c.CustomerID.toString(),
    };
    try {
      const res = await axios.post(
        `${instanceUrl}/services/data/v58.0/sobjects/Account/`,
        accountPayload,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );
      console.log(res);
    } catch (error) {
      console.error(
        "Error sending to Salesforce:",
        error.response?.data || error.message
      );
      return;
    }
  });
  res.json({ message: "Synced" });
});

app.listen(3000, () => console.log("App running on port 3000"));
