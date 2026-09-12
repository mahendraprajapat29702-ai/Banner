import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore, collection, addDoc, getDocs, query, where } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// REPLACE WITH YOUR FIREBASE CONFIG
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT.appspot.com",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// DOM Elements
const authView = document.getElementById('auth-view');
const appView = document.getElementById('app-view');
const loginForm = document.getElementById('login-form');
const signupForm = document.getElementById('signup-form');
const dashSection = document.getElementById('dashboard-section');
const genSection = document.getElementById('generator-section');

// UI Routing
document.getElementById('show-signup').onclick = (e) => { e.preventDefault(); loginForm.classList.remove('active'); signupForm.classList.add('active'); };
document.getElementById('show-login').onclick = (e) => { e.preventDefault(); signupForm.classList.remove('active'); loginForm.classList.add('active'); };
document.getElementById('nav-dashboard').onclick = () => { dashSection.classList.add('active'); genSection.classList.remove('active'); };
document.getElementById('nav-generator').onclick = () => { genSection.classList.add('active'); dashSection.classList.remove('active'); };
document.getElementById('create-new-btn').onclick = () => document.getElementById('nav-generator').click();

// Auth State Observer
onAuthStateChanged(auth, (user) => {
    if (user) {
        authView.classList.remove('active');
        appView.classList.add('active');
        document.getElementById('user-name-display').innerText = user.email.split('@')[0];
        loadUserPosters(user.uid);
    } else {
        appView.classList.remove('active');
        authView.classList.add('active');
    }
});

// Auth Handlers
loginForm.onsubmit = async (e) => {
    e.preventDefault();
    const btn = document.getElementById('login-btn');
    btn.innerText = 'Loading...';
    try {
        await signInWithEmailAndPassword(auth, document.getElementById('login-email').value, document.getElementById('login-password').value);
    } catch (error) {
        alert(error.message); // Replace with custom Toast in production
    }
    btn.innerText = 'Login';
};

signupForm.onsubmit = async (e) => {
    e.preventDefault();
    try {
        await createUserWithEmailAndPassword(auth, document.getElementById('signup-email').value, document.getElementById('signup-password').value);
    } catch (error) {
        alert(error.message);
    }
};

document.getElementById('logout-btn').onclick = () => signOut(auth);

// Poster Logic Hook (Wrap your existing logic here)
document.getElementById('generate-poster-btn').onclick = () => {
    // Port your existing HTML canvas/DOM manipulation logic here
    document.getElementById('preview-festival').innerText = document.getElementById('festival-input').value || 'Festival';
    document.getElementById('preview-name').innerText = document.getElementById('name-input').value || 'Your Name';
};

document.getElementById('save-poster-btn').onclick = async () => {
    const user = auth.currentUser;
    if (!user) return;
    
    // Save metadata to Firestore
    try {
        await addDoc(collection(db, "posters"), {
            userId: user.uid,
            festival: document.getElementById('festival-input').value,
            createdAt: new Date()
        });
        alert("Poster Saved to Dashboard!");
        document.getElementById('nav-dashboard').click();
        loadUserPosters(user.uid);
    } catch(e) {
        console.error("Error saving: ", e);
    }
};

async function loadUserPosters(uid) {
    const q = query(collection(db, "posters"), where("userId", "==", uid));
    const snapshot = await getDocs(q);
    const grid = document.getElementById('posters-grid');
    
    if(snapshot.empty) {
        grid.innerHTML = `<div class="empty-state"><p>No posters yet. Create one!</p></div>`;
        return;
    }
    
    grid.innerHTML = '';
    snapshot.forEach((doc) => {
        const data = doc.data();
        grid.innerHTML += `<div class="glass-card"><h4>${data.festival}</h4><p>${new Date(data.createdAt.seconds * 1000).toLocaleDateString()}</p></div>`;
    });
}
