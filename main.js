// Check authentication on page load and implement cache control
document.addEventListener('DOMContentLoaded', function() {
    // Prevent caching of protected pages to solve back button issue
    preventCaching();
    
    const authData = JSON.parse(sessionStorage.getItem('auth'));
    
    // Redirect to login if not authenticated
    if (!authData) {
        if (!window.location.pathname.endsWith('login.html')) {
            window.location.replace('login.html');
            return;
        }
        return;
    }

    // Display user info
    displayUserInfo(authData);
    
    // Handle role-based access control
    handleRoleBasedAccess(authData);
    
    // Add logout functionality with enhanced security
    const logoutButtons = document.querySelectorAll('.logout-btn');
    logoutButtons.forEach(button => {
        button.addEventListener('click', function() {
            logout();
        });
    });
});

// Prevent caching to solve back button issue
function preventCaching() {
    // Set no-cache headers using meta tags
    const metaNoCache = document.createElement('meta');
    metaNoCache.setAttribute('http-equiv', 'Cache-Control');
    metaNoCache.setAttribute('content', 'no-cache, no-store, must-revalidate');
    document.head.appendChild(metaNoCache);
    
    const metaNoStore = document.createElement('meta');
    metaNoStore.setAttribute('http-equiv', 'Pragma');
    metaNoStore.setAttribute('content', 'no-cache');
    document.head.appendChild(metaNoStore);
    
    const metaExpires = document.createElement('meta');
    metaExpires.setAttribute('http-equiv', 'Expires');
    metaExpires.setAttribute('content', '0');
    document.head.appendChild(metaExpires);
    
    // Add event listener for beforeunload to clear cache when navigating away
    window.addEventListener('beforeunload', function() {
        // This helps prevent the page from being cached in browser history
        window.history.pushState('', document.title, window.location.pathname);
    });
    
    // Handle popstate (back/forward button) events
    window.addEventListener('popstate', function(event) {
        // Check authentication when navigating with browser history
        const authData = JSON.parse(sessionStorage.getItem('auth'));
        if (!authData && !window.location.pathname.endsWith('login.html')) {
            window.location.replace('login.html');
        }
    });
}

// Display user info in the UI
function displayUserInfo(authData) {
    const userDisplayElements = document.querySelectorAll('.user-display');
    if (userDisplayElements.length > 0) {
        userDisplayElements.forEach(element => {
            element.textContent = authData.username;
        });
    }
    
    const roleDisplayElements = document.querySelectorAll('.role-display');
    if (roleDisplayElements.length > 0) {
        roleDisplayElements.forEach(element => {
            element.textContent = authData.role;
        });
    }
}

// Handle role-based access control
function handleRoleBasedAccess(authData) {
    // Admin has full access
    if (authData.role === 'admin') {
        // Nothing to hide for admin
        return;
    }
    
    // Non-admin users: hide admin-only features
    
    // Hide reports link in navigation
    const reportsNavItems = document.querySelectorAll('nav a[href="reports.html"]');
    reportsNavItems.forEach(item => item.style.display = 'none');
    
    // Hide reports in quick actions
    const reportsQuickActions = document.querySelectorAll('.sidebar a[href="reports.html"]');
    reportsQuickActions.forEach(item => item.style.display = 'none');
    
    // Redirect if on reports page
    if (window.location.pathname.endsWith('reports.html')) {
        window.location.replace('index.html');
        return;
    }
    
    // Filter data to show only user's own records
    filterDataForUser(authData.userId);
}

// Logout with enhanced security
function logout() {
    // Clear auth data
    sessionStorage.removeItem('auth');
    localStorage.removeItem('auth'); // In case auth is also stored in localStorage
    
    // Clear any other sensitive data
    sessionStorage.clear();
    
    // Prevent back button from showing cached content
    window.history.pushState(null, '', 'login.html');
    
    // Redirect to login page using replace to prevent back navigation
    window.location.replace('login.html');
}

// Filter data to show only records created by current user
async function filterDataForUser(userId) {
    try {
        // Filter loans table
        filterTableByUserId('loans-table-body', userId);
        
        // Filter clients table
        filterTableByUserId('clients-table-body', userId);
        
        // Filter payments table
        filterTableByUserId('payment-history-table tbody', userId);
        
        // Filter disbursements table
        filterTableByUserId('disbursement-table-body', userId);
        
        // Update dashboard stats to show only user's data
        updateDashboardStatsForUser(userId);
        
    } catch (error) {
        console.error('Error filtering data for user:', error);
    }
}

// Filter table rows to show only those belonging to current user
function filterTableByUserId(tableBodyId, userId) {
    const tableBody = document.getElementById(tableBodyId);
    if (!tableBody) return;
    
    // For demo purposes, we'll use a data attribute to simulate user ownership
    // In a real app, this would be determined from actual data from Supabase
    const rows = tableBody.querySelectorAll('tr');
    
    rows.forEach(row => {
        // Check if this row belongs to the current user
        // This is a simplified example - in real implementation,
        // you would check against actual user ID from your database
        const rowUserId = row.getAttribute('data-user-id');
        
        // If no user ID is set or it doesn't match current user (and user is not admin)
        if (!rowUserId || (rowUserId !== userId.toString())) {
            row.style.display = 'none';
        }
    });
}

// Update dashboard stats to show only user's data
function updateDashboardStatsForUser(userId) {
    // This is a placeholder - in a real app, you'd fetch only the user's data
    // and recalculate stats based on that
    
    // For demo purposes, we'll just reduce the numbers to simulate filtered data
    const statElements = {
        'total-loans': document.getElementById('total-loans'),
        'total-payments': document.getElementById('total-payments'),
        'pending-loans': document.getElementById('pending-loans'),
        'active-loans': document.getElementById('active-loans'),
        'overdue-loans': document.getElementById('overdue-loans'),
        'total-clients': document.getElementById('total-clients')
    };
    
    // Apply a simple reduction to simulate filtered data
    // In a real app, you would recalculate these values based on actual filtered data
    for (const [id, element] of Object.entries(statElements)) {
        if (element) {
            const currentValue = element.textContent;
            if (currentValue.includes('TZS')) {
                // For currency values, reduce by approximately 80%
                const numericValue = parseFloat(currentValue.replace(/[^0-9.]/g, ''));
                const newValue = Math.round(numericValue * 0.2); // Show only 20% for this user
                element.textContent = new Intl.NumberFormat().format(newValue) + ' TZS';
            } else {
                // For count values, reduce to 1-2 items
                const numericValue = parseInt(currentValue);
                element.textContent = Math.max(1, Math.floor(numericValue * 0.2));
            }
        }
    }
    
    // Update charts as well
    // This would be more complex in a real app
    if (window.Chart) {
        const charts = Chart.instances;
        for (let i = 0; i < charts.length; i++) {
            // Modify chart data to represent only user's data
            // This is simplified and would be replaced with actual filtered data
            const chart = charts[i];
            
            if (chart.config.type === 'doughnut') {
                // Reduce all values for doughnut chart
                for (let j = 0; j < chart.data.datasets[0].data.length; j++) {
                    chart.data.datasets[0].data[j] = Math.max(1, Math.floor(chart.data.datasets[0].data[j] * 0.2));
                }
            } else if (chart.config.type === 'line') {
                // Reduce all values for line chart
                for (let j = 0; j < chart.data.datasets[0].data.length; j++) {
                    chart.data.datasets[0].data[j] = Math.max(1000, Math.floor(chart.data.datasets[0].data[j] * 0.2));
                }
            }
            
            chart.update();
        }
    }
}

const supabaseUrl = 'https://xfihpvkbzppaejluyqoq.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhmaWhwdmtienBwYWVqbHV5cW9xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mjg1NDQzMzgsImV4cCI6MjA0NDEyMDMzOH0.U30_ovXdjGrovUZhBeVbeXtX-Xg29BPNZF9mhz7USfM';
const supabase = supabase.createClient(supabaseUrl, supabaseKey);

// DOM Elements
document.addEventListener('DOMContentLoaded', function() {
    // Check authentication first (already handled at the top)
    
    // Tab Navigation
    setupTabNavigation();
    
    // Form Validation
    setupFormValidation();
    
    // Modal Functionality
    setupModalFunctionality();
    
    // Load Sample Data - modified to include user ID
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
            // Get the current user ID from auth
            const authData = JSON.parse(sessionStorage.getItem('auth'));
            
            // Add user ID to form data
            const formData = new FormData(this);
            formData.append('created_by', authData.userId);
            
            saveLoanToSupabase(this, authData.userId);
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
            // Get the current user ID from auth
            const authData = JSON.parse(sessionStorage.getItem('auth'));
            
            saveClientToSupabase(this, authData.userId);
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
            // Get the current user ID from auth
            const authData = JSON.parse(sessionStorage.getItem('auth'));
            
            savePaymentToSupabase(this, authData.userId);
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
            // Get the current user ID from auth
            const authData = JSON.parse(sessionStorage.getItem('auth'));
            
            saveDisbursementToSupabase(this, authData.userId);
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

// Sample Data Loading with user IDs
function loadSampleData() {
    // Get current user ID
    const authData = JSON.parse(sessionStorage.getItem('auth'));
    const currentUserId = authData ? authData.userId : null;
    
    // Check if there's no user (should redirect to login, but just in case)
    if (!currentUserId) return;
    
    // Sample clients data - include user ID to identify who created them
    const sampleClients = [
        { id: 1, name: 'John Mbwana', idNumber: 'TZ19850502', phone: '+255 712 345 678', location: 'Mwenge, Dar es Salaam', business: 'Food Vendor', gender: 'Male', dob: '1985-05-02', group: 'Mwenge Market', created_by: 1 },
        { id: 2, name: 'Amina Hassan', idNumber: 'TZ19900715', phone: '+255 755 678 901', location: 'Kariakoo, Dar es Salaam', business: 'Clothing Shop', gender: 'Female', dob: '1990-07-15', group: 'Kariakoo Traders', created_by: 2 },
        { id: 3, name: 'Emmanuel Mtui', idNumber: 'TZ19780220', phone: '+255 786 123 456', location: 'Mbezi, Dar es Salaam', business: 'Farmer', gender: 'Male', dob: '1978-02-20', group: 'Mbezi Farmers', created_by: 1 },
        { id: 4, name: 'Fatma Juma', idNumber: 'TZ19880610', phone: '+255 744 234 567', location: 'Ilala, Dar es Salaam', business: 'Tailor', gender: 'Female', dob: '1988-06-10', group: 'Ilala Women', created_by: 2 },
        { id: 5, name: 'David Mwakyusa', idNumber: 'TZ19920425', phone: '+255 765 345 678', location: 'Temeke, Dar es Salaam', business: 'Carpenter', gender: 'Male', dob: '1992-04-25', group: '', created_by: 1 }
    ];

    // Sample loans data - include user ID to identify who created them
    const sampleLoans = [
        { id: 'L2023001', clientId: 1, clientName: 'John Mbwana', amount: 500000, disburseDate: '2023-02-15', status: 'Active', purpose: 'Business', created_by: 1 },
        { id: 'L2023002', clientId: 2, clientName: 'Amina Hassan', amount: 750000, disburseDate: '2023-03-10', status: 'Active', purpose: 'Business', created_by: 2 },
        { id: 'L2023003', clientId: 3, clientName: 'Emmanuel Mtui', amount: 1000000, disburseDate: '2023-01-20', status: 'Overdue', purpose: 'Agriculture', created_by: 1 },
        { id: 'L2023004', clientId: 4, clientName: 'Fatma Juma', amount: 300000, disburseDate: '2023-04-05', status: 'Fully Paid', purpose: 'Home Improvement', created_by: 2 },
        { id: 'L2023005', clientId: 5, clientName: 'David Mwakyusa', amount: 850000, disburseDate: '2023-05-12', status: 'Pending', purpose: 'Business', created_by: 1 }
    ];

    // Sample disbursements - include user ID to identify who created them
    const sampleDisbursements = [
        { loanId: 'L2023001', clientName: 'John Mbwana', amount: 500000, status: 'Disbursed', created_by: 1 },
        { loanId: 'L2023002', clientName: 'Amina Hassan', amount: 750000, status: 'Disbursed', created_by: 2 },
        { loanId: 'L2023003', clientName: 'Emmanuel Mtui', amount: 1000000, status: 'Disbursed', created_by: 1 },
        { loanId: 'L2023004', clientName: 'Fatma Juma', amount: 300000, status: 'Disbursed', created_by: 2 },
        { loanId: 'L2023005', clientName: 'David Mwakyusa', amount: 850000, status: 'Pending', created_by: 1 }
    ];

    // Sample payments - include user ID to identify who created them
    const samplePayments = [
        { id: 'P2023001', loanId: 'L2023001', clientName: 'John Mbwana', amount: 150000, date: '2023-03-15', method: 'Mobile Money', created_by: 1 },
        { id: 'P2023002', loanId: 'L2023002', clientName: 'Amina Hassan', amount: 200000, date: '2023-04-10', method: 'Cash', created_by: 2 },
        { id: 'P2023003', loanId: 'L2023001', clientName: 'John Mbwana', amount: 150000, date: '2023-04-15', method: 'Mobile Money', created_by: 1 },
        { id: 'P2023004', loanId: 'L2023003', clientName: 'Emmanuel Mtui', amount: 250000, date: '2023-02-20', method: 'Bank Transfer', created_by: 1 },
        { id: 'P2023005', loanId: 'L2023004', clientName: 'Fatma Juma', amount: 300000, date: '2023-05-05', method: 'Mobile Money', created_by: 2 }
    ];

    // Populate client select
    const clientSelect = document.getElementById('client-select');
    if (clientSelect) {
        // Clear existing options
        clientSelect.innerHTML = '<option value="">Select Client</option>';
        
        // Filter clients for non-admin users
        let clientsToShow = sampleClients;
        if (authData.role !== 'admin') {
            clientsToShow = sampleClients.filter(client => client.created_by === currentUserId);
        }
        
        clientsToShow.forEach(client => {
            const option = document.createElement('option');
            option.value = client.id;
            option.textContent = client.name;
            clientSelect.appendChild(option);
        });
    }

    // Populate loans table
    const loansTableBody = document.getElementById('loans-table-body');
    if (loansTableBody) {
        // Clear existing rows
        loansTableBody.innerHTML = '';
        
        // Filter loans for non-admin users
        let loansToShow = sampleLoans;
        if (authData.role !== 'admin') {
            loansToShow = sampleLoans.filter(loan => loan.created_by === currentUserId);
        }
        
        loansToShow.forEach(loan => {
            const row = document.createElement('tr');
            row.setAttribute('data-user-id', loan.created_by);
            
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
        // Clear existing rows
        disbursementTableBody.innerHTML = '';
        
        // Filter disbursements for non-admin users
        let disbursementsToShow = sampleDisbursements;
        if (authData.role !== 'admin') {
            disbursementsToShow = sampleDisbursements.filter(d => d.created_by === currentUserId);
        }
        
        disbursementsToShow.forEach(disbursement => {
            const row = document.createElement('tr');
            row.setAttribute('data-user-id', disbursement.created_by);
            
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
        
        // Clear existing rows
        paymentHistoryBody.innerHTML = '';
        
        // Filter payments for non-admin users
        let paymentsToShow = samplePayments;
        if (authData.role !== 'admin') {
            paymentsToShow = samplePayments.filter(payment => payment.created_by === currentUserId);
        }
        
        paymentsToShow.forEach(payment => {
            const row = document.createElement('tr');
            row.setAttribute('data-user-id', payment.created_by);
            
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
        // Clear existing rows
        clientsTableBody.innerHTML = '';
        
        // Filter clients for non-admin users
        let clientsToShow = sampleClients;
        if (authData.role !== 'admin') {
            clientsToShow = sampleClients.filter(client => client.created_by === currentUserId);
        }
        
        clientsToShow.forEach(client => {
            const row = document.createElement('tr');
            row.setAttribute('data-user-id', client.created_by);
            
            row.innerHTML = `
                <td>${client.name}</td>
                <td>${client.idNumber}</td>
                <td>${client.phone}</td>
                <td>${client.location}</td>
                <td>${client.business || 'N/A'}</td>
                <td>
                    <button class="action-btn action-btn-view">View</button>
                    <button class="action-btn action-btn-edit">Edit</button>
                </td>
            `;
            
            clientsTableBody.appendChild(row);
        });
    }
}

// Set default dates to today
function setDefaultDates() {
    const dateInputs = document.querySelectorAll('input[type="date"]');
    const today = new Date().toISOString().split('T')[0];
    
    dateInputs.forEach(input => {
        input.value = today;
    });
}

// Phone number validation
function validatePhone(phone) {
    // Basic validation for Tanzania phone numbers
    const phoneRegex = /^\+?255\s?\d{3}\s?\d{3}\s?\d{3}$/;
    return phoneRegex.test(phone);
}

// Show alert message
function showAlert(message, type = 'info') {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type}`;
    alertDiv.innerText = message;
    
    // Append to alert container
    const alertContainer = document.getElementById('alert-container');
    if (alertContainer) {
        alertContainer.appendChild(alertDiv);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            alertDiv.remove();
        }, 5000);
    }
}

// Open modal
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'flex';
    }
}

// Close modal
function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
    }
}

// Save loan to Supabase
async function saveLoanToSupabase(form, userId) {
    // In a real app, this would save to Supabase
    // For this demo, we'll just log the data
    const formData = new FormData(form);
    const loanData = {
        client_id: formData.get('client-select'),
        client_name: form.querySelector('#client-select option:checked').textContent,
        amount: formData.get('loan-amount'),
        term: formData.get('loan-term'),
        interest_rate: formData.get('interest-rate'),
        purpose: formData.get('loan-purpose'),
        disburse_date: formData.get('disburse-date'),
        created_by: userId
    };
    
    console.log('Saving loan to Supabase:', loanData);
    
    // In production, this would be:
    // const { data, error } = await supabase
    //     .from('loans')
    //     .insert([loanData]);
    
    // Add to the table for demo purposes
    addLoanToTable(loanData);
}

// Add loan to table (for demo)
function addLoanToTable(loanData) {
    const loansTableBody = document.getElementById('loans-table-body');
    if (!loansTableBody) return;
    
    const row = document.createElement('tr');
    row.setAttribute('data-user-id', loanData.created_by);
    
    // Generate a loan ID
    const loanId = 'L' + new Date().getFullYear() + Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    
    // Format currency
    const formattedAmount = new Intl.NumberFormat().format(loanData.amount);
    
    row.innerHTML = `
        <td>${loanId}</td>
        <td>${loanData.client_name}</td>
        <td>${formattedAmount}</td>
        <td>${loanData.disburse_date}</td>
        <td><span class="badge badge-warning">Pending</span></td>
        <td>
            <button class="action-btn action-btn-view">View</button>
            <button class="action-btn action-btn-edit">Edit</button>
        </td>
    `;
    
    loansTableBody.prepend(row);
    
    // Also add to disbursements
    addDisbursementToTable({
        loanId: loanId,
        clientName: loanData.client_name,
        amount: loanData.amount,
        status: 'Pending',
        created_by: loanData.created_by
    });
    
    // Update dashboard stats
    updateDashboardStats('loans', 1);
}

// Save client to Supabase
async function saveClientToSupabase(form, userId) {
    // In a real app, this would save to Supabase
    // For this demo, we'll just log the data
    const formData = new FormData(form);
    const clientData = {
        name: formData.get('client-name'),
        id_number: formData.get('client-id-number'),
        phone: formData.get('client-phone'),
        gender: formData.get('client-gender'),
        dob: formData.get('client-dob'),
        location: formData.get('client-location'),
        business: formData.get('client-business'),
        group: formData.get('client-group'),
        created_by: userId
    };
    
    console.log('Saving client to Supabase:', clientData);
    
    // In production, this would be:
    // const { data, error } = await supabase
    //     .from('clients')
    //     .insert([clientData]);
    
    // Add to the table for demo purposes
    addClientToTable(clientData);
    
    // Also add to client select dropdown
    addClientToDropdown(clientData);
}

// Add client to table (for demo)
function addClientToTable(clientData) {
    const clientsTableBody = document.getElementById('clients-table-body');
    if (!clientsTableBody) return;
    
    const row = document.createElement('tr');
    row.setAttribute('data-user-id', clientData.created_by);
    
    row.innerHTML = `
        <td>${clientData.name}</td>
        <td>${clientData.id_number}</td>
        <td>${clientData.phone}</td>
        <td>${clientData.location}</td>
        <td>${clientData.business || 'N/A'}</td>
        <td>
            <button class="action-btn action-btn-view">View</button>
            <button class="action-btn action-btn-edit">Edit</button>
        </td>
    `;
    
    clientsTableBody.prepend(row);
    
    // Update dashboard stats
    updateDashboardStats('clients', 1);
}

// Add client to dropdown (for demo)
function addClientToDropdown(clientData) {
    const clientSelect = document.getElementById('client-select');
    if (!clientSelect) return;
    
    const option = document.createElement('option');
    option.value = new Date().getTime(); // Use timestamp as temp ID
    option.textContent = clientData.name;
    clientSelect.appendChild(option);
}

// Save payment to Supabase
async function savePaymentToSupabase(form, userId) {
    // In a real app, this would save to Supabase
    // For this demo, we'll just log the data
    const formData = new FormData(form);
    const paymentData = {
        loan_id: formData.get('payment-loan-id'),
        client_name: formData.get('payment-client-name'),
        amount: formData.get('payment-amount'),
        payment_date: formData.get('payment-date'),
        payment_method: formData.get('payment-method'),
        created_by: userId
    };
    
    console.log('Saving payment to Supabase:', paymentData);
    
    // In production, this would be:
    // const { data, error } = await supabase
    //     .from('payments')
    //     .insert([paymentData]);
    
    // Add to the table for demo purposes
    addPaymentToTable(paymentData);
}

// Add payment to table (for demo)
function addPaymentToTable(paymentData) {
    const paymentHistoryTable = document.getElementById('payment-history-table');
    if (!paymentHistoryTable) return;
    
    const paymentHistoryBody = paymentHistoryTable.querySelector('tbody') || paymentHistoryTable;
    
    const row = document.createElement('tr');
    row.setAttribute('data-user-id', paymentData.created_by);
    
    // Generate a payment ID
    const paymentId = 'P' + new Date().getFullYear() + Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    
    // Format currency
    const formattedAmount = new Intl.NumberFormat().format(paymentData.amount);
    
    row.innerHTML = `
        <td>${paymentId}</td>
        <td>${paymentData.loan_id}</td>
        <td>${paymentData.client_name}</td>
        <td>${formattedAmount}</td>
        <td>${paymentData.payment_date}</td>
        <td>${paymentData.payment_method}</td>
        <td>
            <button class="action-btn action-btn-view">View</button>
        </td>
    `;
    
    paymentHistoryBody.prepend(row);
    
    // Update dashboard stats
    updateDashboardStats('payments', parseInt(paymentData.amount));
}

// Save disbursement to Supabase
async function saveDisbursementToSupabase(form, userId) {
    // In a real app, this would save to Supabase
    // For this demo, we'll just log the data
    const formData = new FormData(form);
    const disbursementData = {
        loan_id: formData.get('disburse-loan-id'),
        client_name: formData.get('disburse-client'),
        amount: formData.get('disburse-amount'),
        disbursement_date: formData.get('disburse-date'),
        disbursement_method: formData.get('disburse-method'),
        reference: formData.get('disburse-reference'),
        created_by: userId
    };
    
    console.log('Saving disbursement to Supabase:', disbursementData);
    
    // In production, this would be:
    // const { data, error } = await supabase
    //     .from('disbursements')
    //     .insert([disbursementData]);
    
    // Update the table for demo purposes
    updateDisbursementStatus(disbursementData.loan_id);
    
    // Also update the loan status
    updateLoanStatus(disbursementData.loan_id, 'Active');
}

// Update disbursement status (for demo)
function updateDisbursementStatus(loanId) {
    const disbursementTableBody = document.getElementById('disbursement-table-body');
    if (!disbursementTableBody) return;
    
    const rows = disbursementTableBody.querySelectorAll('tr');
    rows.forEach(row => {
        const rowLoanId = row.querySelector('td:first-child').textContent;
        if (rowLoanId === loanId) {
            // Update status badge
            const statusCell = row.querySelector('td:nth-child(4)');
            statusCell.innerHTML = '<span class="badge badge-success">Disbursed</span>';
            
            // Update action button
            const actionCell = row.querySelector('td:last-child');
            actionCell.innerHTML = '<button class="action-btn action-btn-view">View</button>';
        }
    });
}

// Add disbursement to table (for demo)
function addDisbursementToTable(disbursementData) {
    const disbursementTableBody = document.getElementById('disbursement-table-body');
    if (!disbursementTableBody) return;
    
    const row = document.createElement('tr');
    row.setAttribute('data-user-id', disbursementData.created_by);
    
    // Format currency
    const formattedAmount = new Intl.NumberFormat().format(disbursementData.amount);
    
    row.innerHTML = `
        <td>${disbursementData.loanId}</td>
        <td>${disbursementData.clientName}</td>
        <td>${formattedAmount}</td>
        <td><span class="badge badge-warning">${disbursementData.status}</span></td>
        <td>
            <button class="action-btn action-btn-edit disburse-btn" 
                data-loan-id="${disbursementData.loanId}" 
                data-client="${disbursementData.clientName}" 
                data-amount="${disbursementData.amount}">Disburse</button>
        </td>
    `;
    
    disbursementTableBody.prepend(row);
    
    // Add click event for the new disburse button
    const disburseBtn = row.querySelector('.disburse-btn');
    disburseBtn.addEventListener('click', function() {
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
}

// Update loan status (for demo)
function updateLoanStatus(loanId, status) {
    const loansTableBody = document.getElementById('loans-table-body');
    if (!loansTableBody) return;
    
    const rows = loansTableBody.querySelectorAll('tr');
    rows.forEach(row => {
        const rowLoanId = row.querySelector('td:first-child').textContent;
        if (rowLoanId === loanId) {
            // Update status badge
            const statusCell = row.querySelector('td:nth-child(5)');
            let badgeClass = '';
            
            switch(status) {
                case 'Active':
                    badgeClass = 'badge-success';
                    break;
                case 'Overdue':
                    badgeClass = 'badge-danger';
                    break;
                case 'Fully Paid':
                    badgeClass = 'badge-info';
                    break;
                default:
                    badgeClass = 'badge-warning';
            }
            
            statusCell.innerHTML = `<span class="badge ${badgeClass}">${status}</span>`;
        }
    });
    
    // Update dashboard stats
    if (status === 'Active') {
        updateDashboardStats('active_loans', 1);
    }
}

// Update dashboard stats (for demo)
function updateDashboardStats(stat, increment) {
    let elementId;
    
    switch(stat) {
        case 'loans':
            elementId = 'total-loans';
            break;
        case 'clients':
            elementId = 'total-clients';
            break;
        case 'payments':
            elementId = 'total-payments';
            break;
        case 'active_loans':
            elementId = 'active-loans';
            break;
        default:
            return;
    }
    
    const element = document.getElementById(elementId);
    if (!element) return;
    
    let currentValue;
    
    if (stat === 'payments') {
        // For payments, we're incrementing the TZS amount
        currentValue = element.textContent.replace(/[^0-9]/g, '');
        const newValue = parseInt(currentValue) + increment;
        element.textContent = new Intl.NumberFormat().format(newValue) + ' TZS';
    } else {
        // For other stats, we're incrementing the count
        currentValue = parseInt(element.textContent);
        element.textContent = currentValue + 1;
    }
}