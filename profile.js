const usernameEl = document.querySelector('.profile-username');
const nameEl = document.querySelector('.profile-name');
const bioEl = document.querySelector('.profile-bio');
const websiteEl = document.querySelector('.profile-website');
const avatarEl = document.querySelector('.profile-avatar');

const postsCountEl = document.querySelector('.stat-number:nth-child(1)');
const followersCountEl = document.querySelector('.stat-number:nth-child(2)');
const followingCountEl = document.querySelector('.stat-number:nth-child(3)');

const actionBtn = document.querySelector('.edit-profile'); // dugme

const params = new URLSearchParams(window.location.search);
const userIdParam = params.get('id');

// 🔹 Funkcije za JWT iz cookie
function getTokenFromCookie(name = "token") {
    const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
    return match ? match[2] : null;
}
function parseJwt(token) {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        return JSON.parse(atob(base64));
    } catch (e) { return null; }
}

async function loadProfile() {
    try {
        const endpoint = userIdParam
            ? `http://localhost:3001/users/${userIdParam}`
            : `http://localhost:3001/users/me`;

        const res = await fetch(endpoint, { credentials: 'include' });
        if (!res.ok) throw new Error('Neuspješno učitavanje profila');

        const data = await res.json();

        // 🔹 fallback za oba endpointa
        const user = data.user ? data.user : data; 
        if (!user || !user.id) throw new Error('Nevalidan odgovor sa backend-a');

        // Popunjavanje profila
        usernameEl.textContent = user.username || '';
        nameEl.textContent = user.name || '';
        bioEl.textContent = user.bio || '';
        websiteEl.textContent = user.website || '';
        avatarEl.textContent = user.avatar ? `<img src="${user.avatar}" alt="avatar" />` : '👤';

        const stats = user.stats || {};
        const posts = stats.posts || user.posts_count || 0;
        const followers = stats.followers || user.followers_count || 0;
        const following = stats.following || user.following_count || 0;

        const statElements = document.querySelectorAll('.stat-number');
        if (statElements.length >= 3) {
            statElements[0].textContent = posts;
            statElements[1].textContent = followers;
            statElements[2].textContent = following;
        }

        document.title = `${user.username} • Verza`;

        // 🔹 Logika dugmeta koristeći token iz cookie
        const token = getTokenFromCookie();
        const decoded = token ? parseJwt(token) : null;
        const loggedInUserId = decoded?.userId;

        if (loggedInUserId && loggedInUserId === user.id) {
            // Svoj profil
            actionBtn.textContent = 'Edit Profile';
            actionBtn.classList.add('edit-profile');
            actionBtn.classList.remove('follow-btn');
            actionBtn.onclick = () => console.log('Edit Profile clicked');
        } else {
            // Tuđi profil
            actionBtn.textContent = 'Follow';
            actionBtn.classList.add('follow-btn');
            actionBtn.classList.remove('edit-profile');
            actionBtn.onclick = () => console.log(`Follow ${user.username}`);
        }

    } catch (err) {
        console.error('Greška pri učitavanju profila:', err);
        alert('Greška pri učitavanju profila.');
    }
}

loadProfile();
