// Check authentication on page load
document.addEventListener('DOMContentLoaded', function() {
    const authData = JSON.parse(sessionStorage.getItem('auth'));
    
    // Redirect to login if not authenticated
    if (!authData) {
        if (!window.location.pathname.endsWith('login.html')) {
            window.location.href = 'login.html';
        }
        return;
    }
    
    // Hide admin-only features for regular users
    if (authData.role !== 'admin') {
        // Hide reports link in navigation
        const reportsNavItems = document.querySelectorAll('nav a[href="reports.html"]');
        reportsNavItems.forEach(item => item.style.display = 'none');
        
        // Hide reports in quick actions
        const reportsQuickActions = document.querySelectorAll('.sidebar a[href="reports.html"]');
        reportsQuickActions.forEach(item => item.style.display = 'none');
        
        // Redirect if on reports page
        if (window.location.pathname.endsWith('reports.html')) {
            window.location.href = 'index.html';
        }
    }
    
    // Add logout functionality
    const logoutButtons = document.querySelectorAll('.logout-btn');
    logoutButtons.forEach(button => {
        button.addEventListener('click', function() {
            sessionStorage.removeItem('auth');
            window.location.href = 'login.html';
        });
    });
});

const supabaseUrl = 'YOUR_SUPABASE_URL';
const supabaseKey = 'YOUR_SUPABASE_ANON_KEY';
const supabase = supabase.createClient(supabaseUrl, supabaseKey);

// DOM Elements
document.addEventListener('DOMContentLoaded', function() {
    // Tab Navigation
    setupTabNavigation();
    
    // Form Validation
    setupFormValidation();
    
    // Modal Functionality
    setupModalFunctionality();
    
    // Load Sample Data
    loadSampleData();
    
    // Set today's date as default for date inputs
    setDefaultDates();
});

// Tab Navigation Setup
function setupTabNavigation() {
    // Sidebar navigation
    const sidebarLinks = document.querySelectorAll('.sidebar ul li a');
    const contentSections = document.querySelectorAll('.content > div');
    
    sidebarLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Remove active class from all links and sections
            sidebarLinks.forEach(l => l.classList.remove('active'));
            contentSections.forEach(section => section.classList.remove('active'));
            
            // Add active class to clicked link
            this.classList.add('active');
            
            // Show corresponding section
            const targetId = this.id.replace('-link', '-section');
            document.getElementById(targetId).classList.add('active');
        });
    });
    
    // Inner tab navigation (for nested tabs)
    const tabButtons = document.querySelectorAll('.tab-button');
    
    tabButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Get parent tab container
            const tabContainer = this.closest('.tab-container');
            
            // Remove active class from all buttons and content in this container
            tabContainer.querySelectorAll('.tab-button').forEach(btn => {
                btn.classList.remove('active');
            });
            
            tabContainer.querySelectorAll('.tab-content').forEach(content => {
                content.classList.remove('active');
            });
            
            // Add active class to clicked button
            this.classList.add('active');
            
            // Show corresponding content
            const targetTabId = this.getAttribute('data-tab');
            document.getElementById(targetTabId).classList.add('active');
        });
    });
}

// Form Validation Setup
function setupFormValidation() {
    // Loan Form
    const loanForm = document.getElementById('loan-form');
    if (loanForm) {
        loanForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Basic validation
            const loanAmount = document.getElementById('loan-amount').value;
            const loanTerm = document.getElementById('loan-term').value;
            const interestRate = document.getElementById('interest-rate').value;
            const clientSelect = document.getElementById('client-select').value;
            
            if (!clientSelect) {
                showAlert('Please select a client', 'danger');
                return;
            }
            
            if (loanAmount < 50000) {
                showAlert('Loan amount must be at least 50,000 TZS', 'danger');
                return;
            }
            
            if (loanTerm < 1 || loanTerm > 36) {
                showAlert('Loan term must be between 1 and 36 months', 'danger');
                return;
            }
            
            if (interestRate < 0 || interestRate > 100) {
                showAlert('Interest rate must be between 0% and 100%', 'danger');
                return;
            }
            
            // If validation passes, submit the form
            saveLoanToSupabase(this);
            showAlert('Loan created successfully!', 'success');
            this.reset();
        });
    }
    
    // Client Form
    const clientForm = document.getElementById('client-form');
    if (clientForm) {
        clientForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Basic validation
            const clientName = document.getElementById('client-name').value;
            const clientIdNumber = document.getElementById('client-id-number').value;
            const clientPhone = document.getElementById('client-phone').value;
            
            if (!clientName || clientName.length < 3) {
                showAlert('Please enter a valid client name', 'danger');
                return;
            }
            
            if (!clientIdNumber || clientIdNumber.length < 5) {
                showAlert('Please enter a valid ID number', 'danger');
                return;
            }
            
            if (!clientPhone || !validatePhone(clientPhone)) {
                showAlert('Please enter a valid phone number', 'danger');
                return;
            }
            
            // If validation passes, submit the form
            saveClientToSupabase(this);
            showAlert('Client registered successfully!', 'success');
            this.reset();
        });
    }
    
    // Payment Form
    const paymentForm = document.getElementById('payment-form');
    if (paymentForm) {
        paymentForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Basic validation
            const paymentAmount = document.getElementById('payment-amount').value;
            const paymentAmountDue = document.getElementById('payment-amount-due').value;
            
            if (!paymentAmount || paymentAmount <= 0) {
                showAlert('Please enter a valid payment amount', 'danger');
                return;
            }
            
            // If validation passes, submit the form
            savePaymentToSupabase(this);
            showAlert('Payment recorded successfully!', 'success');
            this.reset();
        });
    }
    
    // Disbursement Form
    const disbursementForm = document.getElementById('disbursement-form');
    if (disbursementForm) {
        disbursementForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Basic validation
            const disburseMethod = document.getElementById('disburse-method').value;
            
            if (!disburseMethod) {
                showAlert('Please select a disbursement method', 'danger');
                return;
            }
            
            // If validation passes, submit the form
            saveDisbursementToSupabase(this);
            showAlert('Disbursement processed successfully!', 'success');
            this.reset();
            closeModal('disbursement-modal');
        });
    }
}

// Modal Functionality Setup
function setupModalFunctionality() {
    // Close modal buttons
    const closeButtons = document.querySelectorAll('.close-modal');
    closeButtons.forEach(button => {
        button.addEventListener('click', function() {
            const modalId = this.closest('.modal').id;
            closeModal(modalId);
        });
    });
    
    // Close modal when clicking outside
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        modal.addEventListener('click', function(e) {
            if (e.target === this) {
                closeModal(this.id);
            }
        });
    });
    
    // Open disbursement modal
    const disburseButtons = document.querySelectorAll('.disburse-btn');
    disburseButtons.forEach(button => {
        button.addEventListener('click', function() {
            const loanId = this.getAttribute('data-loan-id');
            const clientName = this.getAttribute('data-client');
            const amount = this.getAttribute('data-amount');
            
            // Populate modal fields
            document.getElementById('disburse-loan-id').value = loanId;
            document.getElementById('disburse-client').value = clientName;
            document.getElementById('disburse-amount').value = amount;
            
            // Open modal
            openModal('disbursement-modal');
        });
    });
}

// Sample Data Loading
function loadSampleData() {
    // Sample clients data
    const sampleClients = [
        { id: 1, name: 'John Mbwana', idNumber: 'TZ19850502', phone: '+255 712 345 678', location: 'Mwenge, Dar es Salaam', business: 'Food Vendor', gender: 'Male', dob: '1985-05-02', group: 'Mwenge Market' },
        { id: 2, name: 'Amina Hassan', idNumber: 'TZ19900715', phone: '+255 755 678 901', location: 'Kariakoo, Dar es Salaam', business: 'Clothing Shop', gender: 'Female', dob: '1990-07-15', group: 'Kariakoo Traders' },
        { id: 3, name: 'Emmanuel Mtui', idNumber: 'TZ19780220', phone: '+255 786 123 456', location: 'Mbezi, Dar es Salaam', business: 'Farmer', gender: 'Male', dob: '1978-02-20', group: 'Mbezi Farmers' },
        { id: 4, name: 'Fatma Juma', idNumber: 'TZ19880610', phone: '+255 744 234 567', location: 'Ilala, Dar es Salaam', business: 'Tailor', gender: 'Female', dob: '1988-06-10', group: 'Ilala Women' },
        { id: 5, name: 'David Mwakyusa', idNumber: 'TZ19920425', phone: '+255 765 345 678', location: 'Temeke, Dar es Salaam', business: 'Carpenter', gender: 'Male', dob: '1992-04-25', group: '' }
    ];

    // Sample loans data
    const sampleLoans = [
        { id: 'L2023001', clientId: 1, clientName: 'John Mbwana', amount: 500000, disburseDate: '2023-02-15', status: 'Active', purpose: 'Business' },
        { id: 'L2023002', clientId: 2, clientName: 'Amina Hassan', amount: 750000, disburseDate: '2023-03-10', status: 'Active', purpose: 'Business' },
        { id: 'L2023003', clientId: 3, clientName: 'Emmanuel Mtui', amount: 1000000, disburseDate: '2023-01-20', status: 'Overdue', purpose: 'Agriculture' },
        { id: 'L2023004', clientId: 4, clientName: 'Fatma Juma', amount: 300000, disburseDate: '2023-04-05', status: 'Fully Paid', purpose: 'Home Improvement' },
        { id: 'L2023005', clientId: 5, clientName: 'David Mwakyusa', amount: 850000, disburseDate: '2023-05-12', status: 'Pending', purpose: 'Business' }
    ];

    // Sample disbursements
    const sampleDisbursements = [
        { loanId: 'L2023001', clientName: 'John Mbwana', amount: 500000, status: 'Disbursed' },
        { loanId: 'L2023002', clientName: 'Amina Hassan', amount: 750000, status: 'Disbursed' },
        { loanId: 'L2023003', clientName: 'Emmanuel Mtui', amount: 1000000, status: 'Disbursed' },
        { loanId: 'L2023004', clientName: 'Fatma Juma', amount: 300000, status: 'Disbursed' },
        { loanId: 'L2023005', clientName: 'David Mwakyusa', amount: 850000, status: 'Pending' }
    ];

    // Sample payments
    const samplePayments = [
        { id: 'P2023001', loanId: 'L2023001', clientName: 'John Mbwana', amount: 150000, date: '2023-03-15', method: 'Mobile Money' },
        { id: 'P2023002', loanId: 'L2023002', clientName: 'Amina Hassan', amount: 200000, date: '2023-04-10', method: 'Cash' },
        { id: 'P2023003', loanId: 'L2023001', clientName: 'John Mbwana', amount: 150000, date: '2023-04-15', method: 'Mobile Money' },
        { id: 'P2023004', loanId: 'L2023003', clientName: 'Emmanuel Mtui', amount: 250000, date: '2023-02-20', method: 'Bank Transfer' },
        { id: 'P2023005', loanId: 'L2023004', clientName: 'Fatma Juma', amount: 300000, date: '2023-05-05', method: 'Mobile Money' }
    ];

    // Populate client select
    const clientSelect = document.getElementById('client-select');
    if (clientSelect) {
        sampleClients.forEach(client => {
            const option = document.createElement('option');
            option.value = client.id;
            option.textContent = client.name;
            clientSelect.appendChild(option);
        });
    }

    // Populate loans table
    const loansTableBody = document.getElementById('loans-table-body');
    if (loansTableBody) {
        sampleLoans.forEach(loan => {
            const row = document.createElement('tr');
            
            // Format status badge
            let statusBadgeClass = '';
            switch(loan.status) {
                case 'Active':
                    statusBadgeClass = 'badge-success';
                    break;
                case 'Overdue':
                    statusBadgeClass = 'badge-danger';
                    break;
                case 'Pending':
                    statusBadgeClass = 'badge-warning';
                    break;
                default:
                    statusBadgeClass = 'badge-success';
            }
            
            // Format currency
            const formattedAmount = new Intl.NumberFormat().format(loan.amount);
            
            row.innerHTML = `
                <td>${loan.id}</td>
                <td>${loan.clientName}</td>
                <td>${formattedAmount}</td>
                <td>${loan.disburseDate}</td>
                <td><span class="badge ${statusBadgeClass}">${loan.status}</span></td>
                <td>
                    <button class="action-btn action-btn-view">View</button>
                    <button class="action-btn action-btn-edit">Edit</button>
                </td>
            `;
            
            loansTableBody.appendChild(row);
        });
    }

    // Populate disbursements table
    const disbursementTableBody = document.getElementById('disbursement-table-body');
    if (disbursementTableBody) {
        sampleDisbursements.forEach(disbursement => {
            const row = document.createElement('tr');
            
            // Format status badge
            let statusBadgeClass = disbursement.status === 'Disbursed' ? 'badge-success' : 'badge-warning';
            
            // Format currency
            const formattedAmount = new Intl.NumberFormat().format(disbursement.amount);
            
            row.innerHTML = `
                <td>${disbursement.loanId}</td>
                <td>${disbursement.clientName}</td>
                <td>${formattedAmount}</td>
                <td><span class="badge ${statusBadgeClass}">${disbursement.status}</span></td>
                <td>
                    ${disbursement.status === 'Pending' ? 
                    `<button class="action-btn action-btn-edit disburse-btn" 
                        data-loan-id="${disbursement.loanId}" 
                        data-client="${disbursement.clientName}" 
                        data-amount="${disbursement.amount}">Disburse</button>` : 
                    `<button class="action-btn action-btn-view">View</button>`}
                </td>
            `;
            
            disbursementTableBody.appendChild(row);
        });
    }

// Populate payment history table
const paymentHistoryTable = document.getElementById('payment-history-table');
if (paymentHistoryTable) {
    const paymentHistoryBody = paymentHistoryTable.querySelector('tbody') || paymentHistoryTable;
    
    samplePayments.forEach(payment => {
        const row = document.createElement('tr');
        
        // Format currency
        const formattedAmount = new Intl.NumberFormat().format(payment.amount);
        
        row.innerHTML = `
            <td>${payment.id}</td>
            <td>${payment.loanId}</td>
            <td>${payment.clientName}</td>
            <td>${formattedAmount}</td>
            <td>${payment.date}</td>
            <td>${payment.method}</td>
            <td>
                <button class="action-btn action-btn-view">View</button>
            </td>
        `;
        
        paymentHistoryBody.appendChild(row);
    });
}

// Populate clients table
const clientsTableBody = document.getElementById('clients-table-body');
if (clientsTableBody) {
    sampleClients.forEach(client => {
        const row = document.createElement('tr');
        
        row.innerHTML = `
            <td>${client.name}</td>
            <td>${client.idNumber}</td>
            <td>${client.phone}</td>
            <td>${client.location}</td>
            <td>${client.business}</td>
            <td>
                <button class="action-btn action-btn-view">View</button>
                <button class="action-btn action-btn-edit">Edit</button>
            </td>
        `;
        
        clientsTableBody.appendChild(row);
    });
}

// Update dashboard stats
updateDashboardStats(sampleLoans, samplePayments, sampleClients);
}

// Set default dates for date inputs
function setDefaultDates() {
const dateInputs = document.querySelectorAll('input[type="date"]');
const today = new Date().toISOString().split('T')[0];

dateInputs.forEach(input => {
    input.value = today;
});
}

// Validate phone number
function validatePhone(phone) {
// Basic validation for now - at least 9 digits
return /\d{9,}/.test(phone);
}

// Open modal
function openModal(modalId) {
document.getElementById(modalId).style.display = 'flex';
}

// Close modal
function closeModal(modalId) {
document.getElementById(modalId).style.display = 'none';
}

// Show alert
function showAlert(message, type) {
const alertDiv = document.createElement('div');
alertDiv.className = `alert alert-${type}`;
alertDiv.textContent = message;

// Add to container
const alertContainer = document.getElementById('alert-container');
alertContainer.appendChild(alertDiv);

// Auto-remove after 3 seconds
setTimeout(() => {
    alertDiv.classList.add('fade-out');
    setTimeout(() => {
        alertDiv.remove();
    }, 500);
}, 3000);
}

// Update dashboard stats
function updateDashboardStats(loans, payments, clients) {
// Calculate total loans amount
const totalLoansAmount = loans.reduce((total, loan) => total + loan.amount, 0);
const pendingLoans = loans.filter(loan => loan.status === 'Pending').length;
const activeLoans = loans.filter(loan => loan.status === 'Active').length;
const overdueLoans = loans.filter(loan => loan.status === 'Overdue').length;

// Calculate total payments
const totalPayments = payments.reduce((total, payment) => total + payment.amount, 0);

// Update stats in DOM
const statElements = {
    'total-loans': new Intl.NumberFormat().format(totalLoansAmount) + ' TZS',
    'total-payments': new Intl.NumberFormat().format(totalPayments) + ' TZS',
    'pending-loans': pendingLoans,
    'active-loans': activeLoans,
    'overdue-loans': overdueLoans,
    'total-clients': clients.length
};

for (const [id, value] of Object.entries(statElements)) {
    const element = document.getElementById(id);
    if (element) {
        element.textContent = value;
    }
}

// Update chart if it exists
updateDashboardCharts(loans, payments);
}

// Update dashboard charts
function updateDashboardCharts(loans, payments) {
// Loan status chart
const loanStatusChart = document.getElementById('loan-status-chart');
if (loanStatusChart && window.Chart) {
    // Count loans by status
    const statusCounts = {
        'Active': loans.filter(loan => loan.status === 'Active').length,
        'Pending': loans.filter(loan => loan.status === 'Pending').length,
        'Overdue': loans.filter(loan => loan.status === 'Overdue').length,
        'Fully Paid': loans.filter(loan => loan.status === 'Fully Paid').length
    };
    
    new Chart(loanStatusChart, {
        type: 'doughnut',
        data: {
            labels: Object.keys(statusCounts),
            datasets: [{
                data: Object.values(statusCounts),
                backgroundColor: [
                    '#28a745', // Active - Green
                    '#ffc107', // Pending - Yellow
                    '#dc3545', // Overdue - Red
                    '#17a2b8'  // Fully Paid - Blue
                ]
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false
        }
    });
}

// Payment history chart
const paymentHistoryChart = document.getElementById('payment-history-chart');
if (paymentHistoryChart && window.Chart) {
    // Group payments by month
    const paymentsByMonth = {};
    
    payments.forEach(payment => {
        const month = payment.date.substring(0, 7); // YYYY-MM
        if (!paymentsByMonth[month]) {
            paymentsByMonth[month] = 0;
        }
        paymentsByMonth[month] += payment.amount;
    });
    
    // Sort months
    const sortedMonths = Object.keys(paymentsByMonth).sort();
    
    new Chart(paymentHistoryChart, {
        type: 'line',
        data: {
            labels: sortedMonths,
            datasets: [{
                label: 'Payment Amount',
                data: sortedMonths.map(month => paymentsByMonth[month]),
                borderColor: '#007bff',
                tension: 0.1,
                fill: false
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return value.toLocaleString() + ' TZS';
                        }
                    }
                }
            }
        }
    });
}
}

// Supabase functions
async function saveClientToSupabase(form) {
try {
    const clientData = {
        name: form.querySelector('#client-name').value,
        id_number: form.querySelector('#client-id-number').value,
        phone: form.querySelector('#client-phone').value,
        gender: form.querySelector('#client-gender').value,
        dob: form.querySelector('#client-dob').value,
        location: form.querySelector('#client-location').value,
        business: form.querySelector('#client-business').value,
        group: form.querySelector('#client-group').value || null
    };
    
    // Insert client into Supabase
    const { data, error } = await supabase
        .from('clients')
        .insert([clientData]);
        
    if (error) throw error;
    
    // Refresh client data
    loadClientData();
    
} catch (error) {
    console.error('Error saving client:', error);
    showAlert('Failed to save client data: ' + error.message, 'danger');
}
}

async function saveLoanToSupabase(form) {
try {
    const loanData = {
        client_id: parseInt(form.querySelector('#client-select').value),
        amount: parseFloat(form.querySelector('#loan-amount').value),
        term: parseInt(form.querySelector('#loan-term').value),
        interest_rate: parseFloat(form.querySelector('#interest-rate').value),
        purpose: form.querySelector('#loan-purpose').value,
        disburse_date: form.querySelector('#disburse-date').value,
        status: 'Pending'
    };
    
    // Calculate repayment schedule
    // This would be more complex in a real app
    
    // Insert loan into Supabase
    const { data, error } = await supabase
        .from('loans')
        .insert([loanData]);
        
    if (error) throw error;
    
    // Refresh loan data
    loadLoanData();
    
} catch (error) {
    console.error('Error saving loan:', error);
    showAlert('Failed to save loan data: ' + error.message, 'danger');
}
}

async function savePaymentToSupabase(form) {
try {
    const paymentData = {
        loan_id: form.querySelector('#payment-loan-id').value,
        amount: parseFloat(form.querySelector('#payment-amount').value),
        date: form.querySelector('#payment-date').value,
        method: form.querySelector('#payment-method').value,
        notes: form.querySelector('#payment-notes').value || null
    };
    
    // Insert payment into Supabase
    const { data, error } = await supabase
        .from('payments')
        .insert([paymentData]);
        
    if (error) throw error;
    
    // Update loan status if needed
    updateLoanStatusAfterPayment(form.querySelector('#payment-loan-id').value);
    
    // Refresh payment data
    loadPaymentData();
    
} catch (error) {
    console.error('Error saving payment:', error);
    showAlert('Failed to save payment data: ' + error.message, 'danger');
}
}

async function saveDisbursementToSupabase(form) {
try {
    const disbursementData = {
        loan_id: form.querySelector('#disburse-loan-id').value,
        amount: parseFloat(form.querySelector('#disburse-amount').value),
        method: form.querySelector('#disburse-method').value,
        date: form.querySelector('#disburse-date').value,
        notes: form.querySelector('#disburse-notes').value || null
    };
    
    // Insert disbursement into Supabase
    const { data, error } = await supabase
        .from('disbursements')
        .insert([disbursementData]);
        
    if (error) throw error;
    
    // Update loan status to Active
    updateLoanStatus(form.querySelector('#disburse-loan-id').value, 'Active');
    
    // Refresh disbursement data
    loadDisbursementData();
    
} catch (error) {
    console.error('Error saving disbursement:', error);
    showAlert('Failed to save disbursement data: ' + error.message, 'danger');
}
}

async function updateLoanStatus(loanId, status) {
try {
    const { data, error } = await supabase
        .from('loans')
        .update({ status: status })
        .eq('id', loanId);
        
    if (error) throw error;
    
    // Refresh loan data
    loadLoanData();
    
} catch (error) {
    console.error('Error updating loan status:', error);
    showAlert('Failed to update loan status: ' + error.message, 'danger');
}
}

async function updateLoanStatusAfterPayment(loanId) {
try {
    // Get loan details
    const { data: loanData, error: loanError } = await supabase
        .from('loans')
        .select('*')
        .eq('id', loanId)
        .single();
        
    if (loanError) throw loanError;
    
    // Get all payments for this loan
    const { data: paymentsData, error: paymentsError } = await supabase
        .from('payments')
        .select('amount')
        .eq('loan_id', loanId);
        
    if (paymentsError) throw paymentsError;
    
    // Calculate total paid
    const totalPaid = paymentsData.reduce((sum, payment) => sum + payment.amount, 0);
    
    // Calculate total due (simplified - in a real app this would include interest)
    const totalDue = loanData.amount;
    
    // Update loan status based on payment status
    let newStatus = loanData.status;
    
    if (totalPaid >= totalDue) {
        newStatus = 'Fully Paid';
    } else if (loanData.status === 'Overdue' && totalPaid > 0) {
        // This is simplified - a real app would have more complex logic
        newStatus = 'Active';
    }
    
    // Only update if status changed
    if (newStatus !== loanData.status) {
        await updateLoanStatus(loanId, newStatus);
    }
    
} catch (error) {
    console.error('Error updating loan status after payment:', error);
}
}

// Data loading functions
async function loadClientData() {
try {
    // In a real app, this would fetch from Supabase
    // For now, we'll just re-apply our sample data
    loadSampleData();
} catch (error) {
    console.error('Error loading client data:', error);
    showAlert('Failed to load client data', 'danger');
}
}

async function loadLoanData() {
try {
    // In a real app, this would fetch from Supabase
    // For now, we'll just re-apply our sample data
    loadSampleData();
} catch (error) {
    console.error('Error loading loan data:', error);
    showAlert('Failed to load loan data', 'danger');
}
}

async function loadPaymentData() {
try {
    // In a real app, this would fetch from Supabase
    // For now, we'll just re-apply our sample data
    loadSampleData();
} catch (error) {
    console.error('Error loading payment data:', error);
    showAlert('Failed to load payment data', 'danger');
}
}

async function loadDisbursementData() {
try {
    // In a real app, this would fetch from Supabase
    // For now, we'll just re-apply our sample data
    loadSampleData();
} catch (error) {
    console.error('Error loading disbursement data:', error);
    showAlert('Failed to load disbursement data', 'danger');
}
}