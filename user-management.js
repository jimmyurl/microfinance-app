// Initialize Supabase client
const SUPABASE_URL = 'your-supabase-url';
const SUPABASE_KEY = 'your-supabase-anon-key';
const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// DOM elements
const usersTableBody = document.getElementById('users-table-body');
const addUserBtn = document.getElementById('add-user-btn');
const alertContainer = document.getElementById('alert-container');

// Mock data for development (will be replaced with Supabase)
let users = [
  {
    "user_id": "ea3cce18-de97-4b3f-a4ef-41683a217781",
    "username": "KIC",
    "full_name": "Pedius Boniphace",
    "role": "admin",
    "branch": "KIC",
    "created_at": "2025-05-04 10:46:56.542883+00",
    "updated_at": "2025-05-04 10:46:56.542883+00",
    "status": "active"
  }
];

// Function to display alert messages
function showAlert(message, type = 'success') {
  const alert = document.createElement('div');
  alert.className = `alert alert-${type}`;
  alert.textContent = message;
  
  // Add close button
  const closeBtn = document.createElement('span');
  closeBtn.className = 'close-btn';
  closeBtn.innerHTML = '&times;';
  closeBtn.onclick = function() {
    alertContainer.removeChild(alert);
  };
  
  alert.appendChild(closeBtn);
  alertContainer.appendChild(alert);
  
  // Auto-close after 5 seconds
  setTimeout(() => {
    if (alert.parentNode === alertContainer) {
      alertContainer.removeChild(alert);
    }
  }, 5000);
}

// Function to load users from API/database
async function loadUsers() {
  try {
    // In production, replace with actual Supabase query
    // const { data, error } = await supabase.from('users').select('*');
    // if (error) throw error;
    // users = data;
    
    // For demo, we'll use the mock data
    renderUsersTable();
  } catch (error) {
    console.error('Error loading users:', error);
    showAlert('Failed to load users: ' + error.message, 'error');
  }
}

// Function to render users table
function renderUsersTable() {
  usersTableBody.innerHTML = '';
  
  users.forEach(user => {
    const tr = document.createElement('tr');
    tr.className = user.status === 'inactive' ? 'inactive-user' : '';
    
    tr.innerHTML = `
      <td>${user.username}</td>
      <td>${user.role}</td>
      <td>${user.branch}</td>
      <td>${user.status || 'active'}</td>
      <td>
        <button class="btn-icon edit-user" data-id="${user.user_id}">✏️</button>
        ${user.status === 'inactive' 
          ? `<button class="btn-icon activate-user" data-id="${user.user_id}">✅</button>` 
          : `<button class="btn-icon deactivate-user" data-id="${user.user_id}">🚫</button>`
        }
        <button class="btn-icon delete-user" data-id="${user.user_id}">🗑️</button>
      </td>
    `;
    
    usersTableBody.appendChild(tr);
  });
  
  // Add event listeners to action buttons
  document.querySelectorAll('.edit-user').forEach(btn => {
    btn.addEventListener('click', () => editUser(btn.dataset.id));
  });
  
  document.querySelectorAll('.deactivate-user').forEach(btn => {
    btn.addEventListener('click', () => deactivateUser(btn.dataset.id));
  });
  
  document.querySelectorAll('.activate-user').forEach(btn => {
    btn.addEventListener('click', () => activateUser(btn.dataset.id));
  });
  
  document.querySelectorAll('.delete-user').forEach(btn => {
    btn.addEventListener('click', () => deleteUser(btn.dataset.id));
  });
}

// Function to handle user deletion
async function deleteUser(userId) {
  if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
    return;
  }
  
  try {
    // In production, use Supabase to delete
    // const { error } = await supabase.from('users').delete().eq('user_id', userId);
    // if (error) throw error;
    
    // For demo, we'll update the mock data
    users = users.filter(user => user.user_id !== userId);
    renderUsersTable();
    showAlert('User successfully deleted');
  } catch (error) {
    console.error('Error deleting user:', error);
    showAlert('Failed to delete user: ' + error.message, 'error');
  }
}

// Function to handle user deactivation
async function deactivateUser(userId) {
  try {
    // In production, use Supabase to update
    // const { error } = await supabase
    //   .from('users')
    //   .update({ status: 'inactive' })
    //   .eq('user_id', userId);
    // if (error) throw error;
    
    // For demo, we'll update the mock data
    const userIndex = users.findIndex(user => user.user_id === userId);
    if (userIndex !== -1) {
      users[userIndex].status = 'inactive';
      renderUsersTable();
      showAlert('User successfully deactivated');
    }
  } catch (error) {
    console.error('Error deactivating user:', error);
    showAlert('Failed to deactivate user: ' + error.message, 'error');
  }
}

// Function to handle user activation
async function activateUser(userId) {
  try {
    // In production, use Supabase to update
    // const { error } = await supabase
    //   .from('users')
    //   .update({ status: 'active' })
    //   .eq('user_id', userId);
    // if (error) throw error;
    
    // For demo, we'll update the mock data
    const userIndex = users.findIndex(user => user.user_id === userId);
    if (userIndex !== -1) {
      users[userIndex].status = 'active';
      renderUsersTable();
      showAlert('User successfully activated');
    }
  } catch (error) {
    console.error('Error activating user:', error);
    showAlert('Failed to activate user: ' + error.message, 'error');
  }
}

// Function to show modal for editing user
function editUser(userId) {
  const user = users.find(u => u.user_id === userId);
  if (!user) return;
  
  // Create modal for editing
  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.innerHTML = `
    <div class="modal-content">
      <span class="close">&times;</span>
      <h3>Edit User</h3>
      <form id="edit-user-form">
        <input type="hidden" id="edit-user-id" value="${user.user_id}">
        
        <div class="form-group">
          <label for="edit-username">Username</label>
          <input type="text" id="edit-username" class="form-control" value="${user.username}" required>
        </div>
        
        <div class="form-group">
          <label for="edit-fullname">Full Name</label>
          <input type="text" id="edit-fullname" class="form-control" value="${user.full_name}" required>
        </div>
        
        <div class="form-group">
          <label for="edit-role">Role</label>
          <select id="edit-role" class="form-control" required>
            <option value="admin" ${user.role === 'admin' ? 'selected' : ''}>Admin</option>
            <option value="manager" ${user.role === 'manager' ? 'selected' : ''}>Manager</option>
            <option value="loan-officer" ${user.role === 'loan-officer' ? 'selected' : ''}>Loan Officer</option>
            <option value="accountant" ${user.role === 'accountant' ? 'selected' : ''}>Accountant</option>
          </select>
        </div>
        
        <div class="form-group">
          <label for="edit-branch">Branch</label>
          <input type="text" id="edit-branch" class="form-control" value="${user.branch}" required>
        </div>
        
        <div class="form-group">
          <label for="edit-password">New Password (leave blank to keep current)</label>
          <input type="password" id="edit-password" class="form-control">
        </div>
        
        <button type="submit" class="btn btn-primary">Update User</button>
      </form>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  // Close button functionality
  const closeBtn = modal.querySelector('.close');
  closeBtn.onclick = function() {
    document.body.removeChild(modal);
  };
  
  // Close when clicking outside the modal
  window.onclick = function(event) {
    if (event.target === modal) {
      document.body.removeChild(modal);
    }
  };
  
  // Form submission
  const form = document.getElementById('edit-user-form');
  form.onsubmit = async function(e) {
    e.preventDefault();
    
    const updatedUser = {
      user_id: document.getElementById('edit-user-id').value,
      username: document.getElementById('edit-username').value,
      full_name: document.getElementById('edit-fullname').value,
      role: document.getElementById('edit-role').value,
      branch: document.getElementById('edit-branch').value,
      // Only include password if it was provided
      ...(document.getElementById('edit-password').value && {
        password: document.getElementById('edit-password').value
      })
    };
    
    try {
      // In production, use Supabase to update
      // const { error } = await supabase
      //   .from('users')
      //   .update(updatedUser)
      //   .eq('user_id', updatedUser.user_id);
      // if (error) throw error;
      
      // For demo, we'll update the mock data
      const userIndex = users.findIndex(u => u.user_id === updatedUser.user_id);
      if (userIndex !== -1) {
        users[userIndex] = { ...users[userIndex], ...updatedUser };
        document.body.removeChild(modal);
        renderUsersTable();
        showAlert('User successfully updated');
      }
    } catch (error) {
      console.error('Error updating user:', error);
      showAlert('Failed to update user: ' + error.message, 'error');
    }
  };
}

// Function to show modal for adding a new user
function showAddUserModal() {
  // Create modal for adding new user
  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.innerHTML = `
    <div class="modal-content">
      <span class="close">&times;</span>
      <h3>Add New User</h3>
      <form id="add-user-form">
        <div class="form-group">
          <label for="new-username">Username</label>
          <input type="text" id="new-username" class="form-control" required>
        </div>
        
        <div class="form-group">
          <label for="new-fullname">Full Name</label>
          <input type="text" id="new-fullname" class="form-control" required>
        </div>
        
        <div class="form-group">
          <label for="new-password">Password</label>
          <input type="password" id="new-password" class="form-control" required>
        </div>
        
        <div class="form-group">
          <label for="new-role">Role</label>
          <select id="new-role" class="form-control" required>
            <option value="admin">Admin</option>
            <option value="manager">Manager</option>
            <option value="loan-officer">Loan Officer</option>
            <option value="accountant">Accountant</option>
          </select>
        </div>
        
        <div class="form-group">
          <label for="new-branch">Branch</label>
          <input type="text" id="new-branch" class="form-control" required>
        </div>
        
        <button type="submit" class="btn btn-primary">Add User</button>
      </form>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  // Close button functionality
  const closeBtn = modal.querySelector('.close');
  closeBtn.onclick = function() {
    document.body.removeChild(modal);
  };
  
  // Close when clicking outside the modal
  window.onclick = function(event) {
    if (event.target === modal) {
      document.body.removeChild(modal);
    }
  };
  
  // Form submission
  const form = document.getElementById('add-user-form');
  form.onsubmit = async function(e) {
    e.preventDefault();
    
    const newUser = {
      user_id: crypto.randomUUID(), // Generate UUID for demo
      username: document.getElementById('new-username').value,
      full_name: document.getElementById('new-fullname').value,
      password: document.getElementById('new-password').value, // In production, handle securely
      role: document.getElementById('new-role').value,
      branch: document.getElementById('new-branch').value,
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    try {
      // In production, use Supabase to insert
      // const { error } = await supabase.from('users').insert(newUser);
      // if (error) throw error;
      
      // For demo, we'll update the mock data
      users.push(newUser);
      document.body.removeChild(modal);
      renderUsersTable();
      showAlert('User successfully added');
    } catch (error) {
      console.error('Error adding user:', error);
      showAlert('Failed to add user: ' + error.message, 'error');
    }
  };
}

// Add event listener to "Add New User" button
addUserBtn.addEventListener('click', showAddUserModal);

// Initialize user management when the page loads
document.addEventListener('DOMContentLoaded', function() {
  // Only run this script if we're on the settings page
  if (document.getElementById('user-settings')) {
    loadUsers();
    
    // Setup tab buttons functionality
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabButtons.forEach(button => {
      button.addEventListener('click', () => {
        const tabId = button.dataset.tab;
        
        // Update active button
        tabButtons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        
        // Show selected tab content
        tabContents.forEach(content => content.classList.remove('active'));
        document.getElementById(tabId).classList.add('active');
      });
    });
  }
});