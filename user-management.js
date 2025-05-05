// User Management JavaScript
document.addEventListener('DOMContentLoaded', function() {
    // Elements
    const usersTable = document.getElementById('users-list');
    const addUserBtn = document.getElementById('add-user-btn');
    const addUserModal = document.getElementById('add-user-modal');
    const editUserModal = document.getElementById('edit-user-modal');
    const deleteUserModal = document.getElementById('delete-user-modal');
    const closeAddModal = document.getElementById('close-add-modal');
    const closeEditModal = document.getElementById('close-edit-modal');
    const closeDeleteModal = document.getElementById('close-delete-modal');
    const addUserForm = document.getElementById('add-user-form');
    const editUserForm = document.getElementById('edit-user-form');
    const cancelDelete = document.getElementById('cancel-delete');
    const confirmDelete = document.getElementById('confirm-delete');

    // Initialize user data
    let users = [
        {
            "user_id": "ea3cce18-de97-4b3f-a4ef-41683a217781",
            "username": "KIC",
            "full_name": "Pedius Boniphace",
            "email": "pedius@pamojamicrofinance.com", // Added this field for display purposes
            "role": "admin",
            "branch": "KIC",
            "status": "active",
            "last_login": "2025-05-04 08:30:22",
            "created_at": "2025-05-04 10:46:56.542883+00",
            "updated_at": "2025-05-04 10:46:56.542883+00"
        }
    ];

    // Function to load users
    function loadUsers() {
        // Clear the table
        usersTable.innerHTML = '';

        // For each user, create a row
        users.forEach(user => {
            const row = document.createElement('tr');
            if (user.status === 'inactive') {
                row.classList.add('inactive-user');
            }

            // Format the role display
            const formattedRole = formatRole(user.role);

            row.innerHTML = `
                <td>${user.full_name}</td>
                <td>${user.email}</td>
                <td>${formattedRole}</td>
                <td><span class="status-badge ${user.status}">${user.status}</span></td>
                <td>${formatDate(user.last_login)}</td>
                <td>
                    <button class="btn-icon edit-user" data-id="${user.user_id}" title="Edit User">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    ${user.status === 'active' ? 
                        `<button class="btn-icon deactivate-user" data-id="${user.user_id}" title="Deactivate User">
                            <i class="fas fa-user-times"></i> Deactivate
                        </button>` : 
                        `<button class="btn-icon activate-user" data-id="${user.user_id}" title="Activate User">
                            <i class="fas fa-user-check"></i> Activate
                        </button>`
                    }
                    <button class="btn-icon delete-user" data-id="${user.user_id}" title="Delete User">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </td>
            `;

            usersTable.appendChild(row);
        });

        // Add event listeners for the action buttons
        addActionButtonListeners();
    }

    // Helper function to format roles for display
    function formatRole(role) {
        switch (role) {
            case 'admin':
                return 'Administrator';
            case 'manager':
                return 'Manager';
            case 'loan-officer':
                return 'Loan Officer';
            case 'accountant':
                return 'Accountant';
            case 'viewer':
                return 'Viewer';
            default:
                return role.charAt(0).toUpperCase() + role.slice(1);
        }
    }

    // Helper function to format dates
    function formatDate(dateString) {
        if (!dateString) return 'Never';
        
        const date = new Date(dateString);
        return date.toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    // Function to add event listeners to action buttons
    function addActionButtonListeners() {
        // Edit user buttons
        document.querySelectorAll('.edit-user').forEach(button => {
            button.addEventListener('click', function() {
                const userId = this.getAttribute('data-id');
                openEditModal(userId);
            });
        });

        // Delete user buttons
        document.querySelectorAll('.delete-user').forEach(button => {
            button.addEventListener('click', function() {
                const userId = this.getAttribute('data-id');
                openDeleteModal(userId);
            });
        });

        // Activate user buttons
        document.querySelectorAll('.activate-user').forEach(button => {
            button.addEventListener('click', function() {
                const userId = this.getAttribute('data-id');
                activateUser(userId);
            });
        });

        // Deactivate user buttons
        document.querySelectorAll('.deactivate-user').forEach(button => {
            button.addEventListener('click', function() {
                const userId = this.getAttribute('data-id');
                deactivateUser(userId);
            });
        });
    }

    // Function to open edit modal
    function openEditModal(userId) {
        const user = users.find(u => u.user_id === userId);
        if (user) {
            document.getElementById('edit-user-id').value = user.user_id;
            document.getElementById('edit-user-name').value = user.full_name;
            document.getElementById('edit-user-email').value = user.email;
            document.getElementById('edit-user-role').value = user.role;
            
            // Clear password fields
            document.getElementById('edit-user-password').value = '';
            document.getElementById('edit-user-confirm-password').value = '';
            
            editUserModal.style.display = 'block';
        }
    }

    // Function to open delete modal
    function openDeleteModal(userId) {
        document.getElementById('delete-user-id').value = userId;
        deleteUserModal.style.display = 'block';
    }

    // Function to activate a user
    function activateUser(userId) {
        // Find the user
        const userIndex = users.findIndex(u => u.user_id === userId);
        if (userIndex !== -1) {
            // Update the user status
            users[userIndex].status = 'active';
            users[userIndex].updated_at = new Date().toISOString();
            
            // In a real application, you would make an API call here
            // For now, we'll just update the UI
            loadUsers();
            showAlert('User activated successfully!', 'success');
        }
    }

    // Function to deactivate a user
    function deactivateUser(userId) {
        // Find the user
        const userIndex = users.findIndex(u => u.user_id === userId);
        if (userIndex !== -1) {
            // Update the user status
            users[userIndex].status = 'inactive';
            users[userIndex].updated_at = new Date().toISOString();
            
            // In a real application, you would make an API call here
            // For now, we'll just update the UI
            loadUsers();
            showAlert('User deactivated successfully!', 'success');
        }
    }

    // Function to create a new user
    function createUser(userData) {
        // Generate a new UUID (in a real app, this would come from the backend)
        const newUserId = generateUUID();
        
        // Create the new user object
        const newUser = {
            user_id: newUserId,
            username: userData.email.split('@')[0], // Simple username generation
            full_name: userData.name,
            email: userData.email,
            role: userData.role,
            branch: "Main", // Default branch
            status: 'active',
            last_login: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };
        
        // Add to users array
        users.push(newUser);
        
        // In a real application, you would make an API call here
        // For now, we'll just update the UI
        loadUsers();
        showAlert('User created successfully!', 'success');
    }

    // Function to update an existing user
    function updateUser(userId, userData) {
        // Find the user
        const userIndex = users.findIndex(u => u.user_id === userId);
        if (userIndex !== -1) {
            // Update the user
            users[userIndex].full_name = userData.name;
            users[userIndex].email = userData.email;
            users[userIndex].role = userData.role;
            users[userIndex].updated_at = new Date().toISOString();
            
            // If a new password was provided, it would be handled here
            // In a real app, this would involve an API call
            
            // In a real application, you would make an API call here
            // For now, we'll just update the UI
            loadUsers();
            showAlert('User updated successfully!', 'success');
        }
    }

    // Function to delete a user
    function deleteUser(userId) {
        // Filter out the user
        users = users.filter(u => u.user_id !== userId);
        
        // In a real application, you would make an API call here
        // For now, we'll just update the UI
        loadUsers();
        showAlert('User deleted successfully!', 'success');
    }

    // Helper function to generate a UUID
    function generateUUID() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    // Event listeners for modals
    addUserBtn.addEventListener('click', function() {
        // Clear the form
        addUserForm.reset();
        addUserModal.style.display = 'block';
    });

    closeAddModal.addEventListener('click', function() {
        addUserModal.style.display = 'none';
    });

    closeEditModal.addEventListener('click', function() {
        editUserModal.style.display = 'none';
    });

    closeDeleteModal.addEventListener('click', function() {
        deleteUserModal.style.display = 'none';
    });

    cancelDelete.addEventListener('click', function() {
        deleteUserModal.style.display = 'none';
    });

    // Handle form submissions
    addUserForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Get form data
        const name = document.getElementById('new-user-name').value;
        const email = document.getElementById('new-user-email').value;
        const role = document.getElementById('new-user-role').value;
        const password = document.getElementById('new-user-password').value;
        const confirmPassword = document.getElementById('new-user-confirm-password').value;
        
        // Validate passwords match
        if (password !== confirmPassword) {
            showAlert('Passwords do not match!', 'error');
            return;
        }
        
        // Create the user
        createUser({
            name,
            email,
            role,
            password // In a real app, this would be hashed on the server
        });
        
        // Close the modal
        addUserModal.style.display = 'none';
    });

    editUserForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Get form data
        const userId = document.getElementById('edit-user-id').value;
        const name = document.getElementById('edit-user-name').value;
        const email = document.getElementById('edit-user-email').value;
        const role = document.getElementById('edit-user-role').value;
        const password = document.getElementById('edit-user-password').value;
        const confirmPassword = document.getElementById('edit-user-confirm-password').value;
        
        // Validate passwords if provided
        if (password && password !== confirmPassword) {
            showAlert('Passwords do not match!', 'error');
            return;
        }
        
        // Update the user
        updateUser(userId, {
            name,
            email,
            role,
            password // In a real app, this would be hashed on the server
        });
        
        // Close the modal
        editUserModal.style.display = 'none';
    });

    confirmDelete.addEventListener('click', function() {
        const userId = document.getElementById('delete-user-id').value;
        deleteUser(userId);
        deleteUserModal.style.display = 'none';
    });

    // Close modals when clicking outside
    window.addEventListener('click', function(event) {
        if (event.target === addUserModal) {
            addUserModal.style.display = 'none';
        } else if (event.target === editUserModal) {
            editUserModal.style.display = 'none';
        } else if (event.target === deleteUserModal) {
            deleteUserModal.style.display = 'none';
        }
    });

    // Load users on page load
    loadUsers();
});