// Initialize Supabase Client
const supabaseUrl = 'https://xfihpvkbzppaejluyqoq.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhmaWhwdmtienBwYWVqbHV5cW9xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mjg1NDQzMzgsImV4cCI6MjA0NDEyMDMzOH0.U30_ovXdjGrovUZhBeVbeXtX-Xg29BPNZF9mhz7USfM';

// Add the supabase global variable if it doesn't exist
if (typeof supabase === 'undefined') {
    console.error('Supabase client not found! Make sure you loaded the Supabase JS library.');
    // Add a script tag dynamically to load Supabase
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
    script.onload = function() {
        // Create client after script loads
        window.supabase = supabase.createClient(supabaseUrl, supabaseKey);
        init(); // Initialize after loading
    };
    document.head.appendChild(script);
} else {
    window.supabase = supabase.createClient(supabaseUrl, supabaseKey);
    init(); // Initialize directly
}

// Main initialization function
function init() {
    const loginForm = document.getElementById('login-form');
    const alertContainer = document.getElementById('alert-container');

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

    // Add an admin setup button for first-time setup
    const setupButton = document.createElement('button');
    setupButton.type = 'button';
    setupButton.className = 'btn btn-link';
    setupButton.textContent = 'First Time Setup? Create Admin Account';
    setupButton.style.marginTop = '10px';
    
    if (loginForm) {
        // Add the setup button after the login form
        const loginFooter = document.querySelector('.login-footer');
        if (loginFooter) {
            loginFooter.insertBefore(setupButton, loginFooter.firstChild);
        } else {
            loginForm.parentNode.appendChild(setupButton);
        }

        // Setup button click handler
        setupButton.addEventListener('click', function() {
            showAdminSetupForm();
        });
        
        // Login form submission
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

    // Create and show admin setup form
    function showAdminSetupForm() {
        if (!loginForm) return;
        
        // Hide login form temporarily
        loginForm.style.display = 'none';
        if (setupButton) setupButton.style.display = 'none';
        
        // Create admin setup form
        const adminSetupForm = document.createElement('form');
        adminSetupForm.id = 'admin-setup-form';
        adminSetupForm.innerHTML = `
            <div class="alert alert-info">
                <p>Set up your administrator account to get started with Pamoja Microfinance.</p>
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
            <button type="button" id="back-to-login" class="btn btn-link btn-block">Back to Login</button>
        `;
        
        // Insert admin setup form
        loginForm.parentNode.insertBefore(adminSetupForm, loginForm);
        
        // Back to login button handler
        document.getElementById('back-to-login').addEventListener('click', () => {
            adminSetupForm.remove();
            loginForm.style.display = 'block';
            if (setupButton) setupButton.style.display = 'block';
        });
        
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
                
                // Check if user already exists in user_profiles
                const { data: existingUser, error: checkError } = await supabase
                    .from('user_profiles')
                    .select('user_id')
                    .eq('username', username)
                    .single();

                if (existingUser) {
                    showAlert('Username already exists', 'danger');
                    submitBtn.textContent = originalBtnText;
                    submitBtn.disabled = false;
                    return;
                }
                
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
                    if (setupButton) setupButton.style.display = 'block';
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
}