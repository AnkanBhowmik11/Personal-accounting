// State Management
let currentBalance = 0;
let transactions = [];
let savingsFunds = [];
let debts = [];
let isLoggedIn = false;

// Initialize App
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    // Set today's date as default
    const today = new Date().toISOString().split('T')[0];
    const dateInput = document.getElementById('transactionDate');
    if (dateInput) {
        dateInput.value = today;
    }

    // Check login status
    const savedLogin = localStorage.getItem('isLoggedIn');
    if (savedLogin === 'true') {
        showDashboard();
    }

    // Login form
    document.getElementById('loginForm').addEventListener('submit', handleLogin);
    
    // Transaction form
    document.getElementById('transactionForm').addEventListener('submit', handleTransactionSubmit);
    
    // Logout button
    document.getElementById('logoutBtn').addEventListener('click', handleLogout);
}

// Login Handler
function handleLogin(e) {
    e.preventDefault();
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const errorDiv = document.getElementById('loginError');
    
    if (username === LOGIN_CREDENTIALS.username && password === LOGIN_CREDENTIALS.password) {
        localStorage.setItem('isLoggedIn', 'true');
        errorDiv.classList.remove('show');
        showDashboard();
    } else {
        errorDiv.textContent = 'Invalid username or password';
        errorDiv.classList.add('show');
    }
}

// Logout Handler
function handleLogout() {
    localStorage.removeItem('isLoggedIn');
    isLoggedIn = false;
    document.getElementById('dashboardPage').classList.remove('active');
    document.getElementById('loginPage').classList.add('active');
}

// Show Dashboard
async function showDashboard() {
    isLoggedIn = true;
    document.getElementById('loginPage').classList.remove('active');
    document.getElementById('dashboardPage').classList.add('active');
    
    // Load data from Google Sheets
    await loadAllData();
}

// Google Sheets Integration
async function loadAllData() {
    try {
        showLoading();
        
        // Load balance
        await loadBalance();
        
        // Load transactions
        await loadTransactions();
        
        // Load savings funds
        await loadSavingsFunds();
        
        // Load debts
        await loadDebts();
        
        // Update UI
        updateDashboard();
        
        hideLoading();
    } catch (error) {
        console.error('Error loading data:', error);
        // If Google Sheets not configured, use demo data
        useDemoData();
    }
}

async function loadBalance() {
    try {
        const response = await fetch(`${GOOGLE_SHEETS_URL}?action=getBalance`);
        const data = await response.json();
        currentBalance = data.balance || 0;
    } catch (error) {
        console.error('Error loading balance:', error);
        currentBalance = 0;
    }
}

async function loadTransactions() {
    try {
        const response = await fetch(`${GOOGLE_SHEETS_URL}?action=getTransactions`);
        const data = await response.json();
        transactions = data.transactions || [];
    } catch (error) {
        console.error('Error loading transactions:', error);
        transactions = [];
    }
}

async function loadSavingsFunds() {
    try {
        const response = await fetch(`${GOOGLE_SHEETS_URL}?action=getSavingsFunds`);
        const data = await response.json();
        savingsFunds = data.funds || [];
    } catch (error) {
        console.error('Error loading savings funds:', error);
        savingsFunds = [];
    }
}

async function loadDebts() {
    try {
        const response = await fetch(`${GOOGLE_SHEETS_URL}?action=getDebts`);
        const data = await response.json();
        debts = data.debts || [];
    } catch (error) {
        console.error('Error loading debts:', error);
        debts = [];
    }
}

async function saveTransaction(transaction) {
    try {
        const response = await fetch(GOOGLE_SHEETS_URL, {
            method: 'POST',
            mode: 'no-cors',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                action: 'addTransaction',
                data: transaction
            })
        });
        
        return true;
    } catch (error) {
        console.error('Error saving transaction:', error);
        return false;
    }
}

async function updateBalance(newBalance) {
    try {
        const response = await fetch(GOOGLE_SHEETS_URL, {
            method: 'POST',
            mode: 'no-cors',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                action: 'updateBalance',
                balance: newBalance
            })
        });
        
        return true;
    } catch (error) {
        console.error('Error updating balance:', error);
        return false;
    }
}

// Update Dashboard UI
function updateDashboard() {
    // Update balance
    document.getElementById('currentBalance').textContent = `₹${currentBalance.toFixed(2)}`;
    
    // Update recent transactions
    displayRecentTransactions();
    
    // Update savings funds count
    const activeFunds = savingsFunds.filter(f => f.status === 'active').length;
    document.getElementById('savingsFundsCount').textContent = `${activeFunds} active fund${activeFunds !== 1 ? 's' : ''}`;
    
    // Update debts stats
    const totalOwed = debts.filter(d => d.type === 'owe' && d.status === 'active')
        .reduce((sum, d) => sum + parseFloat(d.amount), 0);
    const totalOwing = debts.filter(d => d.type === 'owing' && d.status === 'active')
        .reduce((sum, d) => sum + parseFloat(d.amount), 0);
    
    document.getElementById('debtsStats').textContent = 
        `You owe: ₹${totalOwed.toFixed(2)} | Owed to you: ₹${totalOwing.toFixed(2)}`;
}

function displayRecentTransactions() {
    const listDiv = document.getElementById('recentTransactionsList');
    
    if (transactions.length === 0) {
        listDiv.innerHTML = '<div class="empty-state">No transactions yet</div>';
        return;
    }
    
    // Sort by date (newest first) and take first 3
    const recentTransactions = [...transactions]
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 3);
    
    listDiv.innerHTML = recentTransactions.map(t => createTransactionHTML(t)).join('');
}

function createTransactionHTML(transaction) {
    const amountClass = transaction.type === 'credit' ? 'credit' : 'debit';
    const amountPrefix = transaction.type === 'credit' ? '+' : '-';
    
    return `
        <div class="transaction-item">
            <div class="transaction-info">
                <div class="transaction-category">${transaction.category}</div>
                ${transaction.description ? `<div class="transaction-description">${transaction.description}</div>` : ''}
                <div class="transaction-date">${formatDate(transaction.date)}</div>
            </div>
            <div class="transaction-amount ${amountClass}">
                ${amountPrefix}₹${parseFloat(transaction.amount).toFixed(2)}
            </div>
            <div class="transaction-actions">
                <button class="icon-btn" onclick="editTransaction('${transaction.id}')" title="Edit">✏️</button>
                <button class="icon-btn" onclick="deleteTransaction('${transaction.id}')" title="Delete">🗑️</button>
            </div>
        </div>
    `;
}

// Transaction Modal
function openTransactionModal() {
    document.getElementById('transactionModal').classList.add('active');
    document.getElementById('modalTitle').textContent = 'Add Transaction';
    document.getElementById('transactionForm').reset();
    document.getElementById('editTransactionId').value = '';
    document.getElementById('transactionDate').value = new Date().toISOString().split('T')[0];
}

function closeTransactionModal() {
    document.getElementById('transactionModal').classList.remove('active');
}

async function handleTransactionSubmit(e) {
    e.preventDefault();
    
    const editId = document.getElementById('editTransactionId').value;
    const type = document.getElementById('transactionType').value;
    const amount = parseFloat(document.getElementById('transactionAmount').value);
    const category = document.getElementById('transactionCategory').value;
    const description = document.getElementById('transactionDescription').value;
    const date = document.getElementById('transactionDate').value;
    
    const transaction = {
        id: editId || generateId(),
        type,
        amount,
        category,
        description,
        date,
        timestamp: new Date().toISOString()
    };
    
    if (editId) {
        // Edit existing
        const index = transactions.findIndex(t => t.id === editId);
        const oldTransaction = transactions[index];
        
        // Adjust balance
        if (oldTransaction.type === 'credit') {
            currentBalance -= oldTransaction.amount;
        } else {
            currentBalance += oldTransaction.amount;
        }
        
        transactions[index] = transaction;
    } else {
        // Add new
        transactions.push(transaction);
    }
    
    // Update balance
    if (type === 'credit') {
        currentBalance += amount;
    } else {
        currentBalance -= amount;
    }
    
    // Save to Google Sheets
    await saveTransaction(transaction);
    await updateBalance(currentBalance);
    
    // Update UI
    updateDashboard();
    closeTransactionModal();
}

function editTransaction(id) {
    const transaction = transactions.find(t => t.id === id);
    if (!transaction) return;
    
    document.getElementById('modalTitle').textContent = 'Edit Transaction';
    document.getElementById('editTransactionId').value = transaction.id;
    document.getElementById('transactionType').value = transaction.type;
    document.getElementById('transactionAmount').value = transaction.amount;
    document.getElementById('transactionCategory').value = transaction.category;
    document.getElementById('transactionDescription').value = transaction.description;
    document.getElementById('transactionDate').value = transaction.date;
    
    document.getElementById('transactionModal').classList.add('active');
}

async function deleteTransaction(id) {
    if (!confirm('Are you sure you want to delete this transaction?')) return;
    
    const transaction = transactions.find(t => t.id === id);
    if (!transaction) return;
    
    // Adjust balance
    if (transaction.type === 'credit') {
        currentBalance -= transaction.amount;
    } else {
        currentBalance += transaction.amount;
    }
    
    // Remove from array
    transactions = transactions.filter(t => t.id !== id);
    
    // Save to Google Sheets
    try {
        await fetch(GOOGLE_SHEETS_URL, {
            method: 'POST',
            mode: 'no-cors',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                action: 'deleteTransaction',
                id: id
            })
        });
        
        await updateBalance(currentBalance);
    } catch (error) {
        console.error('Error deleting transaction:', error);
    }
    
    updateDashboard();
}

// Navigation Functions
function openAllTransactionsPage() {
    // Create and show all transactions page
    createAllTransactionsPage();
}

function openMonthlyPage() {
    createMonthlyTransactionsPage();
}

function openSavingsFundsPage() {
    createSavingsFundsPage();
}

function openDebtsPage() {
    createDebtsPage();
}

function createAllTransactionsPage() {
    const dashboard = document.getElementById('dashboardPage');
    dashboard.innerHTML = `
        <div class="page-container">
            <div class="page-header">
                <h1>All Transactions</h1>
                <button class="back-btn" onclick="location.reload()">← Back to Dashboard</button>
            </div>
            <div class="content-card">
                <div id="allTransactionsList"></div>
            </div>
        </div>
    `;
    
    const allTransactions = [...transactions]
        .sort((a, b) => new Date(b.date) - new Date(a.date));
    
    const listDiv = document.getElementById('allTransactionsList');
    
    if (allTransactions.length === 0) {
        listDiv.innerHTML = '<div class="empty-state">No transactions yet</div>';
    } else {
        listDiv.innerHTML = allTransactions.map(t => createTransactionHTML(t)).join('');
    }
}

function createMonthlyTransactionsPage() {
    const dashboard = document.getElementById('dashboardPage');
    
    // Group transactions by month
    const monthlyData = {};
    transactions.forEach(t => {
        const date = new Date(t.date);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        
        if (!monthlyData[monthKey]) {
            monthlyData[monthKey] = {
                transactions: [],
                income: 0,
                expenses: 0
            };
        }
        
        monthlyData[monthKey].transactions.push(t);
        
        if (t.type === 'credit') {
            monthlyData[monthKey].income += parseFloat(t.amount);
        } else {
            monthlyData[monthKey].expenses += parseFloat(t.amount);
        }
    });
    
    const months = Object.keys(monthlyData).sort().reverse();
    
    dashboard.innerHTML = `
        <div class="page-container">
            <div class="page-header">
                <h1>Monthly Transactions</h1>
                <button class="back-btn" onclick="location.reload()">← Back to Dashboard</button>
            </div>
            <div class="content-card">
                <div id="monthlyList">
                    ${months.length === 0 ? '<div class="empty-state">No transactions yet</div>' : 
                        months.map(month => {
                            const data = monthlyData[month];
                            return `
                                <div class="fund-card" style="border-left-color: #3b82f6;">
                                    <div class="fund-header">
                                        <div class="fund-name">${formatMonth(month)}</div>
                                        <div style="text-align: right;">
                                            <div style="color: #10b981; font-size: 14px;">Income: ₹${data.income.toFixed(2)}</div>
                                            <div style="color: #ef4444; font-size: 14px;">Expenses: ₹${data.expenses.toFixed(2)}</div>
                                            <div style="font-weight: 700; margin-top: 4px;">Net: ₹${(data.income - data.expenses).toFixed(2)}</div>
                                        </div>
                                    </div>
                                    <div style="margin-top: 16px; font-size: 14px; color: #64748b;">
                                        ${data.transactions.length} transaction${data.transactions.length !== 1 ? 's' : ''}
                                    </div>
                                </div>
                            `;
                        }).join('')
                    }
                </div>
            </div>
        </div>
    `;
}

function createSavingsFundsPage() {
    const dashboard = document.getElementById('dashboardPage');
    
    dashboard.innerHTML = `
        <div class="page-container">
            <div class="page-header">
                <h1>Savings Funds</h1>
                <div style="display: flex; gap: 12px;">
                    <button class="btn btn-primary" onclick="openCreateFundModal()">Create Fund</button>
                    <button class="back-btn" onclick="location.reload()">← Back</button>
                </div>
            </div>
            <div class="content-card">
                <div id="fundsList">
                    ${savingsFunds.filter(f => f.status === 'active').length === 0 ? 
                        '<div class="empty-state">No active savings funds</div>' :
                        savingsFunds.filter(f => f.status === 'active').map(fund => `
                            <div class="fund-card">
                                <div class="fund-header">
                                    <div class="fund-name">${fund.name}</div>
                                    <div class="fund-amount">₹${parseFloat(fund.amount).toFixed(2)}</div>
                                </div>
                                <div style="font-size: 13px; color: #64748b; margin-top: 8px;">
                                    Created: ${formatDate(fund.createdDate)}
                                </div>
                                <div class="fund-actions">
                                    <button class="btn btn-primary small-btn" onclick="addToFund('${fund.id}')">Add Money</button>
                                    <button class="btn btn-secondary small-btn" onclick="withdrawFromFund('${fund.id}')">Withdraw</button>
                                    <button class="btn btn-secondary small-btn" onclick="closeFund('${fund.id}')">Close Fund</button>
                                </div>
                            </div>
                        `).join('')
                    }
                </div>
            </div>
        </div>
    `;
}

function createDebtsPage() {
    const dashboard = document.getElementById('dashboardPage');
    
    const activeDebts = debts.filter(d => d.status === 'active');
    const youOwe = activeDebts.filter(d => d.type === 'owe');
    const owedToYou = activeDebts.filter(d => d.type === 'owing');
    
    dashboard.innerHTML = `
        <div class="page-container">
            <div class="page-header">
                <h1>Debts & Credits</h1>
                <div style="display: flex; gap: 12px;">
                    <button class="btn btn-primary" onclick="openAddDebtModal()">Add New</button>
                    <button class="back-btn" onclick="location.reload()">← Back</button>
                </div>
            </div>
            
            <div class="content-card" style="margin-bottom: 20px;">
                <h2 style="margin-bottom: 16px; color: #ef4444;">You Owe</h2>
                <div>
                    ${youOwe.length === 0 ? '<div class="empty-state">No debts</div>' :
                        youOwe.map(debt => createDebtHTML(debt)).join('')
                    }
                </div>
            </div>
            
            <div class="content-card">
                <h2 style="margin-bottom: 16px; color: #10b981;">Owed to You</h2>
                <div>
                    ${owedToYou.length === 0 ? '<div class="empty-state">No credits</div>' :
                        owedToYou.map(debt => createDebtHTML(debt)).join('')
                    }
                </div>
            </div>
        </div>
    `;
}

function createDebtHTML(debt) {
    const borderColor = debt.type === 'owe' ? '#ef4444' : '#10b981';
    return `
        <div class="debt-card" style="border-left-color: ${borderColor};">
            <div class="debt-header">
                <div class="debt-person">${debt.person}</div>
                <div class="debt-amount">₹${parseFloat(debt.amount).toFixed(2)}</div>
            </div>
            ${debt.description ? `<div style="font-size: 14px; color: #64748b; margin: 8px 0;">${debt.description}</div>` : ''}
            <div style="font-size: 13px; color: #64748b;">Date: ${formatDate(debt.date)}</div>
            <div class="debt-actions">
                <button class="btn btn-primary small-btn" onclick="settleDebt('${debt.id}')">Settle</button>
                <button class="btn btn-secondary small-btn" onclick="deleteDebt('${debt.id}')">Delete</button>
            </div>
        </div>
    `;
}

// Helper Functions
function formatDate(dateString) {
    const date = new Date(dateString);
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return date.toLocaleDateString('en-IN', options);
}

function formatMonth(monthString) {
    const [year, month] = monthString.split('-');
    const date = new Date(year, parseInt(month) - 1);
    return date.toLocaleDateString('en-IN', { year: 'numeric', month: 'long' });
}

function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function showLoading() {
    // Simple loading implementation
    console.log('Loading...');
}

function hideLoading() {
    console.log('Loading complete');
}

// Demo Data (fallback when Google Sheets is not configured)
function useDemoData() {
    currentBalance = 15000;
    transactions = [
        {
            id: '1',
            type: 'credit',
            amount: 50000,
            category: 'Salary',
            description: 'Monthly salary',
            date: '2026-02-01',
            timestamp: new Date().toISOString()
        },
        {
            id: '2',
            type: 'debit',
            amount: 5000,
            category: 'Rent',
            description: 'House rent',
            date: '2026-02-02',
            timestamp: new Date().toISOString()
        },
        {
            id: '3',
            type: 'debit',
            amount: 30000,
            category: 'Savings',
            description: 'Moved to savings fund',
            date: '2026-02-05',
            timestamp: new Date().toISOString()
        }
    ];
    
    savingsFunds = [
        {
            id: '1',
            name: 'Emergency Fund',
            amount: 25000,
            createdDate: '2026-01-01',
            status: 'active'
        },
        {
            id: '2',
            name: 'Vacation Fund',
            amount: 5000,
            createdDate: '2026-01-15',
            status: 'active'
        }
    ];
    
    debts = [
        {
            id: '1',
            person: 'Rahul',
            amount: 2000,
            type: 'owe',
            description: 'Borrowed for books',
            date: '2026-01-20',
            status: 'active'
        },
        {
            id: '2',
            person: 'Priya',
            amount: 1500,
            type: 'owing',
            description: 'Lent for groceries',
            date: '2026-01-25',
            status: 'active'
        }
    ];
    
    updateDashboard();
}

// Additional modal functions (simplified versions)
function openCreateFundModal() {
    const name = prompt('Enter fund name:');
    if (!name) return;
    
    const amount = prompt('Enter initial amount (optional):');
    const initialAmount = amount ? parseFloat(amount) : 0;
    
    if (initialAmount > currentBalance) {
        alert('Insufficient balance!');
        return;
    }
    
    const fund = {
        id: generateId(),
        name,
        amount: initialAmount,
        createdDate: new Date().toISOString().split('T')[0],
        status: 'active'
    };
    
    savingsFunds.push(fund);
    
    if (initialAmount > 0) {
        currentBalance -= initialAmount;
        updateBalance(currentBalance);
    }
    
    location.reload();
}

function addToFund(id) {
    const amount = prompt('Enter amount to add:');
    if (!amount) return;
    
    const amountNum = parseFloat(amount);
    
    if (amountNum > currentBalance) {
        alert('Insufficient balance!');
        return;
    }
    
    const fund = savingsFunds.find(f => f.id === id);
    fund.amount = parseFloat(fund.amount) + amountNum;
    currentBalance -= amountNum;
    
    updateBalance(currentBalance);
    location.reload();
}

function withdrawFromFund(id) {
    const amount = prompt('Enter amount to withdraw:');
    if (!amount) return;
    
    const amountNum = parseFloat(amount);
    const fund = savingsFunds.find(f => f.id === id);
    
    if (amountNum > fund.amount) {
        alert('Insufficient fund balance!');
        return;
    }
    
    fund.amount = parseFloat(fund.amount) - amountNum;
    currentBalance += amountNum;
    
    updateBalance(currentBalance);
    location.reload();
}

function closeFund(id) {
    if (!confirm('Are you sure you want to close this fund? The amount will be added back to your balance.')) return;
    
    const fund = savingsFunds.find(f => f.id === id);
    currentBalance += parseFloat(fund.amount);
    fund.status = 'closed';
    
    updateBalance(currentBalance);
    location.reload();
}

function openAddDebtModal() {
    const type = confirm('Click OK if you OWE someone, Cancel if someone OWES you');
    const debtType = type ? 'owe' : 'owing';
    
    const person = prompt('Enter person name:');
    if (!person) return;
    
    const amount = prompt('Enter amount:');
    if (!amount) return;
    
    const description = prompt('Enter description (optional):');
    
    const debt = {
        id: generateId(),
        person,
        amount: parseFloat(amount),
        type: debtType,
        description: description || '',
        date: new Date().toISOString().split('T')[0],
        status: 'active'
    };
    
    debts.push(debt);
    location.reload();
}

function settleDebt(id) {
    if (!confirm('Mark this debt as settled?')) return;
    
    const debt = debts.find(d => d.id === id);
    debt.status = 'settled';
    
    location.reload();
}

function deleteDebt(id) {
    if (!confirm('Delete this debt record?')) return;
    
    debts = debts.filter(d => d.id !== id);
    location.reload();
}

  function updateTime() {
    const now = new Date();
    const timeString = now.toLocaleTimeString();
    document.getElementById("live-time").textContent = timeString;
  }

  updateTime();
  setInterval(updateTime, 1000);

