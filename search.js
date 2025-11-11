const searchInput = document.querySelector('.search-input');
const searchResultsContainer = document.querySelector('.search-results');

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
    searchResultsContainer.innerHTML = '';

    if (users.length === 0) {
      searchResultsContainer.innerHTML = `<div class="no-results">No users found.</div>`;
      return;
    }

    const resultsHTML = `
      <div class="result-section">
        <div class="section-header">Accounts</div>
        ${users
          .map((user) => {
            const avatarUrl = user.avatar
              ? user.avatar
              : `https://ui-avatars.com/api/?name=${encodeURIComponent(
                  user.name || user.username
                )}&background=random&size=64&rounded=true`;

            return `
              <div class="search-result" data-id="${user.id}">
                <div class="result-avatar">
                  <img src="${avatarUrl}" alt="avatar" 
                       style="width:40px;height:40px;border-radius:50%;object-fit:cover;"/>
                </div>
                <div class="result-info">
                  <div class="result-username">${user.username}</div>
                  <div class="result-name">${user.name || ''}</div>
                </div>
                <button class="result-follow-btn">Follow</button>
              </div>
            `;
          })
          .join('')}
      </div>
    `;

    searchResultsContainer.innerHTML = resultsHTML;

    document.querySelectorAll('.search-result').forEach((result) => {
      result.addEventListener('click', () => {
        const userId = result.dataset.id;
        window.location.href = `profile.html?id=${userId}`;
      });
    });
  } catch (err) {
    console.error('Error fetching search results:', err);
  }
};

searchInput.addEventListener('input', (e) => {
  const query = e.target.value;
  searchUsers(query);
});
