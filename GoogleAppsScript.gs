// Google Apps Script for Personal Accounting App
// Deploy this as a Web App to connect your HTML app to Google Sheets

// Main function to handle GET requests
function doGet(e) {
  const action = e.parameter.action;
  
  try {
    switch(action) {
      case 'getBalance':
        return getBalance();
      case 'getTransactions':
        return getTransactions();
      case 'getSavingsFunds':
        return getSavingsFunds();
      case 'getDebts':
        return getDebts();
      default:
        return ContentService.createTextOutput(JSON.stringify({
          status: 'error',
          message: 'Invalid action'
        })).setMimeType(ContentService.MimeType.JSON);
    }
  } catch(error) {
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// Main function to handle POST requests
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const action = data.action;
    
    switch(action) {
      case 'addTransaction':
        return addTransaction(data.data);
      case 'updateBalance':
        return updateBalance(data.balance);
      case 'deleteTransaction':
        return deleteTransaction(data.id);
      case 'addSavingsFund':
        return addSavingsFund(data.data);
      case 'updateSavingsFund':
        return updateSavingsFund(data.data);
      case 'addDebt':
        return addDebt(data.data);
      case 'updateDebt':
        return updateDebt(data.data);
      default:
        return ContentService.createTextOutput(JSON.stringify({
          status: 'error',
          message: 'Invalid action'
        })).setMimeType(ContentService.MimeType.JSON);
    }
  } catch(error) {
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// Get or create sheet
function getSheet(sheetName) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(sheetName);
  
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
    
    // Set headers based on sheet type
    if (sheetName === 'Transactions') {
      sheet.appendRow(['ID', 'Date', 'Type', 'Amount', 'Category', 'Description', 'Timestamp']);
    } else if (sheetName === 'SavingsFunds') {
      sheet.appendRow(['ID', 'Name', 'Amount', 'CreatedDate', 'Status']);
    } else if (sheetName === 'Debts') {
      sheet.appendRow(['ID', 'Person', 'Amount', 'Type', 'Description', 'Date', 'Status']);
    } else if (sheetName === 'Balance') {
      sheet.appendRow(['CurrentBalance', 'LastUpdated']);
      sheet.appendRow([0, new Date()]);
    }
  }
  
  return sheet;
}

// Balance functions
function getBalance() {
  const sheet = getSheet('Balance');
  const data = sheet.getDataRange().getValues();
  
  if (data.length < 2) {
    return ContentService.createTextOutput(JSON.stringify({
      balance: 0
    })).setMimeType(ContentService.MimeType.JSON);
  }
  
  return ContentService.createTextOutput(JSON.stringify({
    balance: parseFloat(data[1][0]) || 0
  })).setMimeType(ContentService.MimeType.JSON);
}

function updateBalance(balance) {
  const sheet = getSheet('Balance');
  
  if (sheet.getLastRow() < 2) {
    sheet.appendRow([balance, new Date()]);
  } else {
    sheet.getRange(2, 1).setValue(balance);
    sheet.getRange(2, 2).setValue(new Date());
  }
  
  return ContentService.createTextOutput(JSON.stringify({
    status: 'success'
  })).setMimeType(ContentService.MimeType.JSON);
}

// Transaction functions
function getTransactions() {
  const sheet = getSheet('Transactions');
  const data = sheet.getDataRange().getValues();
  
  if (data.length <= 1) {
    return ContentService.createTextOutput(JSON.stringify({
      transactions: []
    })).setMimeType(ContentService.MimeType.JSON);
  }
  
  const transactions = [];
  for (let i = 1; i < data.length; i++) {
    transactions.push({
      id: data[i][0],
      date: data[i][1],
      type: data[i][2],
      amount: parseFloat(data[i][3]),
      category: data[i][4],
      description: data[i][5],
      timestamp: data[i][6]
    });
  }
  
  return ContentService.createTextOutput(JSON.stringify({
    transactions: transactions
  })).setMimeType(ContentService.MimeType.JSON);
}

function addTransaction(transaction) {
  const sheet = getSheet('Transactions');
  
  // Check if transaction exists (for updates)
  const data = sheet.getDataRange().getValues();
  let rowIndex = -1;
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === transaction.id) {
      rowIndex = i + 1;
      break;
    }
  }
  
  if (rowIndex > 0) {
    // Update existing
    sheet.getRange(rowIndex, 2).setValue(transaction.date);
    sheet.getRange(rowIndex, 3).setValue(transaction.type);
    sheet.getRange(rowIndex, 4).setValue(transaction.amount);
    sheet.getRange(rowIndex, 5).setValue(transaction.category);
    sheet.getRange(rowIndex, 6).setValue(transaction.description);
    sheet.getRange(rowIndex, 7).setValue(transaction.timestamp);
  } else {
    // Add new
    sheet.appendRow([
      transaction.id,
      transaction.date,
      transaction.type,
      transaction.amount,
      transaction.category,
      transaction.description,
      transaction.timestamp
    ]);
  }
  
  return ContentService.createTextOutput(JSON.stringify({
    status: 'success'
  })).setMimeType(ContentService.MimeType.JSON);
}

function deleteTransaction(id) {
  const sheet = getSheet('Transactions');
  const data = sheet.getDataRange().getValues();
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === id) {
      sheet.deleteRow(i + 1);
      break;
    }
  }
  
  return ContentService.createTextOutput(JSON.stringify({
    status: 'success'
  })).setMimeType(ContentService.MimeType.JSON);
}

// Savings Funds functions
function getSavingsFunds() {
  const sheet = getSheet('SavingsFunds');
  const data = sheet.getDataRange().getValues();
  
  if (data.length <= 1) {
    return ContentService.createTextOutput(JSON.stringify({
      funds: []
    })).setMimeType(ContentService.MimeType.JSON);
  }
  
  const funds = [];
  for (let i = 1; i < data.length; i++) {
    funds.push({
      id: data[i][0],
      name: data[i][1],
      amount: parseFloat(data[i][2]),
      createdDate: data[i][3],
      status: data[i][4]
    });
  }
  
  return ContentService.createTextOutput(JSON.stringify({
    funds: funds
  })).setMimeType(ContentService.MimeType.JSON);
}

function addSavingsFund(fund) {
  const sheet = getSheet('SavingsFunds');
  
  sheet.appendRow([
    fund.id,
    fund.name,
    fund.amount,
    fund.createdDate,
    fund.status
  ]);
  
  return ContentService.createTextOutput(JSON.stringify({
    status: 'success'
  })).setMimeType(ContentService.MimeType.JSON);
}

function updateSavingsFund(fund) {
  const sheet = getSheet('SavingsFunds');
  const data = sheet.getDataRange().getValues();
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === fund.id) {
      sheet.getRange(i + 1, 2).setValue(fund.name);
      sheet.getRange(i + 1, 3).setValue(fund.amount);
      sheet.getRange(i + 1, 5).setValue(fund.status);
      break;
    }
  }
  
  return ContentService.createTextOutput(JSON.stringify({
    status: 'success'
  })).setMimeType(ContentService.MimeType.JSON);
}

// Debts functions
function getDebts() {
  const sheet = getSheet('Debts');
  const data = sheet.getDataRange().getValues();
  
  if (data.length <= 1) {
    return ContentService.createTextOutput(JSON.stringify({
      debts: []
    })).setMimeType(ContentService.MimeType.JSON);
  }
  
  const debts = [];
  for (let i = 1; i < data.length; i++) {
    debts.push({
      id: data[i][0],
      person: data[i][1],
      amount: parseFloat(data[i][2]),
      type: data[i][3],
      description: data[i][4],
      date: data[i][5],
      status: data[i][6]
    });
  }
  
  return ContentService.createTextOutput(JSON.stringify({
    debts: debts
  })).setMimeType(ContentService.MimeType.JSON);
}

function addDebt(debt) {
  const sheet = getSheet('Debts');
  
  sheet.appendRow([
    debt.id,
    debt.person,
    debt.amount,
    debt.type,
    debt.description,
    debt.date,
    debt.status
  ]);
  
  return ContentService.createTextOutput(JSON.stringify({
    status: 'success'
  })).setMimeType(ContentService.MimeType.JSON);
}

function updateDebt(debt) {
  const sheet = getSheet('Debts');
  const data = sheet.getDataRange().getValues();
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === debt.id) {
      sheet.getRange(i + 1, 7).setValue(debt.status);
      break;
    }
  }
  
  return ContentService.createTextOutput(JSON.stringify({
    status: 'success'
  })).setMimeType(ContentService.MimeType.JSON);
}
