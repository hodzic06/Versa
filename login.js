const emailInput = document.getElementById('name');
const passwordInput = document.getElementById('password');
const loginButton = document.getElementById('sign-btn');

const loginUser = async (event) => {
    const email = emailInput.value;
    const password = passwordInput.value;
    event.preventDefault();

    try {
        const response = await fetch('http://localhost:3001/users/login', {
            method: 'POST',
            body: JSON.stringify({ email, password }),
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include'
        });

        if (response.ok) {
            window.location.replace('/home.html');
        } else {
            alert('Failed to log in. Please check your email and password.');
        }
    } catch (error) {
        console.error('Error during login:', error);    
        alert('An error occurred. Please try again later.');
    }
}

loginButton.addEventListener('click', loginUser);