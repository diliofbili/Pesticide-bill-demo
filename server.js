const express = require('express');
const { google } = require('googleapis');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Google Sheets API setup
const SPREADSHEET_ID = '19emAWfw4K7EmKceauFVq7zzpOXsNV03iCneadthpnLs';
const SHEET_NAME = 'Pesticides';

// Fallback data in case Google Sheets API fails
const fallbackData = [
    { name: "Sathi etc.", price: 0, saltComposition: "Algrip", company: "" },
    { name: "Collin 80 Gm", price: 110, saltComposition: "Pyrazosulfuron", company: "Saffire" },
    { name: "Fighter 80gm", price: 110, saltComposition: "Pyrazosulfuron", company: "Perry" },
    { name: "Ju Mix 8gm", price: 55, saltComposition: "Metasulfuron,Chlorimuron", company: "JU" },
    { name: "Ju Grip 8gm", price: 30, saltComposition: "Metasulfuron / Algrip", company: "JU" },
    { name: "Ju Grip 8gm", price: 30, saltComposition: "Metasulfuron / Algrip", company: "JU" },
    { name: "Ju Grip 8gm", price: 30, saltComposition: "Metasulfuron / Algrip", company: "JU" },
    { name: "Ju Grip 8gm", price: 30, saltComposition: "Metasulfuron / Algrip", company: "JU" },
    { name: "Ju Grip 8gm", price: 30, saltComposition: "Metasulfuron / Algrip", company: "JU" },
    { name: "Ju Grip 8gm", price: 30, saltComposition: "Metasulfuron / Algrip", company: "JU" },
    { name: "Ju Grip 8gm", price: 30, saltComposition: "Metasulfuron / Algrip", company: "JU" },
    { name: "Ju Grip 8gm", price: 30, saltComposition: "Metasulfuron / Algrip", company: "JU" },
    { name: "Ju Grip 8gm", price: 30, saltComposition: "Metasulfuron / Algrip", company: "JU" },
    { name: "Ju Grip 8gm", price: 30, saltComposition: "Metasulfuron / Algrip", company: "JU" },
    { name: "Ju Grip 8gm", price: 30, saltComposition: "Metasulfuron / Algrip", company: "JU" },
    { name: "Ju Grip 8gm", price: 30, saltComposition: "Metasulfuron / Algrip", company: "JU" },
    { name: "Ju Grip 8gm", price: 30, saltComposition: "Metasulfuron / Algrip", company: "JU" },
    { name: "Ju Grip 8gm", price: 30, saltComposition: "Metasulfuron / Algrip", company: "JU" },
    { name: "Ju Grip 8gm", price: 30, saltComposition: "Metasulfuron / Algrip", company: "JU" },
    { name: "Ju Grip 8gm", price: 30, saltComposition: "Metasulfuron / Algrip", company: "JU" },
    { name: "Ju Grip 8gm", price: 30, saltComposition: "Metasulfuron / Algrip", company: "JU" },
    { name: "Ju Grip 8gm", price: 30, saltComposition: "Metasulfuron / Algrip", company: "JU" },
    { name: "Ju Grip 8gm", price: 30, saltComposition: "Metasulfuron / Algrip", company: "JU" },
    { name: "Ju Grip 8gm", price: 30, saltComposition: "Metasulfuron / Algrip", company: "JU" },
    { name: "Ju Grip 8gm", price: 30, saltComposition: "Metasulfuron / Algrip", company: "JU" },
    { name: "Ju Grip 8gm", price: 30, saltComposition: "Metasulfuron / Algrip", company: "JU" },
    { name: "Ju Grip 8gm", price: 30, saltComposition: "Metasulfuron / Algrip", company: "JU" },
    { name: "Ju Grip 8gm", price: 30, saltComposition: "Metasulfuron / Algrip", company: "JU" },
    { name: "Ju Grip 8gm", price: 30, saltComposition: "Metasulfuron / Algrip", company: "JU" },
    { name: "Ju Grip 8gm", price: 30, saltComposition: "Metasulfuron / Algrip", company: "JU" },
    { name: "Ju Grip 8gm", price: 30, saltComposition: "Metasulfuron / Algrip", company: "JU" },
    { name: "Ju Grip 8gm", price: 30, saltComposition: "Metasulfuron / Algrip", company: "JU" },
    { name: "Ju Grip 8gm", price: 30, saltComposition: "Metasulfuron / Algrip", company: "JU" },
    { name: "Ju Grip 8gm", price: 30, saltComposition: "Metasulfuron / Algrip", company: "JU" },
    { name: "Ju Grip 8gm", price: 30, saltComposition: "Metasulfuron / Algrip", company: "JU" },
    { name: "Ju Grip 8gm", price: 30, saltComposition: "Metasulfuron / Algrip", company: "JU" },
    { name: "Ju Grip 8gm", price: 30, saltComposition: "Metasulfuron / Algrip", company: "JU" },
    { name: "Zetol Sure 1kg (15-15-30)", price: 30, saltComposition: "Metasulfuron / Algrip", company: "JU" },
    { name: "Zinc Edta 500gm", price: 30, saltComposition: "Metasulfuron / Algrip", company: "JU" },
    { name: "Zetol Sure 1kg (11-44-11)", price: 30, saltComposition: "Metasulfuron / Algrip", company: "JU" },
    { name: "Magsol (MgS) 10kg", price: 30, saltComposition: "Metasulfuron / Algrip", company: "JU" },
    { name: "glyphos", price: 0, saltComposition: "Roundup", company: "" },
    { name: "fireball", price: 30, saltComposition: "Metasulfuron / Algrip", company: "JU" },
    { name: "touchdown 1l", price: 30, saltComposition: "Metasulfuron / Algrip", company: "JU" },
    { name: "glyphos", price: 0, saltComposition: "Roundup", company: "" },
    { name: "fireball", price: 30, saltComposition: "Metasulfuron / Algrip", company: "JU" },
    { name: "touchdown 1l", price: 30, saltComposition: "Metasulfuron / Algrip", company: "JU" },
    { name: "glyphos", price: 0, saltComposition: "Roundup", company: "" },
    { name: "fireball", price: 30, saltComposition: "Metasulfuron / Algrip", company: "JU" },
    { name: "touchdown 1l", price: 30, saltComposition: "Metasulfuron / Algrip", company: "JU" },
    { name: "glyphos", price: 0, saltComposition: "Roundup", company: "" },
    { name: "fireball", price: 30, saltComposition: "Metasulfuron / Algrip", company: "JU" },
    { name: "touchdown 1l", price: 30, saltComposition: "Metasulfuron / Algrip", company: "JU" },
    { name: "glyphos", price: 0, saltComposition: "Roundup", company: "" },
    { name: "fireball", price: 30, saltComposition: "Metasulfuron / Algrip", company: "JU" },
    { name: "touchdown 1l", price: 30, saltComposition: "Metasulfuron / Algrip", company: "JU" },
    { name: "glyphos", price: 0, saltComposition: "Roundup", company: "" },
    { name: "fireball", price: 30, saltComposition: "Metasulfuron / Algrip", company: "JU" },
    { name: "touchdown 1l", price: 30, saltComposition: "Metasulfuron / Algrip", company: "JU" },
    { name: "glyphos", price: 0, saltComposition: "Roundup", company: "" },
    { name: "fireball", price: 30, saltComposition: "Metasulfuron / Algrip", company: "JU" },
    { name: "touchdown 1l", price: 30, saltComposition: "Metasulfuron / Algrip", company: "JU" },
    { name: "glyphos", price: 0, saltComposition: "Roundup", company: "" },
    { name: "fireball", price: 30, saltComposition: "Metasulfuron / Algrip", company: "JU" },
    { name: "touchdown 1l", price: 30, saltComposition: "Metasulfuron / Algrip", company: "JU" },
    { name: "glyphos", price: 0, saltComposition: "Roundup", company: "" },
    { name: "fireball", price: 30, saltComposition: "Metasulfuron / Algrip", company: "JU" },
    { name: "touchdown 1l", price: 30, saltComposition: "Metasulfuron / Algrip", company: "JU" },
    { name: "Roundup", price: 0, saltComposition: "Roundup", company: "" },
    { name: "fireball", price: 30, saltComposition: "Metasulfuron / Algrip", company: "JU" },
    { name: "touchdown 1l", price: 30, saltComposition: "Metasulfuron / Algrip", company: "JU" },
    { name: "ectara", price: 0, saltComposition: "Roundup", company: "" },
    { name: "fireball", price: 30, saltComposition: "Metasulfuron / Algrip", company: "JU" },
    { name: "touchdown 1l", price: 30, saltComposition: "Metasulfuron / Algrip", company: "JU" },
    { name: "zodia 1l", price: 30, saltComposition: "Metasulfuron / Algrip", company: "JU" },
];

// Disable caching for API responses
app.get('/api/pesticides', async (req, res) => {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.set('Expires', '-1');
    res.set('Pragma', 'no-cache');

    try {
        // Check if we have Google credentials
        if (!process.env.GOOGLE_CREDENTIALS) {
            console.log('No Google credentials found, using fallback data');
            return res.json(fallbackData);
        }

        // Load credentials from environment variable
        let credentials;
        try {
            credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS);
        } catch (parseError) {
            console.error('Error parsing Google credentials:', parseError);
            return res.json(fallbackData);
        }

        // Create JWT client for authentication
        const jwtClient = new google.auth.JWT(
            credentials.client_email,
            null,
            credentials.private_key,
            ['https://www.googleapis.com/auth/spreadsheets.readonly']
        );

        // Authenticate with Google
        await jwtClient.authorize();

        // Create Sheets API client
        const sheets = google.sheets({ version: 'v4', auth: jwtClient });

        // Fetch data from Google Sheets
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: SPREADSHEET_ID,
            range: `${SHEET_NAME}!A2:D`,
        });

        const rows = response.data.values || [];

        // Transform data into structured objects
        const pesticideData = rows.map(row => ({
            name: row[0] || '',
            price: row[1] ? parseInt(row[1]) : 0,
            saltComposition: row[2] || '',
            company: row[3] || ''
        }));

        // Verify we have actual data
        if (pesticideData.length === 0) {
            console.log('No data returned from Google Sheets, using fallback data');
            return res.json(fallbackData);
        }

        res.json(pesticideData);

    } catch (error) {
        console.error('Error with Google Sheets API:', error);
        // Explicitly send the fallback data on any error
        return res.json(fallbackData);
    }
});

// Serve the main HTML file for all other routes
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`Access the app at http://localhost:${PORT}`);
});

const admin = require("firebase-admin");
const bodyParser = require("body-parser");
const cors = require("cors");

const serviceAccount = JSON.parse(process.env.FIREBASE_CONFIG);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://pesticide-billing.firebaseio.com"
});

const db = admin.firestore();
app.use(cors());
app.use(bodyParser.json());

// Firestore: Save a bill
app.post("/save-bill", async (req, res) => {
  try {
    const billData = req.body;
    const docRef = await db.collection("bills").add(billData);
    res.status(200).json({ success: true, id: docRef.id });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Firestore: Get all bills
app.get("/get-bills", async (req, res) => {
  try {
    const snapshot = await db.collection("bills").get();
    let bills = [];
    snapshot.forEach((doc) => bills.push({ id: doc.id, ...doc.data() }));
    res.status(200).json({ success: true, bills });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});
