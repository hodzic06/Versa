const nameInput = document.getElementById('name');
const usernameInput = document.getElementById('username');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const registerButton = document.getElementById('sign-btn');

const registerUser = async (event) => {
    event.preventDefault();

    const name = nameInput.value.trim();
    const username = usernameInput.value.trim();
    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();

    if (!name || !username || !email || !password) {
        alert('Please fill out all fields.');
        return;
    }

    try {
        const response = await fetch('http://127.0.0.1:3001/users/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, username, email, password }),
            credentials: 'include' // 👈 omogućava cookie-e
        });

        if (response.ok) {
            window.location.replace('/home.html');
        } else {
            const data = await response.json();
            alert(data.error || 'Failed to register. Please check your details and try again.');
        }
    } catch (error) {
        console.error('Error during registration:', error);
        alert('An error occurred. Please try again later.');
    }
};

registerButton.addEventListener('click', registerUser);
