// Initialize Supabase Client
const supabaseUrl = 'YOUR_SUPABASE_URL';
const supabaseKey = 'YOUR_SUPABASE_ANON_KEY';
const supabase = supabase.createClient(supabaseUrl, supabaseKey);

// Login form submission
document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    
    try {
        // Authenticate with Supabase
        const { data, error } = await supabase.auth.signInWithPassword({
            email: username,
            password: password
        });
        
        if (error) throw error;
        
        // Get user role from profiles table
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('role')
            .eq('user_id', data.user.id)
            .single();
            
        if (profileError) throw profileError;
        
        // Store user session
        sessionStorage.setItem('auth', JSON.stringify({
            user: data.user,
            role: profile.role
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

// Show alert function
function showAlert(message, type) {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type}`;
    alertDiv.textContent = message;
    
    const container = document.getElementById('alert-container');
    container.innerHTML = '';
    container.appendChild(alertDiv);
}