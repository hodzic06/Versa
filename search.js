const searchInput = document.querySelector('.search-input');
const searchResultsContainer = document.querySelector('.search-results');

// Funkcija koja pretražuje korisnike
const searchUsers = async (query) => {
    if (!query.trim()) {
        searchResultsContainer.innerHTML = '';
        return;
    }

    try {
        const response = await fetch(`http://localhost:3001/users/search?q=${encodeURIComponent(query)}`, {
            credentials: 'include',
        });

        if (!response.ok) {
            console.error('Search failed');
            return;
        }

        const users = await response.json();

        // Očisti stare rezultate
        searchResultsContainer.innerHTML = '';

        if (users.length === 0) {
            searchResultsContainer.innerHTML = `<div class="no-results">No users found.</div>`;
            return;
        }

        // Kreiraj rezultate
        const resultsHTML = `
            <div class="result-section">
                <div class="section-header">Accounts</div>
                ${users
                    .map(
                        (user) => `
                        <div class="search-result" data-id="${user.id}">
                            <div class="result-avatar">👤</div>
                            <div class="result-info">
                                <div class="result-username">${user.username}</div>
                                <div class="result-name">${user.name}</div>
                            </div>
                            <button class="result-follow-btn">Follow</button>
                        </div>
                    `
                    )
                    .join('')}
            </div>
        `;

        searchResultsContainer.innerHTML = resultsHTML;

        // Dodaj event listener za svaki rezultat
        document.querySelectorAll('.search-result').forEach((result) => {
            result.addEventListener('click', () => {
                const userId = result.dataset.id;
                // Preusmjeri na profil stranicu
                window.location.href = `profile.html?id=${userId}`;
            });
        });
    } catch (err) {
        console.error('Error fetching search results:', err);
    }
};

// Slušaj unos u polje za pretragu
searchInput.addEventListener('input', (e) => {
    const query = e.target.value;
    searchUsers(query);
});
