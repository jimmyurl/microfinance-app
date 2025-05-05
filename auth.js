// Initialize Supabase Client
const supabaseUrl = 'https://xfihpvkbzppaejluyqoq.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhmaWhwdmtienBwYWVqbHV5cW9xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mjg1NDQzMzgsImV4cCI6MjA0NDEyMDMzOH0.U30_ovXdjGrovUZhBeVbeXtX-Xg29BPNZF9mhz7USfM';

// Global variables
let supabaseClient = null;

// Add console logging for debugging
function logDebug(message, data) {
    console.log(`[ASSE Debug] ${message}`, data || '');
}

// Load Supabase Client
function loadSupabase() {
    return new Promise((resolve, reject) => {
        try {
            // Check if supabase is already loaded
            if (typeof supabase !== 'undefined') {
                supabaseClient = supabase.createClient(supabaseUrl, supabaseKey);
                logDebug('Supabase client initialized directly');
                resolve(supabaseClient);
                return;
            }
            
            // Load Supabase via script tag
            logDebug('Loading Supabase JS library...');
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
            
            script.onload = function() {
                try {
                    logDebug('Supabase JS library loaded successfully');
                    supabaseClient = supabase.createClient(supabaseUrl, supabaseKey);
                    logDebug('Supabase client initialized after script load');
                    resolve(supabaseClient);
                } catch (error) {
                    logDebug('Error creating Supabase client after script load', error);
                    reject(error);
                }
            };
            
            script.onerror = function(error) {
                logDebug('Failed to load Supabase JS library', error);
                reject(new Error('Failed to load Supabase JS library'));
            };
            
            document.head.appendChild(script);
        } catch (error) {
            logDebug('Error in loadSupabase function', error);
            reject(error);
        }
    });
}

// Show alert function
function showAlert(message, type, container) {
    const alertContainer = container || document.getElementById('alert-container');
    if (!alertContainer) {
        logDebug('Alert container not found!');
        alert(message); // Fallback to browser alert
        return;
    }
    
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type}`;
    alertDiv.textContent = message;
    
    alertContainer.innerHTML = '';
    alertContainer.appendChild(alertDiv);
    
    // Auto-dismiss after 5 seconds
    setTimeout(() => {
        if (alertContainer.contains(alertDiv)) {
            alertDiv.remove();
        }
    }, 5000);
    
    logDebug(`Alert shown: ${message} (${type})`);
}

// Check if user_profiles table exists and create it if it doesn't
async function ensureUserProfilesTable() {
    try {
        logDebug('Checking if user_profiles table exists...');
        
        // Try to select from user_profiles table
        const { data, error } = await supabaseClient
            .from('user_profiles')
            .select('user_id')
            .limit(1);
        
        if (error) {
            logDebug('Error checking user_profiles table', error);
            
            // If table doesn't exist, create it
            if (error.code === '42P01') { // PostgreSQL code for undefined_table
                logDebug('Creating user_profiles table...');
                
                // This is a simplified approach - in production, you'd use migrations
                const createTableResult = await supabaseClient.rpc('create_user_profiles_table', {});
                
                if (createTableResult.error) {
                    throw new Error(`Failed to create user_profiles table: ${createTableResult.error.message}`);
                }
                
                logDebug('user_profiles table created successfully');
            } else {
                throw error;
            }
        } else {
            logDebug('user_profiles table exists');
        }
        
        return true;
    } catch (error) {
        logDebug('Error ensuring user_profiles table', error);
        return false;
    }
}

// Main initialization function
async function init() {
    try {
        logDebug('Initializing application...');
        
        // Try to load Supabase client
        await loadSupabase();
        
        const loginForm = document.getElementById('login-form');
        const alertContainer = document.getElementById('alert-container');
        
        if (!loginForm) {
            logDebug('Login form not found!');
            return;
        }
        
        if (!alertContainer) {
            logDebug('Alert container not found!');
        }
        
        // Ensure the user_profiles table exists
        const tableCreated = await ensureUserProfilesTable();
        if (!tableCreated) {
            showAlert('Failed to initialize database tables. Please contact support.', 'danger', alertContainer);
        }
        
        // Add an admin setup button for first-time setup
        const setupButton = document.createElement('button');
        setupButton.type = 'button';
        setupButton.className = 'btn btn-link';
        setupButton.textContent = 'First Time Setup? Create Admin Account';
        setupButton.style.marginTop = '10px';
        setupButton.id = 'admin-setup-button';
        
        // Add the setup button after the login form
        const loginFooter = document.querySelector('.login-footer');
        if (loginFooter) {
            loginFooter.insertBefore(setupButton, loginFooter.firstChild);
        } else {
            loginForm.parentNode.appendChild(setupButton);
        }
        
        // Setup button click handler
        setupButton.addEventListener('click', function() {
            logDebug('Admin setup button clicked');
            showAdminSetupForm();
        });
        
        // Login form submission
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            logDebug('Login form submitted');
            
            const email = document.getElementById('username').value.trim();
            const password = document.getElementById('password').value;
            
            if (!email || !password) {
                showAlert('Email and password are required', 'danger', alertContainer);
                return;
            }
            
            try {
                // Show loading state
                const submitBtn = loginForm.querySelector('button[type="submit"]');
                const originalBtnText = submitBtn.textContent;
                submitBtn.textContent = 'Logging in...';
                submitBtn.disabled = true;
                
                // Authenticate with Supabase
                logDebug('Attempting to sign in with email:', email);
                const { data, error } = await supabaseClient.auth.signInWithPassword({
                    email,
                    password
                });
                
                if (error) {
                    logDebug('Sign in error:', error);
                    throw error;
                }
                
                logDebug('Sign in successful. Getting user profile...');
                
                // Get user role from profiles table
                const { data: profile, error: profileError } = await supabaseClient
                    .from('user_profiles')
                    .select('role, branch')
                    .eq('user_id', data.user.id)
                    .single();
                
                if (profileError) {
                    logDebug('Error fetching user profile:', profileError);
                    throw profileError;
                }
                
                logDebug('User profile retrieved:', profile);
                
                // Store user session
                sessionStorage.setItem('auth', JSON.stringify({
                    user: data.user,
                    role: profile.role,
                    branch: profile.branch
                }));
                
                logDebug('Auth data stored in session. Redirecting based on role:', profile.role);
                
                // Redirect based on role
                if (profile.role === 'admin') {
                    window.location.href = 'index.html';
                } else {
                    window.location.href = 'clients.html';
                }
                
            } catch (error) {
                logDebug('Login error:', error);
                showAlert('Login failed: ' + (error.message || 'Unknown error'), 'danger', alertContainer);
                
                // Reset button state
                const submitBtn = loginForm.querySelector('button[type="submit"]');
                if (submitBtn) {
                    submitBtn.textContent = originalBtnText || 'Login';
                    submitBtn.disabled = false;
                }
            }
        });
    } catch (error) {
        logDebug('Error in init function:', error);
        const alertContainer = document.getElementById('alert-container');
        showAlert('Failed to initialize the application: ' + (error.message || 'Unknown error'), 'danger', alertContainer);
    }
}

// Create and show admin setup form
function showAdminSetupForm() {
    const loginForm = document.getElementById('login-form');
    const setupButton = document.getElementById('admin-setup-button');
    
    if (!loginForm) {
        logDebug('Login form not found in showAdminSetupForm');
        return;
    }
    
    // Hide login form temporarily
    loginForm.style.display = 'none';
    if (setupButton) setupButton.style.display = 'none';
    
    // Create admin setup form
    const adminSetupForm = document.createElement('form');
    adminSetupForm.id = 'admin-setup-form';
    adminSetupForm.className = 'card-body';
    adminSetupForm.innerHTML = `
        <div class="alert alert-info">
            <p>Set up your administrator account to get started with ASSE Microfinance.</p>
        </div>
        <div id="admin-setup-alert-container"></div>
        <div class="form-group">
            <label for="admin-fullname">Full Name</label>
            <input type="text" id="admin-fullname" class="form-control" required>
        </div>
        <div class="form-group">
            <label for="admin-email">Email</label>
            <input type="email" id="admin-email" class="form-control" required>
        </div>
        <div class="form-group">
            <label for="admin-username">Username</label>
            <input type="text" id="admin-username" class="form-control" required>
        </div>
        <div class="form-group">
            <label for="admin-branch">Branch</label>
            <input type="text" id="admin-branch" class="form-control" required placeholder="e.g. Headquarters">
        </div>
        <div class="form-group">
            <label for="admin-password">Password</label>
            <input type="password" id="admin-password" class="form-control" required>
        </div>
        <div class="form-group">
            <label for="admin-confirm-password">Confirm Password</label>
            <input type="password" id="admin-confirm-password" class="form-control" required>
        </div>
        <button type="submit" class="btn btn-primary btn-block">Create Admin Account</button>
        <button type="button" id="back-to-login" class="btn btn-link btn-block">Back to Login</button>
    `;
    
    // Insert admin setup form
    loginForm.parentNode.insertBefore(adminSetupForm, loginForm);
    
    // Back to login button handler
    document.getElementById('back-to-login').addEventListener('click', () => {
        logDebug('Back to login clicked');
        adminSetupForm.remove();
        loginForm.style.display = 'block';
        if (setupButton) setupButton.style.display = 'block';
    });
    
    // Admin setup form submit handler
    adminSetupForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        logDebug('Admin setup form submitted');
        
        const fullname = document.getElementById('admin-fullname').value.trim();
        const email = document.getElementById('admin-email').value.trim();
        const username = document.getElementById('admin-username').value.trim();
        const branch = document.getElementById('admin-branch').value.trim();
        const password = document.getElementById('admin-password').value;
        const confirmPassword = document.getElementById('admin-confirm-password').value;
        
        const alertContainer = document.getElementById('admin-setup-alert-container');
        
        // Validate inputs
        if (!fullname || !email || !username || !branch || !password) {
            showAlert('All fields are required', 'danger', alertContainer);
            return;
        }
        
        if (password !== confirmPassword) {
            showAlert('Passwords do not match', 'danger', alertContainer);
            return;
        }
        
        if (password.length < 8) {
            showAlert('Password must be at least 8 characters long', 'danger', alertContainer);
            return;
        }
        
        try {
            // Show loading state
            const submitBtn = adminSetupForm.querySelector('button[type="submit"]');
            const originalBtnText = submitBtn.textContent;
            submitBtn.textContent = 'Creating account...';
            submitBtn.disabled = true;
            
            logDebug('Checking if username already exists:', username);
            
            // Check if user already exists in user_profiles
            const { data: existingUser, error: checkError } = await supabaseClient
                .from('user_profiles')
                .select('user_id')
                .eq('username', username);

            if (checkError) {
                logDebug('Error checking existing username:', checkError);
                // If the error is because the table doesn't exist, proceed anyway
                if (checkError.code !== '42P01') { // PostgreSQL code for undefined_table
                    throw checkError;
                }
            } else if (existingUser && existingUser.length > 0) {
                logDebug('Username already exists');
                showAlert('Username already exists', 'danger', alertContainer);
                submitBtn.textContent = originalBtnText;
                submitBtn.disabled = false;
                return;
            }
            
            logDebug('Creating admin user with email:', email);
            
            // Create the admin user
            const { data: userData, error: authError } = await supabaseClient.auth.signUp({
                email,
                password
            });
            
            if (authError) {
                logDebug('Auth error creating user:', authError);
                throw authError;
            }
            
            if (!userData || !userData.user) {
                logDebug('Failed to create user - no user data returned');
                showAlert('Failed to create user account', 'danger', alertContainer);
                submitBtn.textContent = originalBtnText;
                submitBtn.disabled = false;
                return;
            }
            
            logDebug('User created successfully, adding to user_profiles:', userData.user.id);
            
            // Add user details to user_profiles table
            const { error: profileError } = await supabaseClient
                .from('user_profiles')
                .insert([{
                    user_id: userData.user.id,
                    username: username,
                    full_name: fullname,
                    role: 'admin',
                    branch: branch,
                    created_at: new Date().toISOString()
                }]);
            
            if (profileError) {
                logDebug('Error adding user profile:', profileError);
                throw profileError;
            }
            
            logDebug('Admin user created successfully');
            
            // Show success message
            adminSetupForm.innerHTML = `
                <div class="alert alert-success">
                    <p>Admin account created successfully!</p>
                    <p>You can now log in with your email and password.</p>
                </div>
                <button type="button" id="go-to-login" class="btn btn-primary btn-block">Go to Login</button>
            `;
            
            document.getElementById('go-to-login').addEventListener('click', () => {
                adminSetupForm.remove();
                loginForm.style.display = 'block';
                if (setupButton) setupButton.style.display = 'block';
            });
            
        } catch (err) {
            logDebug('Admin setup error:', err);
            showAlert(err.message || 'Error creating admin account', 'danger', alertContainer);
            const submitBtn = adminSetupForm.querySelector('button[type="submit"]');
            if (submitBtn) {
                submitBtn.textContent = 'Create Admin Account';
                submitBtn.disabled = false;
            }
        }
    });
}

// Start the initialization process
document.addEventListener('DOMContentLoaded', init);