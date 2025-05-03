// Initialize Supabase Client
const supabaseUrl = 'https://xfihpvkbzppaejluyqoq.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhmaWhwdmtienBwYWVqbHV5cW9xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mjg1NDQzMzgsImV4cCI6MjA0NDEyMDMzOH0.U30_ovXdjGrovUZhBeVbeXtX-Xg29BPNZF9mhz7USfM';
const supabase = supabase.createClient(supabaseUrl, supabaseKey);

// DOM Elements
const loginForm = document.getElementById('login-form');
const alertContainer = document.getElementById('alert-container');

// Check if admin exists and create one if not
async function checkAndCreateAdmin() {
    try {
        // Check if we're on the login page
        if (!loginForm) return;
        
        // Add a loading indicator
        const loadingDiv = document.createElement('div');
        loadingDiv.className = 'text-center';
        loadingDiv.innerHTML = '<p>Checking system setup...</p>';
        loginForm.parentNode.insertBefore(loadingDiv, loginForm);
        
        // Check if any user exists in the system
        const { data: profiles, error: fetchError } = await supabase
            .from('user_profiles')
            .select('user_id')
            .limit(1);
        
        if (fetchError) {
            console.error('Error checking user profiles:', fetchError);
            loadingDiv.remove();
            return;
        }
        
        // If no users exist, show admin setup form
        if (!profiles || profiles.length === 0) {
            loadingDiv.remove();
            showAdminSetupForm();
        } else {
            loadingDiv.remove();
        }
    } catch (err) {
        console.error('Admin check error:', err);
        if (document.querySelector('.text-center')) {
            document.querySelector('.text-center').remove();
        }
    }
}

// Create and show admin setup form
function showAdminSetupForm() {
    // Hide login form temporarily
    loginForm.style.display = 'none';
    
    // Create admin setup form
    const adminSetupForm = document.createElement('form');
    adminSetupForm.id = 'admin-setup-form';
    adminSetupForm.innerHTML = `
        <div class="alert alert-info">
            <p>Welcome to Pamoja Microfinance! No users found. Set up your administrator account to get started.</p>
        </div>
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
    `;
    
    // Insert admin setup form
    loginForm.parentNode.insertBefore(adminSetupForm, loginForm);
    
    // Admin setup form submit handler
    adminSetupForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const fullname = document.getElementById('admin-fullname').value.trim();
        const email = document.getElementById('admin-email').value.trim();
        const username = document.getElementById('admin-username').value.trim();
        const branch = document.getElementById('admin-branch').value.trim();
        const password = document.getElementById('admin-password').value;
        const confirmPassword = document.getElementById('admin-confirm-password').value;
        
        // Validate inputs
        if (!fullname || !email || !username || !branch || !password) {
            showAlert('All fields are required', 'danger');
            return;
        }
        
        if (password !== confirmPassword) {
            showAlert('Passwords do not match', 'danger');
            return;
        }
        
        if (password.length < 8) {
            showAlert('Password must be at least 8 characters long', 'danger');
            return;
        }
        
        try {
            // Show loading state
            const submitBtn = adminSetupForm.querySelector('button[type="submit"]');
            const originalBtnText = submitBtn.textContent;
            submitBtn.textContent = 'Creating account...';
            submitBtn.disabled = true;
            
            // Create the admin user
            const { data: userData, error: authError } = await supabase.auth.signUp({
                email,
                password
            });
            
            if (authError) throw authError;
            
            if (!userData.user) {
                showAlert('Failed to create user account', 'danger');
                submitBtn.textContent = originalBtnText;
                submitBtn.disabled = false;
                return;
            }
            
            // Add user details to user_profiles table
            const { error: profileError } = await supabase
                .from('user_profiles')
                .insert([{
                    user_id: userData.user.id,
                    username: username,
                    full_name: fullname,
                    role: 'admin',
                    branch: branch
                }]);
            
            if (profileError) throw profileError;
            
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
            });
            
        } catch (err) {
            console.error('Admin setup error:', err);
            showAlert(err.message || 'Error creating admin account', 'danger');
            const submitBtn = adminSetupForm.querySelector('button[type="submit"]');
            if (submitBtn) {
                submitBtn.textContent = 'Create Admin Account';
                submitBtn.disabled = false;
            }
        }
    });
}

// Login form submission
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value;
        
        if (!email || !password) {
            showAlert('Email and password are required', 'danger');
            return;
        }
        
        try {
            // Authenticate with Supabase
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password
            });
            
            if (error) throw error;
            
            // Get user role from profiles table
            const { data: profile, error: profileError } = await supabase
                .from('user_profiles')
                .select('role, branch')
                .eq('user_id', data.user.id)
                .single();
                
            if (profileError) throw profileError;
            
            // Store user session
            sessionStorage.setItem('auth', JSON.stringify({
                user: data.user,
                role: profile.role,
                branch: profile.branch
            }));
            
            // Redirect based on role
            if (profile.role === 'admin') {
                window.location.href = 'index.html';
            } else {
                window.location.href = 'clients.html';
            }
            
        } catch (error) {
            showAlert('Login failed: ' + error.message, 'danger');
        }
    });
}

// Show alert function
function showAlert(message, type) {
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
}

// Initialize admin check when page loads
document.addEventListener('DOMContentLoaded', checkAndCreateAdmin);