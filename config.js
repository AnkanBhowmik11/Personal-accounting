// Google Sheets Configuration
// Follow these steps to set up your Google Sheet:

// 1. Create a new Google Sheet with the following sheets:
//    - Transactions
//    - SavingsFunds
//    - Debts
//    - Balance

// 2. Set up each sheet with these columns:

// Transactions Sheet:
// ID | Date | Type | Amount | Category | Description | Timestamp

// SavingsFunds Sheet:
// ID | Name | Amount | CreatedDate | Status

// Debts Sheet:
// ID | Person | Amount | Type | Description | Date | Status

// Balance Sheet:
// CurrentBalance | LastUpdated

// 3. Deploy as Web App:
//    - Extensions > Apps Script
//    - Copy the Google Apps Script code (provided separately)
//    - Deploy > New deployment > Web app
//    - Execute as: Me
//    - Who has access: Anyone
//    - Copy the deployment URL

// 4. Paste your Web App URL here:
const GOOGLE_SHEETS_URL = 'https://script.google.com/macros/s/AKfycby95CVhCPhdXWCYvQqyRULcQSRHM49R7IWRl_a4ElO1gph7mUJCBlSaJ6K7pFLsah55/exec';

// Login Credentials
const LOGIN_CREDENTIALS = {
    username: 'Ankan11',
    password: 'ankan@2005'
};
