// ======================================================
// عالم الحكايات السحرية
// main.js - الإصدار المعدل (التسجيل بدون بريد إلكتروني)
// ======================================================

const APP_NAME = "عالم الحكايات السحرية";
const CONTACT_EMAIL = "mystories447@gmail.com";

const firebaseConfig = {
    apiKey: "AIzaSyBmpeQcKvqUTkxiNRN3ScgFwlsc6lsPIo4",
    authDomain: "store-kides.firebaseapp.com",
    projectId: "store-kides",
    storageBucket: "store-kides.firebasestorage.app",
    messagingSenderId: "699713391654",
    appId: "1:699713391654:web:9424475bc631f155c26ae7",
    measurementId: "G-7B55CS8034"
};

// ======================================================
// Firebase
// ======================================================

if (typeof firebase === "undefined") {
    document.body.innerHTML = `
        <div style="padding:40px;text-align:center;font-family:Arial;direction:rtl;">
            <h2>❌ Firebase غير محمل</h2>
            <p>تأكد من تحميل Firebase قبل ملف main.js.</p>
        </div>
    `;
    throw new Error("Firebase is not defined");
}

if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

const auth = firebase.auth();
const db = firebase.firestore();

// ======================================================
// المتغيرات
// ======================================================

let currentUser = null;
let currentStoryId = null;
let editingStoryId = null;
let storyToDelete = null;
let stories = [];
let toastTimer = null;

// دالة تحويل اسم المستخدم إلى معرف داخلي لـ Firebase
function usernameToEmail(username) {
    const encoder = new TextEncoder();
    const bytes = encoder.encode(username.trim().toLowerCase());
    const hex = Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
    return `u_${hex}@magicstories.internal`;
}

// ======================================================
// تشغيل الموقع
// ======================================================

document.addEventListener("DOMContentLoaded", () => {
    document.documentElement.lang = "ar";
    document.documentElement.dir = "rtl";

    addStyles();
    createApp();
    setupEvents();
    loadTheme();

    auth.onAuthStateChanged(async user => {
        currentUser = user;
        updateUserUI();
        await loadStories();
    });
});

// ======================================================
// CSS
// ======================================================

function addStyles() {
    const style = document.createElement("style");
    style.textContent = `
    * { box-sizing: border-box; }
    html { direction: rtl; scroll-behavior: smooth; }
    body { margin: 0; font-family: Arial, Tahoma, sans-serif; background: #f4f6fb; color: #202124; transition: background .3s, color .3s; }
    body.dark { background: #101218; color: #f5f5f5; }
    button, input, textarea { font-family: inherit; }
    button { cursor: pointer; }
    .app { min-height: 100vh; }

    .topbar { background: linear-gradient(135deg, #6c4cff, #9c62ff); color: white; padding: 18px 25px; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 4px 20px rgba(0,0,0,.15); position: relative; }
    .brand { display: flex; align-items: center; gap: 13px; }
    .brand-icon { width: 52px; height: 52px; border-radius: 15px; background: rgba(255,255,255,.18); display: flex; align-items: center; justify-content: center; font-size: 29px; }
    .topbar h1 { margin: 0 0 5px; font-size: 24px; }
    .topbar p { margin: 0; opacity: .9; }
    .header-right { display: flex; align-items: center; gap: 8px; position: relative; }
    .theme-btn { border: 0; width: 45px; height: 45px; border-radius: 50%; background: rgba(255,255,255,.18); color: white; font-size: 21px; }
    .user-button { border: 0; background: rgba(255,255,255,.18); color: white; padding: 11px 17px; border-radius: 12px; font-weight: bold; font-size: 15px; max-width: 180px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .user-menu { position: absolute; top: 55px; right: 0; width: 190px; background: white; color: #222; border-radius: 14px; box-shadow: 0 12px 35px rgba(0,0,0,.2); overflow: hidden; z-index: 3000; }
    body.dark .user-menu { background: #1d2028; color: white; }
    .user-menu button { width: 100%; padding: 14px; border: 0; background: transparent; text-align: right; color: inherit; font-size: 15px; }
    .user-menu button:hover { background: rgba(108,76,255,.1); }

    main { max-width: 950px; margin: auto; padding: 22px; min-height: 65vh; }
    .welcome { background: white; border-radius: 22px; padding: 25px; display: flex; align-items: center; gap: 20px; box-shadow: 0 5px 25px rgba(0,0,0,.06); }
    body.dark .welcome, body.dark .story-card, body.dark .modal-content, body.dark .auth-card, body.dark .delete-dialog, body.dark .info-page { background: #1c2028; color: white; }
    .welcome-icon { font-size: 55px; }
    .welcome h2 { margin: 0 0 8px; }
    .welcome p { margin: 0; opacity: .7; line-height: 1.7; }
    .actions { margin: 22px 0; display: flex; gap: 12px; flex-wrap: wrap; }
    .primary-btn, .secondary-btn, .danger-btn { border: 0; border-radius: 12px; padding: 13px 18px; font-size: 15px; font-weight: bold; transition: .2s; }
    .primary-btn { background: #6c4cff; color: white; }
    .primary-btn:hover { background: #5638df; }
    .secondary-btn { background: #e9eaf0; color: #333; }
    body.dark .secondary-btn { background: #303540; color: white; }
    .danger-btn { background: #dc3545; color: white; }
    .full-btn { width: 100%; margin-top: 10px; }
    .search-box { flex: 1; min-width: 230px; background: white; border: 1px solid #ddd; border-radius: 12px; display: flex; align-items: center; gap: 8px; padding: 0 14px; }
    body.dark .search-box { background: #1c2028; border-color: #373c47; }
    .search-box input { width: 100%; border: 0; outline: 0; background: transparent; color: inherit; padding: 14px; font-size: 15px; }
    .section-title { margin: 28px 0 15px; }

    .story-card { background: white; border-radius: 18px; padding: 19px; margin-bottom: 15px; border-right: 5px solid #6c4cff; box-shadow: 0 4px 18px rgba(0,0,0,.06); }
    .story-card h3 { margin: 0 0 9px; font-size: 20px; }
    .story-preview { line-height: 1.8; opacity: .72; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
    .story-meta { margin-top: 13px; display: flex; justify-content: space-between; align-items: center; gap: 8px; flex-wrap: wrap; font-size: 12px; opacity: .6; }
    .author-badge { background: rgba(108,76,255,.1); color: #6c4cff; padding: 5px 9px; border-radius: 20px; font-weight: bold; }
    .card-actions { display: flex; gap: 8px; margin-top: 15px; flex-wrap: wrap; }
    .small-btn { border: 0; border-radius: 9px; padding: 9px 13px; background: #eeeeF3; color: #333; font-size: 14px; }
    body.dark .small-btn { background: #303540; color: white; }
    .delete-btn { color: #d93025; }
    .empty, .loading { text-align: center; padding: 55px 20px; opacity: .65; }

    footer { margin-top: 40px; background: #181a22; color: white; padding: 30px 20px 20px; }
    .footer-container { max-width: 950px; margin: auto; text-align: center; }
    .footer-title { font-size: 20px; font-weight: bold; margin-bottom: 10px; }
    .footer-description { opacity: .7; line-height: 1.8; margin-bottom: 20px; }
    .footer-links { display: flex; justify-content: center; flex-wrap: wrap; gap: 8px; margin-bottom: 20px; }
    .footer-link { border: 0; background: rgba(255,255,255,.08); color: white; padding: 10px 14px; border-radius: 10px; font-size: 14px; }
    .footer-link:hover { background: rgba(108,76,255,.7); }
    .footer-copy { border-top: 1px solid rgba(255,255,255,.1); padding-top: 15px; font-size: 13px; opacity: .55; }

    .modal { position: fixed; inset: 0; background: rgba(0,0,0,.68); display: flex; align-items: center; justify-content: center; padding: 20px; z-index: 2000; }
    .hidden { display: none !important; }
    .modal-content, .auth-card, .delete-dialog { background: white; color: #222; width: 100%; max-width: 650px; max-height: 92vh; overflow-y: auto; border-radius: 22px; padding: 24px; box-shadow: 0 20px 70px rgba(0,0,0,.3); position: relative; }
    .modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
    .modal-header h2 { margin: 0; }
    .close-btn { border: 0; background: transparent; color: inherit; font-size: 32px; line-height: 1; }
    label { display: block; margin: 15px 0 7px; font-weight: bold; }
    .form-input, .form-textarea { width: 100%; border: 1px solid #ddd; border-radius: 12px; padding: 13px; font-size: 16px; outline: 0; background: white; color: #222; }
    body.dark .form-input, body.dark .form-textarea { background: #11141a; color: white; border-color: #3a3f49; }
    .form-textarea { min-height: 250px; resize: vertical; line-height: 1.8; }
    .modal-actions, .reader-actions { display: flex; gap: 10px; flex-wrap: wrap; margin-top: 20px; }

    .auth-card { max-width: 430px; text-align: center; }
    .auth-logo { font-size: 50px; margin-bottom: 8px; }
    .auth-card h2 { margin: 0 0 8px; }
    .auth-description { opacity: .65; line-height: 1.7; margin-bottom: 20px; }
    .auth-card .form-input { margin-bottom: 10px; text-align: right; }
    .link-btn { border: 0; background: transparent; color: #6c4cff; margin-top: 14px; font-size: 14px; }
    .auth-divider { margin: 18px 0; opacity: .5; }

    .reader-author { color: #6c4cff; font-weight: bold; margin-bottom: 15px; }
    .story-text { line-height: 2.1; font-size: 19px; white-space: pre-wrap; padding: 18px; border-radius: 15px; background: rgba(108,76,255,.08); }

    .delete-dialog { max-width: 430px; text-align: center; }
    .delete-icon { width: 75px; height: 75px; margin: auto; border-radius: 50%; background: rgba(220,53,69,.12); display: flex; align-items: center; justify-content: center; font-size: 38px; }
    .delete-story-name { font-weight: bold; color: #6c4cff; margin: 12px 0; }
    .delete-warning { background: rgba(220,53,69,.08); padding: 13px; border-radius: 12px; color: #c62828; font-size: 14px; line-height: 1.7; margin: 15px 0; }
    .delete-actions { display: flex; gap: 10px; }
    .delete-actions button { flex: 1; }

    .info-page { background: white; border-radius: 20px; padding: 25px; line-height: 2; box-shadow: 0 5px 25px rgba(0,0,0,.06); }
    .info-page h2 { color: #6c4cff; margin-top: 0; }
    .info-page h3 { margin-top: 25px; }
    .info-page p { opacity: .85; }
    .email-box { display: block; background: rgba(108,76,255,.08); color: #6c4cff; padding: 15px; border-radius: 12px; margin: 15px 0; text-align: center; font-weight: bold; text-decoration: none; }

    .toast { position: fixed; bottom: 25px; left: 25px; max-width: 380px; background: white; color: #222; padding: 15px 17px; border-radius: 15px; box-shadow: 0 10px 35px rgba(0,0,0,.2); display: flex; align-items: center; gap: 12px; z-index: 5000; }
    body.dark .toast { background: #242832; color: white; }
    .toast-icon { font-size: 27px; }
    .toast strong { display: block; margin-bottom: 3px; }
    .toast p { margin: 0; opacity: .7; font-size: 13px; line-height: 1.5; }

    @media(max-width:600px) {
        .topbar { padding: 14px; }
        .brand-icon { display: none; }
        .topbar h1 { font-size: 18px; }
        .topbar p { font-size: 12px; }
        .user-button { max-width: 100px; padding: 10px 11px; font-size: 13px; }
        main { padding: 14px; }
        .welcome { flex-direction: column; text-align: center; }
        .actions { flex-direction: column; }
        .search-box { width: 100%; }
        .primary-btn { width: 100%; }
        .reader-actions { flex-direction: column; }
        .reader-actions button { width: 100%; }
        .toast { left: 12px; right: 12px; bottom: 12px; max-width: none; }
    }
    `;
    document.head.appendChild(style);
}

// ======================================================
// إنشاء التطبيق
// ======================================================

function createApp() {
    document.body.innerHTML = `
    <div class="app">
        <header class="topbar">
            <div class="brand">
                <div class="brand-icon">📚</div>
                <div>
                    <h1>${APP_NAME}</h1>
                    <p>قصص جميلة لأطفالنا الصغار</p>
                </div>
            </div>
            <div class="header-right">
                <button id="themeBtn" class="theme-btn">🌙</button>
                <button id="userButton" class="user-button">تسجيل الدخول</button>
                <div id="userMenu" class="user-menu hidden">
                    <button id="settingsBtn">⚙️ الإعدادات</button>
                    <button id="logoutBtn">🚪 تسجيل الخروج</button>
                </div>
            </div>
        </header>

        <main id="mainContent">
            <section class="welcome">
                <div class="welcome-icon">🧒📖</div>
                <div>
                    <h2>مرحبًا بك في عالم الحكايات ✨</h2>
                    <p>اقرأ القصص المنشورة أو اكتب قصتك وشاركها مع الآخرين.</p>
                </div>
            </section>

            <section class="actions">
                <button id="addBtn" class="primary-btn">➕ إضافة قصة جديدة</button>
                <div class="search-box">
                    🔍
                    <input id="searchInput" type="search" placeholder="ابحث عن قصة...">
                </div>
            </section>

            <h2 class="section-title">📚 جميع القصص</h2>
            <section id="storiesContainer">
                <div class="loading">📚 جاري تحميل القصص...</div>
            </section>
        </main>

        <footer>
            <div class="footer-container">
                <div class="footer-title">📚 ${APP_NAME}</div>
                <div class="footer-description">مساحة آمنة وممتعة لقراءة وكتابة القصص.</div>
                <div class="footer-links">
                    <button class="footer-link" onclick="showHomePage()">🏠 الرئيسية</button>
                    <button class="footer-link" onclick="showPrivacyPage()">🔒 سياسة الخصوصية</button>
                    <button class="footer-link" onclick="showTermsPage()">📄 شروط الاستخدام</button>
                    <button class="footer-link" onclick="showAboutPage()">ℹ️ من نحن</button>
                    <button class="footer-link" onclick="showContactPage()">✉️ تواصل معنا</button>
                </div>
                <div class="footer-copy">© ${new Date().getFullYear()} ${APP_NAME} - جميع الحقوق محفوظة</div>
            </div>
        </footer>
    </div>

    <!-- AUTH -->
    <div id="authModal" class="modal hidden">
        <div class="auth-card">
            <button id="closeAuth" class="close-btn">×</button>
            <div class="auth-logo">📚</div>

            <div id="loginScreen">
                <h2>🔐 تسجيل الدخول</h2>
                <p class="auth-description">سجل دخولك لإضافة وتعديل قصصك.</p>
                <input id="loginUsername" class="form-input" type="text" placeholder="اسم المستخدم">
                <input id="loginPassword" class="form-input" type="password" placeholder="كلمة المرور">
                <button id="loginBtn" class="primary-btn full-btn">🔐 تسجيل الدخول</button>
                <div class="auth-divider">───── أو ─────</div>
                <button id="showRegisterBtn" class="secondary-btn full-btn">🆕 إنشاء حساب جديد</button>
            </div>

            <div id="registerScreen" class="hidden">
                <h2>🆕 إنشاء حساب</h2>
                <p class="auth-description">أنشئ حسابك واحفظ قصصك باسمك.</p>
                <input id="registerName" class="form-input" type="text" placeholder="اسم المستخدم">
                <input id="registerPassword" class="form-input" type="password" placeholder="كلمة المرور">
                <input id="registerPassword2" class="form-input" type="password" placeholder="تأكيد كلمة المرور">
                <button id="registerBtn" class="primary-btn full-btn">🆕 إنشاء الحساب</button>
                <button id="showLoginBtn" class="link-btn">لدي حساب بالفعل</button>
            </div>
        </div>
    </div>

    <!-- STORY MODAL -->
    <div id="storyModal" class="modal hidden">
        <div class="modal-content">
            <div class="modal-header">
                <h2 id="storyModalTitle">✨ إضافة قصة جديدة</h2>
                <button id="closeStoryModal" class="close-btn">×</button>
            </div>
            <label>عنوان القصة</label>
            <input id="titleInput" class="form-input" placeholder="اكتب عنوان القصة...">
            <label>نص القصة</label>
            <textarea id="textInput" class="form-textarea" placeholder="اكتب قصتك هنا..."></textarea>
            <div class="modal-actions">
                <button id="cancelStoryBtn" class="secondary-btn">إلغاء</button>
                <button id="saveStoryBtn" class="primary-btn">💾 حفظ القصة</button>
            </div>
        </div>
    </div>

    <!-- READER -->
    <div id="readerModal" class="modal hidden">
        <div class="modal-content">
            <div class="modal-header">
                <h2 id="readerTitle"></h2>
                <button id="closeReader" class="close-btn">×</button>
            </div>
            <div id="readerAuthor" class="reader-author"></div>
            <div id="readerText" class="story-text"></div>
            <div class="reader-actions">
                <button id="speakBtn" class="primary-btn">🔊 استمع للقصة</button>
                <button id="stopSpeakBtn" class="secondary-btn">⏹️ إيقاف الصوت</button>
                <button id="shareBtn" class="secondary-btn">📤 مشاركة</button>
            </div>
        </div>
    </div>

    <!-- DELETE -->
    <div id="deleteModal" class="modal hidden">
        <div class="delete-dialog">
            <div class="delete-icon">🗑️</div>
            <h2>حذف القصة؟</h2>
            <p>هل أنت متأكد أنك تريد حذف هذه القصة؟</p>
            <div id="deleteStoryName" class="delete-story-name"></div>
            <div class="delete-warning">⚠️ سيتم حذف القصة نهائيًا ولا يمكن التراجع عن هذا الإجراء.</div>
            <div class="delete-actions">
                <button id="cancelDeleteBtn" class="secondary-btn">إلغاء</button>
                <button id="confirmDeleteBtn" class="danger-btn">🗑️ حذف القصة</button>
            </div>
        </div>
    </div>

    <!-- TOAST -->
    <div id="toast" class="toast hidden">
        <div id="toastIcon" class="toast-icon">✅</div>
        <div>
            <strong id="toastTitle">تم</strong>
            <p id="toastMessage"></p>
        </div>
    </div>
    `;
}

// ======================================================
// الأحداث
// ======================================================

function setupEvents() {
    document.getElementById("themeBtn").onclick = toggleTheme;
    document.getElementById("userButton").onclick = handleUserButton;
    document.getElementById("logoutBtn").onclick = logout;
    document.getElementById("settingsBtn").onclick = () => {
        document.getElementById("userMenu").classList.add("hidden");
        showToast("⚙️", "الإعدادات", "الإعدادات ستكون متاحة قريبًا.");
    };

    document.getElementById("addBtn").onclick = openAddStory;
    document.getElementById("searchInput").oninput = e => renderStories(e.target.value);
    document.getElementById("closeAuth").onclick = closeAuth;
    document.getElementById("loginBtn").onclick = login;
    document.getElementById("registerBtn").onclick = register;
    document.getElementById("showRegisterBtn").onclick = showRegister;
    document.getElementById("showLoginBtn").onclick = showLogin;

    document.getElementById("closeStoryModal").onclick = closeStoryModal;
    document.getElementById("cancelStoryBtn").onclick = closeStoryModal;
    document.getElementById("saveStoryBtn").onclick = saveStory;
    document.getElementById("closeReader").onclick = closeReader;
    document.getElementById("speakBtn").onclick = speakStory;
    document.getElementById("stopSpeakBtn").onclick = stopSpeaking;
    document.getElementById("shareBtn").onclick = shareStory;
    document.getElementById("cancelDeleteBtn").onclick = closeDeleteModal;
    document.getElementById("confirmDeleteBtn").onclick = confirmDelete;

    document.querySelectorAll(".modal").forEach(modal => {
        modal.addEventListener("click", e => {
            if (e.target === modal) {
                modal.classList.add("hidden");
                stopSpeaking();
            }
        });
    });
}

// ======================================================
// المستخدم
// ======================================================

function handleUserButton() {
    if (!currentUser) {
        openAuth();
        return;
    }
    document.getElementById("userMenu").classList.toggle("hidden");
}

function updateUserUI() {
    const button = document.getElementById("userButton");
    if (!button) return;
    button.textContent = currentUser ? getUserName() : "تسجيل الدخول";
}

function getUserName() {
    if (!currentUser) return "زائر";
    if (currentUser.displayName) return currentUser.displayName;
    return "مستخدم";
}

// ======================================================
// AUTH
// ======================================================

function openAuth() {
    document.getElementById("authModal").classList.remove("hidden");
    showLogin();
}

function closeAuth() {
    document.getElementById("authModal").classList.add("hidden");
}

function showLogin() {
    document.getElementById("loginScreen").classList.remove("hidden");
    document.getElementById("registerScreen").classList.add("hidden");
}

function showRegister() {
    document.getElementById("loginScreen").classList.add("hidden");
    document.getElementById("registerScreen").classList.remove("hidden");
}

// ======================================================
// LOGIN
// ======================================================

async function login() {
    const username = document.getElementById("loginUsername").value.trim();
    const password = document.getElementById("loginPassword").value;

    if (!username || !password) {
        showToast("⚠️", "بيانات ناقصة", "اكتب اسم المستخدم وكلمة المرور.");
        return;
    }

    const button = document.getElementById("loginBtn");
    button.disabled = true;
    button.textContent = "⏳ جاري الدخول...";

    try {
        const internalEmail = usernameToEmail(username);
        await auth.signInWithEmailAndPassword(internalEmail, password);

        currentUser = auth.currentUser;
        closeAuth();
        updateUserUI();
        renderStories();

        showToast("🎉", "مرحبًا بك", `تم تسجيل الدخول باسم ${getUserName()}`);
    } catch (error) {
        console.error(error);
        showAuthError(error);
    } finally {
        button.disabled = false;
        button.textContent = "🔐 تسجيل الدخول";
    }
}

// ======================================================
// REGISTER
// ======================================================

async function register() {
    const name = document.getElementById("registerName").value.trim();
    const password = document.getElementById("registerPassword").value;
    const password2 = document.getElementById("registerPassword2").value;

    if (!name) {
        showToast("⚠️", "اسم المستخدم مطلوب", "اكتب اسم المستخدم.");
        return;
    }

    if (password.length < 6) {
        showToast("⚠️", "كلمة المرور ضعيفة", "يجب أن تكون 6 أحرف على الأقل.");
        return;
    }

    if (password !== password2) {
        showToast("⚠️", "كلمات المرور مختلفة", "تأكد من تطابق كلمتي المرور.");
        return;
    }

    const button = document.getElementById("registerBtn");
    button.disabled = true;
    button.textContent = "⏳ جاري إنشاء الحساب...";

    try {
        const internalEmail = usernameToEmail(name);
        const result = await auth.createUserWithEmailAndPassword(internalEmail, password);

        await result.user.updateProfile({ displayName: name });
        currentUser = auth.currentUser;

        closeAuth();
        updateUserUI();
        renderStories();

        showToast("🎉", "تم إنشاء الحساب", `مرحبًا بك يا ${name}`);
    } catch (error) {
        console.error(error);
        showAuthError(error);
    } finally {
        button.disabled = false;
        button.textContent = "🆕 إنشاء الحساب";
    }
}

// ======================================================
// أخطاء Auth
// ======================================================

function showAuthError(error) {
    let message = "حدث خطأ. حاول مرة أخرى.";

    switch (error.code) {
        case "auth/email-already-in-use":
            message = "اسم المستخدم هذا مستخدم بالفعل. اختر اسمًا آخر.";
            break;
        case "auth/invalid-email":
            message = "اسم المستخدم يحتوي على رموز غير مدعومة.";
            break;
        case "auth/user-not-found":
        case "auth/wrong-password":
        case "auth/invalid-credential":
            message = "اسم المستخدم أو كلمة المرور غير صحيحة.";
            break;
        case "auth/weak-password":
            message = "كلمة المرور ضعيفة. يرجى إدخال 6 أحرف على الأقل.";
            break;
        case "auth/too-many-requests":
            message = "محاولات كثيرة. حاول بعد قليل.";
            break;
        case "auth/network-request-failed":
            message = "تأكد من اتصال الإنترنت.";
            break;
    }

    showToast("❌", "تعذر تنفيذ العملية", message);
}

// ======================================================
// LOGOUT
// ======================================================

async function logout() {
    try {
        await auth.signOut();
        currentUser = null;

        document.getElementById("userMenu").classList.add("hidden");
        closeAuth();
        updateUserUI();
        renderStories();

        showToast("👋", "تم تسجيل الخروج", "نتمنى أن نراك مرة أخرى.");
    } catch (error) {
        console.error(error);
    }
}

// ======================================================
// FIRESTORE - القصص
// ======================================================

async function loadStories() {
    const container = document.getElementById("storiesContainer");
    if (!container) return;

    container.innerHTML = `<div class="loading">📚 جاري تحميل القصص...</div>`;

    try {
        const snapshot = await db.collection("stories").orderBy("createdAt", "desc").get();
        stories = [];

        snapshot.forEach(doc => {
            stories.push({
                id: doc.id,
                ...doc.data()
            });
        });

        renderStories();
    } catch (error) {
        console.error("Firestore error:", error);
        container.innerHTML = `
            <div class="empty">
                <div style="font-size:50px">❌</div>
                <h3>تعذر تحميل القصص</h3>
                <p>تأكد من تشغيل Firestore وقواعد الأمان.</p>
            </div>
        `;
    }
}

// ======================================================
// عرض القصص
// ======================================================

function renderStories(search = "") {
    const container = document.getElementById("storiesContainer");
    if (!container) return;

    const query = search.trim().toLowerCase();
    const filtered = stories.filter(story => {
        return (
            String(story.title || "").toLowerCase().includes(query) ||
            String(story.text || "").toLowerCase().includes(query)
        );
    });

    if (!filtered.length) {
        container.innerHTML = `
            <div class="empty">
                <div style="font-size:50px">📖</div>
                <h3>لا توجد قصص</h3>
                <p>كن أول من يكتب قصة.</p>
            </div>
        `;
        return;
    }

    container.innerHTML = filtered.map(story => {
        const owner = currentUser && story.userId === currentUser.uid;
        let date = "";

        if (story.createdAt && typeof story.createdAt.toDate === "function") {
            date = story.createdAt.toDate().toLocaleDateString("ar-SA");
        }

        return `
            <article class="story-card">
                <h3>📖 ${escapeHTML(story.title || "")}</h3>
                <div class="story-preview">${escapeHTML(String(story.text || "").replace(/\n/g, " "))}</div>
                <div class="story-meta">
                    <span>📅 ${date}</span>
                    <span class="author-badge">✍️ ${escapeHTML(story.authorName || "كاتب مجهول")}</span>
                </div>
                <div class="card-actions">
                    <button class="small-btn" onclick="openStory('${story.id}')">📖 قراءة</button>
                    ${owner ? `
                        <button class="small-btn" onclick="editStory('${story.id}')">✏️ تعديل</button>
                        <button class="small-btn delete-btn" onclick="deleteStory('${story.id}')">🗑️ حذف</button>
                    ` : ""}
                </div>
            </article>
        `;
    }).join("");
}

// ======================================================
// إضافة قصة
// ======================================================

function openAddStory() {
    if (!currentUser) {
        openAuth();
        showToast("🔐", "تسجيل الدخول مطلوب", "سجل الدخول أولًا لإضافة قصة.");
        return;
    }

    editingStoryId = null;
    document.getElementById("storyModalTitle").textContent = "✨ إضافة قصة جديدة";
    document.getElementById("titleInput").value = "";
    document.getElementById("textInput").value = "";
    document.getElementById("saveStoryBtn").textContent = "💾 حفظ القصة";
    document.getElementById("storyModal").classList.remove("hidden");
}

// ======================================================
// تعديل قصة
// ======================================================

function editStory(id) {
    if (!currentUser) return;

    const story = stories.find(s => s.id === id);
    if (!story) return;

    if (story.userId !== currentUser.uid) {
        showToast("❌", "غير مسموح", "هذه القصة ليست ملكًا لك.");
        return;
    }

    editingStoryId = id;
    document.getElementById("storyModalTitle").textContent = "✏️ تعديل القصة";
    document.getElementById("titleInput").value = story.title || "";
    document.getElementById("textInput").value = story.text || "";
    document.getElementById("saveStoryBtn").textContent = "💾 حفظ التعديل";
    document.getElementById("storyModal").classList.remove("hidden");
}

// ======================================================
// حفظ القصة
// ======================================================

async function saveStory() {
    if (!currentUser) {
        openAuth();
        return;
    }

    const title = document.getElementById("titleInput").value.trim();
    const text = document.getElementById("textInput").value.trim();

    if (!title) {
        showToast("⚠️", "العنوان مطلوب", "اكتب عنوان القصة.");
        return;
    }

    if (!text) {
        showToast("⚠️", "النص مطلوب", "اكتب نص القصة.");
        return;
    }

    const button = document.getElementById("saveStoryBtn");
    button.disabled = true;
    button.textContent = "⏳ جاري الحفظ...";

    try {
        if (editingStoryId) {
            const story = stories.find(s => s.id === editingStoryId);
            if (!story) throw new Error("القصة غير موجودة.");
            if (story.userId !== currentUser.uid) throw new Error("لا يمكنك تعديل هذه القصة.");

            await db.collection("stories").doc(editingStoryId).update({
                title: title,
                text: text,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });

            showToast("✅", "تم تعديل القصة", "تم حفظ التعديلات بنجاح.");
        } else {
            await db.collection("stories").add({
                title: title,
                text: text,
                userId: currentUser.uid,
                authorName: getUserName(),
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });

            showToast("🎉", "تم حفظ القصة", "تم نشر قصتك بنجاح.");
        }

        closeStoryModal();
        await loadStories();
    } catch (error) {
        console.error(error);
        showToast("❌", "تعذر حفظ القصة", error.message || "تأكد من قواعد Firestore.");
    } finally {
        button.disabled = false;
        button.textContent = editingStoryId ? "💾 حفظ التعديل" : "💾 حفظ القصة";
    }
}

// ======================================================
// حذف
// ======================================================

function deleteStory(id) {
    if (!currentUser) {
        openAuth();
        return;
    }

    const story = stories.find(s => s.id === id);
    if (!story) return;

    if (story.userId !== currentUser.uid) {
        showToast("❌", "غير مسموح", "لا يمكنك حذف هذه القصة.");
        return;
    }

    storyToDelete = story;
    document.getElementById("deleteStoryName").textContent = `« ${story.title} »`;
    document.getElementById("deleteModal").classList.remove("hidden");
}

async function confirmDelete() {
    if (!storyToDelete) return;

    const story = storyToDelete;
    if (!currentUser || story.userId !== currentUser.uid) {
        closeDeleteModal();
        return;
    }

    const button = document.getElementById("confirmDeleteBtn");
    button.disabled = true;
    button.textContent = "⏳ جاري الحذف...";

    try {
        await db.collection("stories").doc(story.id).delete();
        stories = stories.filter(s => s.id !== story.id);

        closeDeleteModal();
        renderStories();
        showToast("✅", "تم حذف القصة", `تم حذف «${story.title}» بنجاح.`);
    } catch (error) {
        console.error(error);
        showToast("❌", "تعذر الحذف", "حدث خطأ أثناء حذف القصة.");
    } finally {
        button.disabled = false;
        button.textContent = "🗑️ حذف القصة";
    }
}

function closeDeleteModal() {
    storyToDelete = null;
    document.getElementById("deleteModal").classList.add("hidden");
}

// ======================================================
// Reader
// ======================================================

function openStory(id) {
    const story = stories.find(s => s.id === id);
    if (!story) return;

    currentStoryId = id;
    document.getElementById("readerTitle").textContent = "📖 " + story.title;
    document.getElementById("readerAuthor").textContent = "✍️️ كتبها: " + (story.authorName || "كاتب مجهول");
    document.getElementById("readerText").textContent = story.text;
    document.getElementById("readerModal").classList.remove("hidden");
}

function closeReader() {
    stopSpeaking();
    document.getElementById("readerModal").classList.add("hidden");
}

// ======================================================
// القراءة الصوتية
// ======================================================

function speakStory() {
    if (!("speechSynthesis" in window)) {
        showToast("❌", "الصوت غير متاح", "متصفحك لا يدعم القراءة الصوتية.");
        return;
    }

    const story = stories.find(s => s.id === currentStoryId);
    if (!story) return;

    stopSpeaking();
    const utterance = new SpeechSynthesisUtterance(story.text);
    utterance.lang = "ar-SA";
    utterance.rate = 0.85;
    utterance.pitch = 1;

    speechSynthesis.speak(utterance);
}

function stopSpeaking() {
    if ("speechSynthesis" in window) {
        speechSynthesis.cancel();
    }
}

// ======================================================
// مشاركة
// ======================================================

async function shareStory() {
    const story = stories.find(s => s.id === currentStoryId);
    if (!story) return;

    const text = `${story.title}\n\n${story.text}\n\n✍️ كتبها: ${story.authorName || "كاتب مجهول"}`;

    if (navigator.share) {
        try {
            await navigator.share({ title: story.title, text: text });
        } catch (e) {}
        return;
    }

    try {
        await navigator.clipboard.writeText(text);
        showToast("✅", "تم النسخ", "تم نسخ القصة إلى الحافظة.");
    } catch (e) {
        alert(text);
    }
}

function closeStoryModal() {
    editingStoryId = null;
    document.getElementById("storyModal").classList.add("hidden");
}

// ======================================================
// DARK MODE
// ======================================================

function loadTheme() {
    const theme = localStorage.getItem("kids_stories_theme");
    const button = document.getElementById("themeBtn");

    if (theme === "dark") {
        document.body.classList.add("dark");
        if (button) button.textContent = "☀️";
    }
}

function toggleTheme() {
    document.body.classList.toggle("dark");
    const dark = document.body.classList.contains("dark");

    localStorage.setItem("kids_stories_theme", dark ? "dark" : "light");
    document.getElementById("themeBtn").textContent = dark ? "☀️" : "🌙";
}

// ======================================================
// الصفحات السفلية
// ======================================================

function setInfoPage(title, content) {
    const main = document.getElementById("mainContent");
    if (!main) return;

    main.innerHTML = `
        <section class="info-page">
            <div class="modal-header">
                <h2>${title}</h2>
                <button class="secondary-btn" onclick="showHomePage()">🏠 الرئيسية</button>
            </div>
            ${content}
        </section>
    `;
    window.scrollTo({ top: 0, behavior: "smooth" });
}

function showHomePage() {
    location.reload();
}

function showPrivacyPage() {
    setInfoPage(
        "🔒 سياسة الخصوصية",
        `
        <p>نحن في ${APP_NAME} نحترم خصوصية مستخدمينا ونحرص على حماية البيانات التي يتم تقديمها من خلال الموقع.</p>
        <h3>1. المعلومات التي نجمعها</h3>
        <p>يتم حفظ اسم المستخدم لإتاحة نشر القصص ومتابعة التعديلات الخاصة بها.</p>
        <h3>2. القصص والمحتوى</h3>
        <p>القصص التي يقوم المستخدم بنشرها يتم تخزينها في قاعدة بيانات الموقع حتى يمكن عرضها للمستخدمين.</p>
        <h3>3. التواصل معنا</h3>
        <a class="email-box" href="mailto:${CONTACT_EMAIL}">✉️ ${CONTACT_EMAIL}</a>
        `
    );
}

function showTermsPage() {
    setInfoPage(
        "📄 شروط الاستخدام",
        `
        <p>باستخدامك لموقع ${APP_NAME} فإنك توافق على الالتزام بالشروط التالية.</p>
        <h3>1. استخدام الموقع</h3>
        <p>يجب استخدام الموقع بطريقة قانونية ومحترمة وعدم محاولة تعطيل الموقع أو إساءة استخدام خدماته.</p>
        <h3>2. الحسابات</h3>
        <p>المستخدم مسؤول عن الحفاظ على سرية كلمة المرور واسم المستخدم الخاص به.</p>
        <h3>3. التواصل</h3>
        <a class="email-box" href="mailto:${CONTACT_EMAIL}">✉️ ${CONTACT_EMAIL}</a>
        `
    );
}

function showAboutPage() {
    setInfoPage(
        "ℹ️ من نحن",
        `
        <p>${APP_NAME} هو موقع مخصص لمحبي القصص والحكايات، ويهدف إلى توفير مساحة بسيطة وممتعة لقراءة القصص وكتابتها ومشاركتها.</p>
        <h3>🎯 هدفنا</h3>
        <p>تقديم تجربة سهلة وممتعة تساعد الأطفال والعائلات ومحبي الكتابة على الاستمتاع بعالم القصص والحكايات.</p>
        `
    );
}

function showContactPage() {
    setInfoPage(
        "✉️ تواصل معنا",
        `
        <p>إذا كان لديك استفسار أو اقتراح أو ملاحظة حول الموقع، يسعدنا التواصل معك.</p>
        <h3>📧 البريد الإلكتروني</h3>
        <a class="email-box" href="mailto:${CONTACT_EMAIL}">${CONTACT_EMAIL}</a>
        `
    );
}

// ======================================================
// Toast
// ======================================================

function showToast(icon, title, message) {
    const toast = document.getElementById("toast");
    if (!toast) return;

    document.getElementById("toastIcon").textContent = icon;
    document.getElementById("toastTitle").textContent = title;
    document.getElementById("toastMessage").textContent = message;

    toast.classList.remove("hidden");
    clearTimeout(toastTimer);

    toastTimer = setTimeout(() => {
        toast.classList.add("hidden");
    }, 4500);
}

function escapeHTML(text) {
    return String(text)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}
