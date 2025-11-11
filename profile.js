const usernameEl = document.querySelector(".profile-username");
const nameEl = document.querySelector(".profile-name");
const bioEl = document.querySelector(".profile-bio");
const websiteEl = document.querySelector(".profile-website");
const avatarEl = document.querySelector(".profile-avatar");
const profileFeed = document.querySelector(".profile-feed");
const createPostSection = document.querySelector(".create-post-section");
const createPostInput = document.querySelector(".create-post-input");
const createPostBtn = document.querySelector(".create-post-btn");
const createPostAvatar = document.querySelector(".create-post-avatar");

const params = new URLSearchParams(window.location.search);
const userIdParam = params.get("id");

let currentUser = null;

function saveLocalPost(post) {
  let saved = JSON.parse(localStorage.getItem('localPosts')) || [];
  saved.unshift(post);
  localStorage.setItem('localPosts', JSON.stringify(saved));
}

function getLocalPosts() {
  return JSON.parse(localStorage.getItem('localPosts')) || [];
}

function clearLocalPosts() {
  localStorage.removeItem('localPosts');
}

async function loadProfile() {
  try {
    const endpoint = userIdParam
      ? `http://127.0.0.1:3001/users/${userIdParam}`
      : `http://127.0.0.1:3001/users/me`;

    const res = await fetch(endpoint, { credentials: "include" });
    const data = await res.json();

    if (!res.ok) {
      if (res.status === 401 && !userIdParam) window.location.href = "/login.html";
      throw new Error(data.error || "Failed to load profile");
    }

    currentUser = data.user || data;

    usernameEl.textContent = currentUser.username;
    nameEl.textContent = currentUser.name || "";
    bioEl.textContent = currentUser.bio || "";
    websiteEl.textContent = currentUser.website || "";
    websiteEl.href = currentUser.website || "#";

    avatarEl.innerHTML = currentUser.avatar
      ? `<img src="${currentUser.avatar}" alt="avatar"/>`
      : `<img src="https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser.name || currentUser.username)}&background=random&size=80&rounded=true" alt="avatar"/>`;

    if (createPostAvatar) {
      createPostAvatar.innerHTML = currentUser.avatar
        ? `<img src="${currentUser.avatar}" alt="avatar" style="width:45px;height:45px;border-radius:50%;object-fit:cover;"/>`
        : `<img src="https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser.name || currentUser.username)}&background=random&size=45&rounded=true" alt="avatar" style="width:45px;height:45px;border-radius:50%;object-fit:cover;"/>`;
    }

    document.querySelectorAll(".stat-number")[0].textContent = (currentUser.posts || []).length;
    document.querySelectorAll(".stat-number")[1].textContent = currentUser.followers_count || 0;
    document.querySelectorAll(".stat-number")[2].textContent = currentUser.following_count || 0;

    document.title = `${currentUser.username} • Verza`;

    if (!userIdParam) {
      createPostSection.style.display = "block";
      createPostBtn.onclick = createPost;
    }

    renderPosts(currentUser.posts || []);
  } catch (err) {
    console.error(err);
    if (!userIdParam) window.location.href = "/login.html";
  }
}

async function createPost() {
  const text = createPostInput.value.trim();
  if (!text) return alert("Post cannot be empty");

  const res = await fetch("http://127.0.0.1:3001/posts/", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content: text }),
  });

  const data = await res.json();
  if (!res.ok) return alert(data.error || "Failed to create post");

  createPostInput.value = "";

  saveLocalPost(data);
  addPostToDOM(data, true);
}

function addPostToDOM(post, prepend = true) {
  const card = document.createElement("div");
  card.classList.add("post-card");

  const header = document.createElement("div");
  header.classList.add("post-header");
  header.innerHTML = `<span>${usernameEl.textContent}</span> <span class="post-date">${new Date(post.created_at).toLocaleString()}</span>`;

  const content = document.createElement("div");
  content.classList.add("post-content");
  content.textContent = post.content;

  const actions = document.createElement("div");
  actions.classList.add("post-actions");

  if (!userIdParam && post.user_id === currentUser.id) {
    const deleteBtn = document.createElement("button");
    deleteBtn.classList.add("delete-btn");
    deleteBtn.textContent = "Delete";
    deleteBtn.onclick = async () => {
      await fetch(`http://127.0.0.1:3001/posts/${post.id}`, {
        method: "DELETE",
        credentials: "include",
      });
      card.remove();
      const local = getLocalPosts().filter(p => p.id !== post.id);
      localStorage.setItem('localPosts', JSON.stringify(local));
    };
    actions.appendChild(deleteBtn);
  }

  const likeBtn = document.createElement("button");
  likeBtn.classList.add("like-btn");
  likeBtn.textContent = `Like (${post.likes?.length || 0})`;
  likeBtn.onclick = async () => {
    await fetch(`http://127.0.0.1:3001/posts/${post.id}/like`, {
      method: "POST",
      credentials: "include",
    });
    updatePostLikes(card, post.id);
  };

  const commentBtn = document.createElement("button");
  commentBtn.classList.add("comment-btn");
  commentBtn.textContent = `Comment (${post.comments?.length || 0})`;
  commentBtn.onclick = () => {
    const commentText = prompt("Enter your comment:");
    if (!commentText) return;
    fetch("http://127.0.0.1:3001/posts/comment", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ post_id: post.id, content: commentText }),
    }).then(() => updatePostComments(card, post.id));
  };

  actions.appendChild(likeBtn);
  actions.appendChild(commentBtn);

  card.appendChild(header);
  card.appendChild(content);
  card.appendChild(actions);

  const commentsDiv = document.createElement("div");
  commentsDiv.classList.add("comments-div");
  card.appendChild(commentsDiv);

  if (prepend) profileFeed.prepend(card);
  else profileFeed.appendChild(card);

  updatePostComments(card, post.id);
}

async function updatePostLikes(card, postId) {
  const res = await fetch(`http://127.0.0.1:3001/posts/${postId}`, {
    credentials: "include",
  });
  const data = await res.json();
  card.querySelector(".like-btn").textContent = `Like (${data.likes?.length || 0})`;
}

async function updatePostComments(card, postId) {
  const res = await fetch(`http://127.0.0.1:3001/posts/${postId}`, {
    credentials: "include",
  });
  const data = await res.json();
  const commentsDiv = card.querySelector(".comments-div");
  commentsDiv.innerHTML = "";
  if (data.comments?.length) {
    data.comments.forEach((c) => {
      const cDiv = document.createElement("div");
      cDiv.style.fontSize = "12px";
      cDiv.style.color = "#ccc";
      cDiv.textContent = `${c.user_id}: ${c.content}`;
      commentsDiv.appendChild(cDiv);
    });
  }
}

function renderPosts(posts) {
  profileFeed.innerHTML = "";
  posts.forEach((post) => addPostToDOM(post, false));
  const local = getLocalPosts();
  local.forEach((post) => addPostToDOM(post, false));
}

loadProfile();
