// Globální proměnné
let currentUser = null;
let currentOrders = [];
let map = null;
let selectedLocation = null;
let currentRegistrationEmail = null;

// API URL
const API_BASE = '/api';

// Inicializace aplikace
document.addEventListener('DOMContentLoaded', function() {
    // Kontrola přihlášeného uživatele
    checkCurrentUser();
    
    // Event listenery pro formuláře
    setupEventListeners();
    
    // Hamburger menu
    setupMobileMenu();
    
    // Kontrola URL parametrů pro email verifikaci
    checkEmailVerification();
});

// Nastavení event listenerů
function setupEventListeners() {
    // Přihlašovací formulář
    document.getElementById('loginForm').addEventListener('submit', handleLogin);
    
    // Admin přihlašovací formulář
    document.getElementById('adminLoginForm').addEventListener('submit', handleAdminLogin);
    
    // Registrační formulář
    document.getElementById('registerForm').addEventListener('submit', handleRegister);
    
    // Formulář pro vytvoření zakázky
    document.getElementById('orderForm').addEventListener('submit', handleCreateOrder);
    
    // Profil formulář
    document.getElementById('profileForm').addEventListener('submit', handleUpdateProfile);
    
    // Hodnocení formulář
    document.getElementById('ratingForm').addEventListener('submit', handleRating);
    
    // Star rating
    setupStarRating();
    
    // Zavření modálů při kliknutí mimo
    window.addEventListener('click', function(event) {
        if (event.target.classList.contains('modal')) {
            event.target.style.display = 'none';
        }
    });
}

// Mobilní menu
function setupMobileMenu() {
    const hamburger = document.getElementById('hamburger');
    const navMenu = document.getElementById('nav-menu');
    
    hamburger.addEventListener('click', function() {
        navMenu.classList.toggle('active');
    });
}

// Star rating setup
function setupStarRating() {
    const stars = document.querySelectorAll('.star');
    stars.forEach(star => {
        star.addEventListener('click', function() {
            const rating = this.getAttribute('data-rating');
            document.getElementById('ratingValue').value = rating;
            
            // Vizuální feedback
            stars.forEach((s, index) => {
                if (index < rating) {
                    s.style.color = '#ffd700';
                } else {
                    s.style.color = '#ddd';
                }
            });
        });
    });
}

// Kontrola email verifikace z URL
function checkEmailVerification() {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('verify');
    
    if (token) {
        verifyEmail(token);
    }
}

// Email verifikace
async function verifyEmail(token) {
    try {
        const response = await fetch(`${API_BASE}/verify-email/${token}`);
        const data = await response.json();
        
        if (response.ok) {
            showNotification('Email byl úspěšně ověřen! Nyní se můžete přihlásit.', 'success');
            // Vyčistit URL
            window.history.replaceState({}, document.title, window.location.pathname);
        } else {
            showNotification(data.error || 'Chyba při ověřování emailu', 'error');
        }
    } catch (error) {
        showNotification('Chyba při ověřování emailu', 'error');
    }
}

// Kontrola aktuálního uživatele
async function checkCurrentUser() {
    try {
        const response = await fetch(`${API_BASE}/current-user`);
        if (response.ok) {
            const data = await response.json();
            currentUser = data.user;
            showDashboard();
        } else {
            showHomePage();
        }
    } catch (error) {
        showHomePage();
    }
}

// Zobrazení domovské stránky
function showHomePage() {
    document.querySelector('main').style.display = 'block';
    document.getElementById('dashboard').classList.add('hidden');
}

// Zobrazení/skrytí modálů
function showModal(modalId) {
    document.getElementById(modalId).style.display = 'block';
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

// Přihlášení
function showLogin() {
    showModal('loginModal');
}

// Admin přihlášení
function showAdminLogin() {
    showModal('adminLoginModal');
}

// Registrace
function showRegister(role) {
    document.getElementById('registerRole').value = role;
    document.getElementById('registerTitle').textContent = 
        role === 'zakaznik' ? 'Registrace zákazníka' : 'Registrace brigádníka';
    
    // Zobrazení/skrytí specifických polí
    const brigadnikFields = document.getElementById('brigadnikFields');
    const zakaznikFields = document.getElementById('zakaznikFields');
    
    if (role === 'brigadnik') {
        brigadnikFields.classList.remove('hidden');
        zakaznikFields.classList.add('hidden');
        // Nastavit povinná pole pro brigádníky
        document.getElementById('registerDatumNarozeni').required = true;
    } else {
        brigadnikFields.classList.add('hidden');
        zakaznikFields.classList.remove('hidden');
        document.getElementById('registerDatumNarozeni').required = false;
    }
    
    showModal('registerModal');
}

// Toggle hesla
function togglePassword(inputId) {
    const input = document.getElementById(inputId);
    const icon = input.nextElementSibling.querySelector('i');
    
    if (input.type === 'password') {
        input.type = 'text';
        icon.classList.remove('fa-eye');
        icon.classList.add('fa-eye-slash');
    } else {
        input.type = 'password';
        icon.classList.remove('fa-eye-slash');
        icon.classList.add('fa-eye');
    }
}

// Zpracování přihlášení
async function handleLogin(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const data = Object.fromEntries(formData);
    
    try {
        const response = await fetch(`${API_BASE}/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        });
        
        const result = await response.json();
        
        if (response.ok) {
            currentUser = result.user;
            closeModal('loginModal');
            showDashboard();
            showNotification('Přihlášení úspěšné!', 'success');
        } else {
            showNotification(result.error, 'error');
        }
    } catch (error) {
        showNotification('Chyba při přihlašování', 'error');
    }
}

// Zpracování admin přihlášení
async function handleAdminLogin(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const data = Object.fromEntries(formData);
    
    try {
        const response = await fetch(`${API_BASE}/login-admin`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        });
        
        const result = await response.json();
        
        if (response.ok) {
            currentUser = result.user;
            closeModal('adminLoginModal');
            showDashboard();
            showNotification('Admin přihlášení úspěšné!', 'success');
        } else {
            showNotification(result.error, 'error');
        }
    } catch (error) {
        showNotification('Chyba při admin přihlašování', 'error');
    }
}

// Zpracování registrace
async function handleRegister(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const data = Object.fromEntries(formData);
    
    // Kontrola shody hesel
    if (data.password !== data.confirm_password) {
        showNotification('Hesla se neshodují', 'error');
        return;
    }
    
    // Zpracování checkboxů pro brigádníky
    if (data.role === 'brigadnik') {
        const naradiCheckboxes = document.querySelectorAll('input[name="naradi"]:checked');
        const volneDnyCheckboxes = document.querySelectorAll('input[name="volne_dny"]:checked');
        
        data.naradi = Array.from(naradiCheckboxes).map(cb => cb.value);
        data.volne_dny = Array.from(volneDnyCheckboxes).map(cb => cb.value);
        
        if (data.naradi.length === 0) {
            showNotification('Vyberte alespoň jedno nářadí', 'error');
            return;
        }
        
        if (data.volne_dny.length === 0) {
            showNotification('Vyberte alespoň jeden volný den', 'error');
            return;
        }
    }
    
    // Zpracování checkbox pro zákazníky
    if (data.role === 'zakaznik') {
        data.potrebuje_pomoc = document.getElementById('registerPotrebujePomoc').checked;
    }
    
    try {
        const response = await fetch(`${API_BASE}/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        });
        
        const result = await response.json();
        
        if (response.ok) {
            currentRegistrationEmail = data.email;
            closeModal('registerModal');
            showModal('emailVerificationModal');
            showNotification('Registrace úspěšná! Zkontrolujte svůj email.', 'success');
        } else {
            showNotification(result.error, 'error');
        }
    } catch (error) {
        showNotification('Chyba při registraci', 'error');
    }
}

// Znovu odeslat verifikační email
async function resendVerification() {
    if (!currentRegistrationEmail) {
        showNotification('Email pro opětovné odeslání není k dispozici', 'error');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/resend-verification`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email: currentRegistrationEmail })
        });
        
        const result = await response.json();
        
        if (response.ok) {
            showNotification('Verifikační email byl znovu odeslán', 'success');
        } else {
            showNotification(result.error, 'error');
        }
    } catch (error) {
        showNotification('Chyba při odesílání emailu', 'error');
    }
}

// Odhlášení
async function logout() {
    try {
        await fetch(`${API_BASE}/logout`, { method: 'POST' });
        currentUser = null;
        showHomePage();
        showNotification('Odhlášení úspěšné', 'success');
    } catch (error) {
        showNotification('Chyba při odhlašování', 'error');
    }
}

// Zobrazení dashboardu
function showDashboard() {
    document.querySelector('main').style.display = 'none';
    document.getElementById('dashboard').classList.remove('hidden');
    
    // Aktualizace informací o uživateli
    document.getElementById('userInfo').textContent = 
        `${currentUser.jmeno} ${currentUser.prijmeni} (${currentUser.role})`;
    
    // Zobrazení správného dashboardu podle role
    document.getElementById('customerDashboard').classList.add('hidden');
    document.getElementById('workerDashboard').classList.add('hidden');
    document.getElementById('adminDashboard').classList.add('hidden');
    
    if (currentUser.role === 'zakaznik') {
        document.getElementById('customerDashboard').classList.remove('hidden');
        loadCustomerOrders();
        
        // Zobrazit avatar pomocníka pokud je potřeba
        if (currentUser.potrebuje_pomoc) {
            showAvatarHelper('Vítejte! Jsem zde, abych vám pomohl s vytvořením zakázky. Klikněte na "Vytvořit novou zakázku" a já vás provedu celým procesem.');
        }
    } else if (currentUser.role === 'brigadnik') {
        document.getElementById('workerDashboard').classList.remove('hidden');
        loadWorkerOrders();
    } else if (currentUser.role === 'admin') {
        document.getElementById('adminDashboard').classList.remove('hidden');
        loadAdminData();
    }
}

// Avatar pomocník
function showAvatarHelper(message) {
    document.getElementById('avatarMessage').textContent = message;
    document.getElementById('avatarHelper').classList.remove('hidden');
}

function hideAvatar() {
    document.getElementById('avatarHelper').classList.add('hidden');
}

// Profil
function showProfile() {
    const profileContent = document.getElementById('profileContent');
    
    let html = `
        <div class="form-group">
            <label for="profileJmeno">Jméno:</label>
            <input type="text" id="profileJmeno" name="jmeno" value="${currentUser.jmeno}" required>
        </div>
        <div class="form-group">
            <label for="profilePrijmeni">Příjmení:</label>
            <input type="text" id="profilePrijmeni" name="prijmeni" value="${currentUser.prijmeni}" required>
        </div>
        <div class="form-group">
            <label for="profileTelefon">Telefon:</label>
            <input type="tel" id="profileTelefon" name="telefon" value="${currentUser.telefon}" required>
        </div>
    `;
    
    if (currentUser.role === 'brigadnik') {
        const naradi = currentUser.naradi ? JSON.parse(currentUser.naradi) : [];
        const volneDny = currentUser.volne_dny ? JSON.parse(currentUser.volne_dny) : [];
        
        html += `
            <div class="form-group">
                <label>Nářadí:</label>
                <div class="checkbox-group">
                    <label><input type="checkbox" name="naradi" value="sekacka" ${naradi.includes('sekacka') ? 'checked' : ''}> Sekačka</label>
                    <label><input type="checkbox" name="naradi" value="strihac" ${naradi.includes('strihac') ? 'checked' : ''}> Stříhač keřů</label>
                    <label><input type="checkbox" name="naradi" value="pila" ${naradi.includes('pila') ? 'checked' : ''}> Pila</label>
                    <label><input type="checkbox" name="naradi" value="lopata" ${naradi.includes('lopata') ? 'checked' : ''}> Lopata</label>
                    <label><input type="checkbox" name="naradi" value="hrabe" ${naradi.includes('hrabe') ? 'checked' : ''}> Hrábě</label>
                    <label><input type="checkbox" name="naradi" value="kos" ${naradi.includes('kos') ? 'checked' : ''}> Kosa</label>
                    <label><input type="checkbox" name="naradi" value="stetic" ${naradi.includes('stetic') ? 'checked' : ''}> Štětec/váleček</label>
                    <label><input type="checkbox" name="naradi" value="jine" ${naradi.includes('jine') ? 'checked' : ''}> Jiné</label>
                </div>
            </div>
            <div class="form-group">
                <label>Volné dny:</label>
                <div class="checkbox-group">
                    <label><input type="checkbox" name="volne_dny" value="pondeli" ${volneDny.includes('pondeli') ? 'checked' : ''}> Pondělí</label>
                    <label><input type="checkbox" name="volne_dny" value="utery" ${volneDny.includes('utery') ? 'checked' : ''}> Úterý</label>
                    <label><input type="checkbox" name="volne_dny" value="streda" ${volneDny.includes('streda') ? 'checked' : ''}> Středa</label>
                    <label><input type="checkbox" name="volne_dny" value="ctvrtek" ${volneDny.includes('ctvrtek') ? 'checked' : ''}> Čtvrtek</label>
                    <label><input type="checkbox" name="volne_dny" value="patek" ${volneDny.includes('patek') ? 'checked' : ''}> Pátek</label>
                    <label><input type="checkbox" name="volne_dny" value="sobota" ${volneDny.includes('sobota') ? 'checked' : ''}> Sobota</label>
                    <label><input type="checkbox" name="volne_dny" value="nedele" ${volneDny.includes('nedele') ? 'checked' : ''}> Neděle</label>
                </div>
            </div>
        `;
    }
    
    if (currentUser.role === 'zakaznik') {
        html += `
            <div class="form-group">
                <label class="checkbox-label">
                    <input type="checkbox" id="profilePotrebujePomoc" name="potrebuje_pomoc" ${currentUser.potrebuje_pomoc ? 'checked' : ''}>
                    Moc tomu nerozumím (aktivuje pomocníka)
                </label>
            </div>
        `;
    }
    
    profileContent.innerHTML = html;
    showModal('profileModal');
}

// Aktualizace profilu
async function handleUpdateProfile(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const data = Object.fromEntries(formData);
    
    // Zpracování checkboxů pro brigádníky
    if (currentUser.role === 'brigadnik') {
        const naradiCheckboxes = document.querySelectorAll('#profileModal input[name="naradi"]:checked');
        const volneDnyCheckboxes = document.querySelectorAll('#profileModal input[name="volne_dny"]:checked');
        
        data.naradi = Array.from(naradiCheckboxes).map(cb => cb.value);
        data.volne_dny = Array.from(volneDnyCheckboxes).map(cb => cb.value);
    }
    
    // Zpracování checkbox pro zákazníky
    if (currentUser.role === 'zakaznik') {
        data.potrebuje_pomoc = document.getElementById('profilePotrebujePomoc').checked;
    }
    
    try {
        const response = await fetch(`${API_BASE}/update-profile`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        });
        
        const result = await response.json();
        
        if (response.ok) {
            currentUser = result.user;
            closeModal('profileModal');
            showNotification('Profil aktualizován', 'success');
            // Aktualizovat zobrazení
            document.getElementById('userInfo').textContent = 
                `${currentUser.jmeno} ${currentUser.prijmeni} (${currentUser.role})`;
        } else {
            showNotification(result.error, 'error');
        }
    } catch (error) {
        showNotification('Chyba při aktualizaci profilu', 'error');
    }
}

// Mapa
function showMap() {
    showModal('mapModal');
    
    if (!map) {
        // Inicializace mapy
        map = L.map('map').setView([50.0755, 14.4378], 10); // Praha
        
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
        }).addTo(map);
        
        // Kliknutí na mapu
        map.on('click', function(e) {
            if (selectedLocation) {
                map.removeLayer(selectedLocation);
            }
            
            selectedLocation = L.marker([e.latlng.lat, e.latlng.lng]).addTo(map);
            
            // Reverse geocoding (simulace)
            document.getElementById('mapSearch').value = `${e.latlng.lat.toFixed(6)}, ${e.latlng.lng.toFixed(6)}`;
        });
    }
    
    setTimeout(() => {
        map.invalidateSize();
    }, 100);
}

function confirmLocation() {
    if (selectedLocation) {
        const latlng = selectedLocation.getLatLng();
        document.getElementById('orderAdresa').value = document.getElementById('mapSearch').value;
        
        // Uložit souřadnice (skryté inputy by se přidaly do formuláře)
        let latInput = document.getElementById('orderLatitude');
        let lngInput = document.getElementById('orderLongitude');
        
        if (!latInput) {
            latInput = document.createElement('input');
            latInput.type = 'hidden';
            latInput.id = 'orderLatitude';
            latInput.name = 'latitude';
            document.getElementById('orderForm').appendChild(latInput);
        }
        
        if (!lngInput) {
            lngInput = document.createElement('input');
            lngInput.type = 'hidden';
            lngInput.id = 'orderLongitude';
            lngInput.name = 'longitude';
            document.getElementById('orderForm').appendChild(lngInput);
        }
        
        latInput.value = latlng.lat;
        lngInput.value = latlng.lng;
        
        closeModal('mapModal');
        showNotification('Adresa vybrána', 'success');
    } else {
        showNotification('Vyberte prosím místo na mapě', 'error');
    }
}

// Vytvoření zakázky
async function handleCreateOrder(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    
    try {
        const response = await fetch(`${API_BASE}/orders`, {
            method: 'POST',
            body: formData
        });
        
        const result = await response.json();
        
        if (response.ok) {
            showNotification('Zakázka vytvořena! AI analyzuje obrázek a odhadne cenu.', 'success');
            event.target.reset();
            loadCustomerOrders();
            
            if (currentUser.potrebuje_pomoc) {
                showAvatarHelper('Skvělé! Vaše zakázka byla vytvořena. AI analyzoval obrázek a odhadl cenu. Nyní čekejte na brigádníka, který si vaši zakázku vybere.');
            }
        } else {
            showNotification(result.error, 'error');
        }
    } catch (error) {
        showNotification('Chyba při vytváření zakázky', 'error');
    }
}

// Načtení zakázek zákazníka
async function loadCustomerOrders() {
    try {
        const response = await fetch(`${API_BASE}/orders`);
        const orders = await response.json();
        
        const container = document.getElementById('customerOrders');
        container.innerHTML = '';
        
        if (orders.length === 0) {
            container.innerHTML = '<p>Zatím nemáte žádné zakázky.</p>';
            return;
        }
        
        orders.forEach(order => {
            const orderElement = createOrderElement(order, 'customer');
            container.appendChild(orderElement);
        });
    } catch (error) {
        showNotification('Chyba při načítání zakázek', 'error');
    }
}

// Načtení zakázek brigádníka
async function loadWorkerOrders() {
    try {
        const response = await fetch(`${API_BASE}/orders`);
        const orders = await response.json();
        
        const availableContainer = document.getElementById('availableOrders');
        const myContainer = document.getElementById('myOrders');
        
        availableContainer.innerHTML = '';
        myContainer.innerHTML = '';
        
        const availableOrders = orders.filter(order => order.status === 'open');
        const myOrders = orders.filter(order => order.worker_id === currentUser.id);
        
        if (availableOrders.length === 0) {
            availableContainer.innerHTML = '<p>Žádné dostupné zakázky.</p>';
        } else {
            availableOrders.forEach(order => {
                const orderElement = createOrderElement(order, 'available');
                availableContainer.appendChild(orderElement);
            });
        }
        
        if (myOrders.length === 0) {
            myContainer.innerHTML = '<p>Nemáte žádné přijaté zakázky.</p>';
        } else {
            myOrders.forEach(order => {
                const orderElement = createOrderElement(order, 'worker');
                myContainer.appendChild(orderElement);
            });
        }
    } catch (error) {
        showNotification('Chyba při načítání zakázek', 'error');
    }
}

// Načtení admin dat
async function loadAdminData() {
    try {
        // Statistiky
        const statsResponse = await fetch(`${API_BASE}/statistics`);
        const stats = await statsResponse.json();
        
        const statsContainer = document.getElementById('adminStats');
        statsContainer.innerHTML = `
            <div class="stat-card">
                <h4>Celkem zakázek</h4>
                <p class="stat-number">${stats.total_orders}</p>
            </div>
            <div class="stat-card">
                <h4>Dokončené zakázky</h4>
                <p class="stat-number">${stats.completed_orders}</p>
            </div>
            <div class="stat-card">
                <h4>Celkové tržby</h4>
                <p class="stat-number">${stats.total_revenue} Kč</p>
            </div>
            <div class="stat-card">
                <h4>Zákazníci</h4>
                <p class="stat-number">${stats.total_customers}</p>
            </div>
            <div class="stat-card">
                <h4>Brigádníci</h4>
                <p class="stat-number">${stats.approved_workers}/${stats.total_workers}</p>
            </div>
            <div class="stat-card">
                <h4>Úspěšnost</h4>
                <p class="stat-number">${stats.completion_rate.toFixed(1)}%</p>
            </div>
        `;
        
        // Brigádníci ke schválení
        const workersResponse = await fetch(`${API_BASE}/brigadnici`);
        const workers = await workersResponse.json();
        
        const pendingContainer = document.getElementById('pendingWorkers');
        const pendingWorkers = workers.filter(worker => !worker.is_approved);
        
        if (pendingWorkers.length === 0) {
            pendingContainer.innerHTML = '<p>Žádní brigádníci ke schválení.</p>';
        } else {
            pendingContainer.innerHTML = '';
            pendingWorkers.forEach(worker => {
                const workerElement = createWorkerElement(worker);
                pendingContainer.appendChild(workerElement);
            });
        }
        
        // Všichni uživatelé
        const usersResponse = await fetch(`${API_BASE}/users`);
        const users = await usersResponse.json();
        
        const usersContainer = document.getElementById('allUsers');
        usersContainer.innerHTML = '';
        users.forEach(user => {
            const userElement = createUserElement(user);
            usersContainer.appendChild(userElement);
        });
        
        // Všechny zakázky
        const ordersResponse = await fetch(`${API_BASE}/orders`);
        const orders = await ordersResponse.json();
        
        const ordersContainer = document.getElementById('allOrders');
        ordersContainer.innerHTML = '';
        orders.forEach(order => {
            const orderElement = createOrderElement(order, 'admin');
            ordersContainer.appendChild(orderElement);
        });
        
    } catch (error) {
        showNotification('Chyba při načítání admin dat', 'error');
    }
}

// Vytvoření elementu zakázky
function createOrderElement(order, type) {
    const div = document.createElement('div');
    div.className = 'order-card';
    
    const statusText = {
        'open': 'Otevřená',
        'taken': 'Přijatá',
        'completed': 'Dokončená',
        'paid': 'Zaplacená'
    };
    
    let actionsHtml = '';
    
    if (type === 'customer') {
        if (order.status === 'open') {
            actionsHtml = `<button class="btn-danger" onclick="deleteOrder(${order.id})">Zrušit</button>`;
        } else if (order.status === 'taken') {
            actionsHtml = `<button class="btn-primary" onclick="payOrder(${order.id}, 'partial')">Zaplatit zálohu (1/3)</button>`;
        } else if (order.status === 'completed') {
            actionsHtml = `
                <button class="btn-primary" onclick="payOrder(${order.id}, 'full')">Doplatit zbytek</button>
            `;
        } else if (order.status === 'paid') {
            actionsHtml = `<button class="btn-secondary" onclick="showRating(${order.id})">Hodnotit brigádníka</button>`;
        }
    } else if (type === 'available') {
        actionsHtml = `<button class="btn-primary" onclick="takeOrder(${order.id})">Přijmout zakázku</button>`;
    } else if (type === 'worker') {
        if (order.status === 'taken') {
            actionsHtml = `
                <button class="btn-primary" onclick="completeOrder(${order.id})">Dokončit</button>
                <button class="btn-secondary" onclick="updatePrice(${order.id})">Upravit cenu</button>
                <button class="btn-danger" onclick="cancelOrder(${order.id})">Zrušit</button>
            `;
        } else if (order.status === 'paid') {
            actionsHtml = `<button class="btn-secondary" onclick="showRating(${order.id})">Hodnotit zákazníka</button>`;
        }
    } else if (type === 'admin') {
        actionsHtml = `<button class="btn-danger" onclick="deleteOrder(${order.id})">Smazat</button>`;
    }
    
    div.innerHTML = `
        <h4>${order.title}</h4>
        <p><strong>Popis:</strong> ${order.description}</p>
        <p><strong>Adresa:</strong> ${order.adresa}</p>
        <p><strong>Stav:</strong> ${statusText[order.status]}</p>
        ${order.estimated_price ? `<p><strong>Odhadovaná cena:</strong> ${order.estimated_price} Kč</p>` : ''}
        ${order.final_price ? `<p><strong>Finální cena:</strong> ${order.final_price} Kč</p>` : ''}
        ${order.ai_analysis ? `<p><strong>AI analýza:</strong> ${order.ai_analysis}</p>` : ''}
        ${order.photo_filename ? `<img src="/uploads/${order.photo_filename}" alt="Foto zakázky" style="max-width: 200px;">` : ''}
        <p><strong>Vytvořeno:</strong> ${new Date(order.created_at).toLocaleString('cs-CZ')}</p>
        ${order.customer_name ? `<p><strong>Zákazník:</strong> ${order.customer_name}</p>` : ''}
        ${order.worker_name ? `<p><strong>Brigádník:</strong> ${order.worker_name}</p>` : ''}
        <div class="order-actions">
            ${actionsHtml}
        </div>
    `;
    
    return div;
}

// Vytvoření elementu brigádníka
function createWorkerElement(worker) {
    const div = document.createElement('div');
    div.className = 'user-card';
    
    const naradi = worker.naradi ? JSON.parse(worker.naradi) : [];
    const volneDny = worker.volne_dny ? JSON.parse(worker.volne_dny) : [];
    
    div.innerHTML = `
        <h4>${worker.jmeno} ${worker.prijmeni}</h4>
        <p><strong>Email:</strong> ${worker.email}</p>
        <p><strong>Telefon:</strong> ${worker.telefon}</p>
        <p><strong>Nářadí:</strong> ${naradi.join(', ')}</p>
        <p><strong>Volné dny:</strong> ${volneDny.join(', ')}</p>
        <p><strong>Datum narození:</strong> ${worker.datum_narozeni || 'Neuvedeno'}</p>
        <div class="user-actions">
            <button class="btn-primary" onclick="approveWorker(${worker.id})">Schválit</button>
            <button class="btn-danger" onclick="deleteUser(${worker.id})">Smazat</button>
        </div>
    `;
    
    return div;
}

// Vytvoření elementu uživatele
function createUserElement(user) {
    const div = document.createElement('div');
    div.className = 'user-card';
    
    div.innerHTML = `
        <h4>${user.jmeno} ${user.prijmeni}</h4>
        <p><strong>Email:</strong> ${user.email}</p>
        <p><strong>Role:</strong> ${user.role}</p>
        <p><strong>Ověřený email:</strong> ${user.email_verified ? 'Ano' : 'Ne'}</p>
        ${user.role === 'brigadnik' ? `<p><strong>Schválený:</strong> ${user.is_approved ? 'Ano' : 'Ne'}</p>` : ''}
        <div class="user-actions">
            ${user.id !== currentUser.id ? `<button class="btn-danger" onclick="deleteUser(${user.id})">Smazat</button>` : ''}
        </div>
    `;
    
    return div;
}

// Akce s zakázkami
async function takeOrder(orderId) {
    try {
        const response = await fetch(`${API_BASE}/orders/${orderId}/take`, {
            method: 'POST'
        });
        
        const result = await response.json();
        
        if (response.ok) {
            showNotification('Zakázka přijata!', 'success');
            loadWorkerOrders();
        } else {
            showNotification(result.error, 'error');
        }
    } catch (error) {
        showNotification('Chyba při přijímání zakázky', 'error');
    }
}

async function completeOrder(orderId) {
    const finalPrice = prompt('Zadejte finální cenu za práci (Kč):');
    if (!finalPrice) return;
    
    try {
        const response = await fetch(`${API_BASE}/orders/${orderId}/complete`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ final_price: parseFloat(finalPrice) })
        });
        
        const result = await response.json();
        
        if (response.ok) {
            showNotification('Zakázka dokončena!', 'success');
            loadWorkerOrders();
        } else {
            showNotification(result.error, 'error');
        }
    } catch (error) {
        showNotification('Chyba při dokončování zakázky', 'error');
    }
}

async function updatePrice(orderId) {
    const newPrice = prompt('Zadejte novou cenu (Kč):');
    if (!newPrice) return;
    
    try {
        const response = await fetch(`${API_BASE}/orders/${orderId}/update-price`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ price: parseFloat(newPrice) })
        });
        
        const result = await response.json();
        
        if (response.ok) {
            showNotification('Cena aktualizována!', 'success');
            loadWorkerOrders();
        } else {
            showNotification(result.error, 'error');
        }
    } catch (error) {
        showNotification('Chyba při aktualizaci ceny', 'error');
    }
}

async function cancelOrder(orderId) {
    if (!confirm('Opravdu chcete zrušit tuto zakázku?')) return;
    
    try {
        const response = await fetch(`${API_BASE}/orders/${orderId}/cancel`, {
            method: 'POST'
        });
        
        const result = await response.json();
        
        if (response.ok) {
            showNotification('Zakázka zrušena', 'success');
            if (currentUser.role === 'brigadnik') {
                loadWorkerOrders();
            } else {
                loadCustomerOrders();
            }
        } else {
            showNotification(result.error, 'error');
        }
    } catch (error) {
        showNotification('Chyba při rušení zakázky', 'error');
    }
}

async function payOrder(orderId, paymentType) {
    try {
        const response = await fetch(`${API_BASE}/orders/${orderId}/pay`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ payment_type: paymentType })
        });
        
        const result = await response.json();
        
        if (response.ok) {
            showNotification('Platba proběhla úspěšně!', 'success');
            loadCustomerOrders();
        } else {
            showNotification(result.error, 'error');
        }
    } catch (error) {
        showNotification('Chyba při platbě', 'error');
    }
}

async function deleteOrder(orderId) {
    if (!confirm('Opravdu chcete smazat tuto zakázku?')) return;
    
    try {
        const response = await fetch(`${API_BASE}/orders/${orderId}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            showNotification('Zakázka smazána', 'success');
            if (currentUser.role === 'admin') {
                loadAdminData();
            } else {
                loadCustomerOrders();
            }
        } else {
            const result = await response.json();
            showNotification(result.error, 'error');
        }
    } catch (error) {
        showNotification('Chyba při mazání zakázky', 'error');
    }
}

// Hodnocení
function showRating(orderId) {
    document.getElementById('ratingOrderId').value = orderId;
    showModal('ratingModal');
}

async function handleRating(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const data = Object.fromEntries(formData);
    
    try {
        const response = await fetch(`${API_BASE}/orders/${data.order_id}/rate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                rating: parseInt(data.rating),
                comment: data.comment
            })
        });
        
        const result = await response.json();
        
        if (response.ok) {
            showNotification('Hodnocení odesláno!', 'success');
            closeModal('ratingModal');
            event.target.reset();
        } else {
            showNotification(result.error, 'error');
        }
    } catch (error) {
        showNotification('Chyba při odesílání hodnocení', 'error');
    }
}

// Admin akce
async function approveWorker(workerId) {
    try {
        const response = await fetch(`${API_BASE}/approve-brigadnik/${workerId}`, {
            method: 'POST'
        });
        
        const result = await response.json();
        
        if (response.ok) {
            showNotification('Brigádník schválen!', 'success');
            loadAdminData();
        } else {
            showNotification(result.error, 'error');
        }
    } catch (error) {
        showNotification('Chyba při schvalování brigádníka', 'error');
    }
}

async function deleteUser(userId) {
    if (!confirm('Opravdu chcete smazat tohoto uživatele?')) return;
    
    try {
        const response = await fetch(`${API_BASE}/users/${userId}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            showNotification('Uživatel smazán', 'success');
            loadAdminData();
        } else {
            const result = await response.json();
            showNotification(result.error, 'error');
        }
    } catch (error) {
        showNotification('Chyba při mazání uživatele', 'error');
    }
}

// Notifikace
function showNotification(message, type = 'info') {
    const notification = document.getElementById('notification');
    const notificationText = document.getElementById('notificationText');
    
    notificationText.textContent = message;
    notification.className = `notification ${type}`;
    notification.classList.remove('hidden');
    
    // Automatické skrytí po 5 sekundách
    setTimeout(() => {
        hideNotification();
    }, 5000);
}

function hideNotification() {
    document.getElementById('notification').classList.add('hidden');
}



// Accessibility funkce pro seniory
function toggleLargeText() {
    document.body.classList.toggle('large-text');
    
    // Uložit nastavení do localStorage
    const isLargeText = document.body.classList.contains('large-text');
    localStorage.setItem('large-text', isLargeText);
    
    showNotification(isLargeText ? 'Velké písmo zapnuto' : 'Velké písmo vypnuto', 'success');
}

// Načtení accessibility nastavení při startu
function loadAccessibilitySettings() {
    const isLargeText = localStorage.getItem('large-text') === 'true';
    if (isLargeText) {
        document.body.classList.add('large-text');
    }
}

// Vylepšený avatar pomocník s kontextovými radami
function showContextualHelp(context) {
    const helpMessages = {
        'registration': 'Vyplňte všechna povinná pole. Heslo by mělo být silné - alespoň 8 znaků s čísly a písmeny.',
        'order_creation': 'Popište co nejpřesněji, co potřebujete udělat. Přidejte fotku - pomůže to brigádníkovi lépe pochopit práci.',
        'address_selection': 'Můžete zadat adresu ručně nebo kliknout na "Vybrat na mapě" pro přesnější umístění.',
        'photo_upload': 'Vyfotografujte místo, kde má být práce provedena. AI analyzuje obrázek a odhadne cenu.',
        'payment': 'Platíte bezpečně online. Nejprve 1/3 při přijetí zakázky, zbytek po dokončení.',
        'rating': 'Ohodnoťte brigádníka podle kvality práce. Pomůže to ostatním zákazníkům.'
    };
    
    const message = helpMessages[context] || 'Jsem zde, abych vám pomohl. Pokud máte otázky, neváhejte se zeptat!';
    showAvatarHelper(message);
}

// Rozšířené funkce pro avatar pomocníka
function showAvatarWithImage(message, avatarType = 'pomocnik') {
    const avatarHelper = document.getElementById('avatarHelper');
    const avatarIcon = document.getElementById('avatarIcon');
    const avatarMessage = document.getElementById('avatarMessage');
    
    // Změnit avatar podle typu práce
    const avatarImages = {
        'pomocnik': '/avatar-pomocnik.png',
        'sekani': '/avatar-sekani.png',
        'strihani': '/avatar-strihani.png',
        'natirani': '/avatar-natirani.png',
        'zahradni': '/avatar-zahradni.png'
    };
    
    if (avatarImages[avatarType]) {
        avatarIcon.innerHTML = `<img src="${avatarImages[avatarType]}" alt="Avatar ${avatarType}" style="width: 60px; height: 60px; border-radius: 50%;">`;
    } else {
        avatarIcon.innerHTML = '🤖';
    }
    
    avatarMessage.textContent = message;
    avatarHelper.classList.remove('hidden');
    
    // Automatické skrytí po 10 sekundách
    setTimeout(() => {
        hideAvatar();
    }, 10000);
}

// Detekce typu práce z popisu a zobrazení příslušného avatara
function detectWorkTypeAndShowAvatar(description) {
    const workTypes = {
        'sekani': ['sekání', 'sekat', 'tráva', 'trávník', 'sekačka'],
        'strihani': ['stříhání', 'stříhat', 'keř', 'keře', 'živý plot', 'stříhač'],
        'natirani': ['natírání', 'natírat', 'plot', 'barva', 'nátěr', 'štětec'],
        'zahradni': ['zahrada', 'květiny', 'rostliny', 'sadba', 'úprava']
    };
    
    const lowerDescription = description.toLowerCase();
    
    for (const [type, keywords] of Object.entries(workTypes)) {
        if (keywords.some(keyword => lowerDescription.includes(keyword))) {
            const messages = {
                'sekani': 'Vidím, že potřebujete posekat trávu! Nezapomeňte uvést velikost plochy a zda máte vlastní sekačku.',
                'strihani': 'Stříhání keřů je důležité pro jejich zdraví. Uveďte, jaké keře máte a jak vysoké jsou.',
                'natirani': 'Natírání plotu chrání dřevo před počasím. Specifikujte materiál plotu a preferovanou barvu.',
                'zahradni': 'Obecné zahradní práce mohou zahrnovat mnoho činností. Buďte co nejkonkrétnější v popisu.'
            };
            
            showAvatarWithImage(messages[type], type);
            return;
        }
    }
    
    // Výchozí zpráva
    showAvatarWithImage('Popište co nejpřesněji, jakou práci potřebujete. Pomůže mi to lépe vám poradit!');
}

// Accessibility tlačítko v navigaci
function addAccessibilityButton() {
    const navAuth = document.querySelector('.nav-auth');
    if (navAuth) {
        const accessibilityBtn = document.createElement('button');
        accessibilityBtn.className = 'btn-secondary';
        accessibilityBtn.innerHTML = '<i class="fas fa-text-height"></i> Aa';
        accessibilityBtn.title = 'Zvětšit písmo';
        accessibilityBtn.onclick = toggleLargeText;
        
        navAuth.insertBefore(accessibilityBtn, navAuth.firstChild);
    }
}

// Vylepšené formulářové funkce s pomocníkem
function enhanceFormWithHelper() {
    // Přidat event listenery pro kontextovou nápovědu
    const orderDescription = document.getElementById('orderDescription');
    if (orderDescription) {
        orderDescription.addEventListener('input', function() {
            if (currentUser && currentUser.potrebuje_pomoc && this.value.length > 10) {
                detectWorkTypeAndShowAvatar(this.value);
            }
        });
        
        orderDescription.addEventListener('focus', function() {
            if (currentUser && currentUser.potrebuje_pomoc) {
                showContextualHelp('order_creation');
            }
        });
    }
    
    const orderPhoto = document.getElementById('orderPhoto');
    if (orderPhoto) {
        orderPhoto.addEventListener('focus', function() {
            if (currentUser && currentUser.potrebuje_pomoc) {
                showContextualHelp('photo_upload');
            }
        });
    }
    
    const orderAdresa = document.getElementById('orderAdresa');
    if (orderAdresa) {
        orderAdresa.addEventListener('focus', function() {
            if (currentUser && currentUser.potrebuje_pomoc) {
                showContextualHelp('address_selection');
            }
        });
    }
}

// Keyboard navigation pro lepší přístupnost
function enhanceKeyboardNavigation() {
    // Escape key pro zavření modálů
    document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape') {
            // Zavřít všechny otevřené modály
            const modals = document.querySelectorAll('.modal');
            modals.forEach(modal => {
                if (modal.style.display === 'block') {
                    modal.style.display = 'none';
                }
            });
            
            // Skrýt avatar pomocníka
            hideAvatar();
        }
    });
    
    // Tab navigation pro formuláře
    const forms = document.querySelectorAll('form');
    forms.forEach(form => {
        const inputs = form.querySelectorAll('input, textarea, select, button');
        inputs.forEach((input, index) => {
            input.addEventListener('keydown', function(event) {
                if (event.key === 'Tab' && !event.shiftKey && index === inputs.length - 1) {
                    // Poslední element - focus na první
                    event.preventDefault();
                    inputs[0].focus();
                } else if (event.key === 'Tab' && event.shiftKey && index === 0) {
                    // První element s Shift+Tab - focus na poslední
                    event.preventDefault();
                    inputs[inputs.length - 1].focus();
                }
            });
        });
    });
}

// Hlasové pokyny (simulace)
function announceToScreenReader(message) {
    // Vytvoření skrytého elementu pro screen readery
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', 'polite');
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.style.position = 'absolute';
    announcement.style.left = '-10000px';
    announcement.style.width = '1px';
    announcement.style.height = '1px';
    announcement.style.overflow = 'hidden';
    
    document.body.appendChild(announcement);
    announcement.textContent = message;
    
    // Odstranit po 1 sekundě
    setTimeout(() => {
        document.body.removeChild(announcement);
    }, 1000);
}

// Rozšíření stávajících funkcí o accessibility
const originalShowNotification = showNotification;
showNotification = function(message, type = 'info') {
    originalShowNotification(message, type);
    announceToScreenReader(message);
};

const originalShowDashboard = showDashboard;
showDashboard = function() {
    originalShowDashboard();
    
    // Přidat kontextovou nápovědu pro nové uživatele
    if (currentUser && currentUser.potrebuje_pomoc) {
        setTimeout(() => {
            if (currentUser.role === 'zakaznik') {
                showContextualHelp('order_creation');
            }
        }, 2000);
    }
    
    // Vylepšit formuláře
    enhanceFormWithHelper();
};

// Inicializace accessibility funkcí
document.addEventListener('DOMContentLoaded', function() {
    loadAccessibilitySettings();
    addAccessibilityButton();
    enhanceKeyboardNavigation();
    
    // Přidat ARIA labely
    const buttons = document.querySelectorAll('button');
    buttons.forEach(button => {
        if (!button.getAttribute('aria-label') && button.textContent.trim()) {
            button.setAttribute('aria-label', button.textContent.trim());
        }
    });
    
    // Přidat role pro lepší přístupnost
    const nav = document.querySelector('.navbar');
    if (nav) nav.setAttribute('role', 'navigation');
    
    const main = document.querySelector('main');
    if (main) main.setAttribute('role', 'main');
    
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        modal.setAttribute('role', 'dialog');
        modal.setAttribute('aria-modal', 'true');
    });
});

// Rozšíření registračního formuláře o kontextovou nápovědu
const originalHandleRegister = handleRegister;
handleRegister = async function(event) {
    // Zobrazit nápovědu při registraci
    if (document.getElementById('registerPotrebujePomoc').checked) {
        showContextualHelp('registration');
    }
    
    return originalHandleRegister(event);
};

// Rozšíření vytváření zakázky o kontextovou nápovědu
const originalHandleCreateOrder = handleCreateOrder;
handleCreateOrder = async function(event) {
    const result = await originalHandleCreateOrder(event);
    
    // Zobrazit nápovědu po vytvoření zakázky
    if (currentUser && currentUser.potrebuje_pomoc) {
        setTimeout(() => {
            showAvatarHelper('Zakázka byla vytvořena! Nyní čekejte, až si ji některý brigádník vybere. Budete informováni emailem.');
        }, 2000);
    }
    
    return result;
};

// Funkce pro změnu velikosti písma postupně
function adjustFontSize(increase = true) {
    const currentSize = parseFloat(getComputedStyle(document.documentElement).fontSize);
    const newSize = increase ? currentSize + 2 : Math.max(currentSize - 2, 12);
    document.documentElement.style.fontSize = newSize + 'px';
    
    localStorage.setItem('font-size', newSize);
    showNotification(`Velikost písma ${increase ? 'zvětšena' : 'zmenšena'} na ${newSize}px`, 'success');
}

// Načtení uložené velikosti písma
function loadFontSize() {
    const savedSize = localStorage.getItem('font-size');
    if (savedSize) {
        document.documentElement.style.fontSize = savedSize + 'px';
    }
}

// Přidat do inicializace
document.addEventListener('DOMContentLoaded', function() {
    loadFontSize();
});

// High contrast mode toggle
function toggleHighContrast() {
    document.body.classList.toggle('high-contrast');
    const isHighContrast = document.body.classList.contains('high-contrast');
    localStorage.setItem('high-contrast', isHighContrast);
    showNotification(isHighContrast ? 'Vysoký kontrast zapnut' : 'Vysoký kontrast vypnut', 'success');
}

// Načtení high contrast nastavení
function loadHighContrastSettings() {
    const isHighContrast = localStorage.getItem('high-contrast') === 'true';
    if (isHighContrast) {
        document.body.classList.add('high-contrast');
    }
}

// Přidat do inicializace
const originalLoadAccessibilitySettings = loadAccessibilitySettings;
loadAccessibilitySettings = function() {
    originalLoadAccessibilitySettings();
    loadHighContrastSettings();
};

