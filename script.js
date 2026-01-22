// 로컬 스토리지에서 포스트 데이터 관리
const STORAGE_KEY = 'blogPosts';
const ADMIN_SESSION_KEY = 'adminSession';
const ADMIN_PASSWORD_KEY = 'adminPassword';
const DEFAULT_PASSWORD = 'admin123'; // 기본 비밀번호 (변경 가능)

// 포스트 데이터 가져오기
function getPosts() {
    const posts = localStorage.getItem(STORAGE_KEY);
    return posts ? JSON.parse(posts) : [];
}

// 포스트 데이터 저장하기
function savePosts(posts) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(posts));
}

// 새 포스트 추가
function addPost(title, author, content) {
    const posts = getPosts();
    const newPost = {
        id: Date.now().toString(),
        title: title,
        author: author,
        content: content,
        date: new Date().toISOString(),
        createdAt: new Date().toLocaleDateString('ko-KR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        })
    };
    posts.unshift(newPost); // 최신 포스트가 맨 위에 오도록
    savePosts(posts);
    return newPost;
}

// 포스트 ID로 찾기
function getPostById(id) {
    const posts = getPosts();
    return posts.find(post => post.id === id);
}

// 관리자 인증 관련 함수들
function getAdminPassword() {
    const stored = localStorage.getItem(ADMIN_PASSWORD_KEY);
    return stored || DEFAULT_PASSWORD;
}

function setAdminPassword(password) {
    localStorage.setItem(ADMIN_PASSWORD_KEY, password);
}

function isAdminLoggedIn() {
    const session = localStorage.getItem(ADMIN_SESSION_KEY);
    if (!session) return false;
    
    // 세션 만료 시간 확인 (24시간)
    const sessionData = JSON.parse(session);
    const now = Date.now();
    if (now - sessionData.timestamp > 24 * 60 * 60 * 1000) {
        logout();
        return false;
    }
    return true;
}

function login(password) {
    const correctPassword = getAdminPassword();
    if (password === correctPassword) {
        const sessionData = {
            timestamp: Date.now()
        };
        localStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(sessionData));
        return true;
    }
    return false;
}

function logout() {
    localStorage.removeItem(ADMIN_SESSION_KEY);
}

// 관리자 페이지 접근 체크
function checkAdminAccess() {
    if (!isAdminLoggedIn()) {
        alert('관리자만 접근할 수 있습니다.');
        window.location.href = 'login.html';
        return false;
    }
    return true;
}

// 포스트 삭제
function deletePost(id) {
    if (!isAdminLoggedIn()) {
        alert('관리자만 삭제할 수 있습니다.');
        window.location.href = 'login.html';
        return false;
    }
    
    if (!confirm('정말로 이 포스트를 삭제하시겠습니까?')) {
        return false;
    }
    
    const posts = getPosts();
    const filteredPosts = posts.filter(post => post.id !== id);
    savePosts(filteredPosts);
    return true;
}

// 메인 페이지 - 최근 포스트 표시
function loadRecentPosts() {
    const posts = getPosts();
    const recentPosts = posts.slice(0, 6); // 최근 6개만
    const container = document.getElementById('recentPosts');
    
    if (!container) return;
    
    if (recentPosts.length === 0) {
        container.innerHTML = `
            <div class="empty-state" style="grid-column: 1 / -1;">
                <h3>아직 포스트가 없습니다</h3>
                <p>첫 번째 포스트를 작성해보세요!</p>
                <a href="write.html" class="btn btn-primary">글 작성하기</a>
            </div>
        `;
        return;
    }
    
    container.innerHTML = recentPosts.map(post => `
        <a href="post.html?id=${post.id}" class="post-card">
            <h3>${escapeHtml(post.title)}</h3>
            <div class="post-meta">
                <span>작성자: ${escapeHtml(post.author)}</span>
                <span>${post.createdAt}</span>
            </div>
            <div class="post-excerpt">${escapeHtml(post.content.substring(0, 150))}${post.content.length > 150 ? '...' : ''}</div>
        </a>
    `).join('');
}

// 블로그 목록 페이지 - 모든 포스트 표시
function loadAllPosts() {
    const posts = getPosts();
    const container = document.getElementById('allPosts');
    
    if (!container) return;
    
    if (posts.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <h3>아직 포스트가 없습니다</h3>
                <p>첫 번째 포스트를 작성해보세요!</p>
                <a href="write.html" class="btn btn-primary">글 작성하기</a>
            </div>
        `;
        return;
    }
    
    const isAdmin = isAdminLoggedIn();
    container.innerHTML = posts.map(post => `
        <div class="post-card-wrapper">
            <a href="post.html?id=${post.id}" class="post-card">
                <h3>${escapeHtml(post.title)}</h3>
                <div class="post-meta">
                    <span>작성자: ${escapeHtml(post.author)}</span>
                    <span>${post.createdAt}</span>
                </div>
                <div class="post-excerpt">${escapeHtml(post.content.substring(0, 200))}${post.content.length > 200 ? '...' : ''}</div>
            </a>
            ${isAdmin ? `<button onclick="handleDeletePost('${post.id}')" class="btn-delete" title="삭제">×</button>` : ''}
        </div>
    `).join('');
}

// 포스트 상세 페이지
function loadPostDetail() {
    const urlParams = new URLSearchParams(window.location.search);
    const postId = urlParams.get('id');
    const container = document.getElementById('postContent');
    
    if (!container) return;
    
    if (!postId) {
        container.innerHTML = `
            <div class="empty-state">
                <h3>포스트를 찾을 수 없습니다</h3>
                <p><a href="blog.html">블로그 목록으로 돌아가기</a></p>
            </div>
        `;
        return;
    }
    
    const post = getPostById(postId);
    
    if (!post) {
        container.innerHTML = `
            <div class="empty-state">
                <h3>포스트를 찾을 수 없습니다</h3>
                <p><a href="blog.html">블로그 목록으로 돌아가기</a></p>
            </div>
        `;
        return;
    }
    
    const isAdmin = isAdminLoggedIn();
    container.innerHTML = `
        <div class="post-header">
            <h1>${escapeHtml(post.title)}</h1>
            ${isAdmin ? `<button onclick="handleDeletePost('${post.id}')" class="btn btn-danger">삭제</button>` : ''}
        </div>
        <div class="post-meta">
            <span>작성자: ${escapeHtml(post.author)}</span>
            <span>${post.createdAt}</span>
        </div>
        <div class="post-content">${escapeHtml(post.content).replace(/\n/g, '<br>')}</div>
    `;
    
    // 페이지 제목 업데이트
    document.title = `${post.title} - My Blog`;
}

// 포스트 삭제 처리 (전역 함수로 노출)
window.handleDeletePost = function(id) {
    if (deletePost(id)) {
        alert('포스트가 삭제되었습니다.');
        window.location.href = 'blog.html';
    }
};

// 로그인 폼 처리
function handleLoginForm() {
    const form = document.getElementById('loginForm');
    
    if (!form) return;
    
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const password = document.getElementById('adminPassword').value.trim();
        const errorDiv = document.getElementById('loginError');
        
        if (login(password)) {
            alert('로그인 성공!');
            window.location.href = 'write.html';
        } else {
            errorDiv.textContent = '비밀번호가 올바르지 않습니다.';
            errorDiv.style.display = 'block';
            document.getElementById('adminPassword').value = '';
        }
    });
}

// 글 작성 폼 처리
function handlePostForm() {
    // 관리자 접근 체크
    if (!checkAdminAccess()) {
        return;
    }
    
    const form = document.getElementById('postForm');
    
    if (!form) return;
    
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const title = document.getElementById('postTitle').value.trim();
        const author = document.getElementById('postAuthor').value.trim();
        const content = document.getElementById('postContent').value.trim();
        
        if (!title || !author || !content) {
            alert('모든 필드를 입력해주세요.');
            return;
        }
        
        const newPost = addPost(title, author, content);
        
        // 성공 메시지
        alert('포스트가 성공적으로 게시되었습니다!');
        
        // 포스트 상세 페이지로 이동
        window.location.href = `post.html?id=${newPost.id}`;
    });
}

// 로그아웃 함수
window.handleLogout = function() {
    if (confirm('로그아웃 하시겠습니까?')) {
        logout();
        alert('로그아웃 되었습니다.');
        window.location.href = 'index.html';
    }
};

// XSS 방지를 위한 HTML 이스케이프
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// 네비게이션 업데이트 (관리자 로그인 상태에 따라)
function updateNavigation() {
    const navMenus = document.querySelectorAll('.nav-menu');
    const isAdmin = isAdminLoggedIn();
    
    navMenus.forEach(navMenu => {
        // 기존 글쓰기 링크 제거
        const writeLink = navMenu.querySelector('a[href="write.html"]');
        if (writeLink) {
            writeLink.remove();
        }
        
        // 관리자 메뉴 추가/제거
        const adminLink = navMenu.querySelector('a[href="login.html"]');
        const logoutBtn = navMenu.querySelector('.logout-btn');
        
        if (isAdmin) {
            // 관리자 로그인 상태: 글쓰기 + 로그아웃
            const writeLi = document.createElement('li');
            writeLi.innerHTML = '<a href="write.html">글쓰기</a>';
            navMenu.appendChild(writeLi);
            
            if (!logoutBtn) {
                const logoutLi = document.createElement('li');
                logoutLi.innerHTML = '<a href="#" class="logout-btn" onclick="handleLogout(); return false;">로그아웃</a>';
                navMenu.appendChild(logoutLi);
            }
        } else {
            // 비로그인 상태: 관리자 로그인
            if (!adminLink) {
                const loginLi = document.createElement('li');
                loginLi.innerHTML = '<a href="login.html">관리자</a>';
                navMenu.appendChild(loginLi);
            }
            if (logoutBtn) {
                logoutBtn.parentElement.remove();
            }
        }
    });
}

// 페이지 로드 시 적절한 함수 실행
document.addEventListener('DOMContentLoaded', function() {
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    
    // 네비게이션 업데이트
    updateNavigation();
    
    if (currentPage === 'index.html' || currentPage === '') {
        loadRecentPosts();
    } else if (currentPage === 'blog.html') {
        loadAllPosts();
    } else if (currentPage === 'post.html') {
        loadPostDetail();
    } else if (currentPage === 'write.html') {
        handlePostForm();
    } else if (currentPage === 'login.html') {
        handleLoginForm();
    }
});
