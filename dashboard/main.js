document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const passwordInput = document.getElementById('password');
    const loginError = document.getElementById('login-error');
    const loginOverlay = document.getElementById('login-overlay');
    const dashboardContent = document.getElementById('dashboard-content');
    const logoutBtn = document.getElementById('logout-btn');
    const addClientForm = document.getElementById('add-client-form');
    const downloadJsonBtn = document.getElementById('download-json-btn');

    const COST_PER_REVU = 0.27;
    let currentClients = [];

    // Check if already authenticated in this session
    const savedPassword = sessionStorage.getItem('dashboard_password');
    if (savedPassword) {
        attemptLogin(savedPassword);
    }

    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const password = passwordInput.value;
        attemptLogin(password);
    });

    logoutBtn.addEventListener('click', () => {
        sessionStorage.removeItem('dashboard_password');
        loginOverlay.classList.remove('hidden');
        dashboardContent.classList.add('hidden');
        passwordInput.value = '';
    });

    addClientForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = document.getElementById('client-name').value;
        const type = document.getElementById('client-type').value;
        const payment = parseFloat(document.getElementById('client-payment').value);
        const revus = parseInt(document.getElementById('client-revus').value);
        const date = new Date().toISOString().split('T')[0];

        const newClient = {
            id: currentClients.length + 1,
            name,
            type,
            payment,
            revus,
            date
        };

        currentClients.push(newClient);
        renderData(currentClients);
        addClientForm.reset();
    });

    downloadJsonBtn.addEventListener('click', () => {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(currentClients, null, 2));
        const downloadAnchor = document.createElement('a');
        downloadAnchor.setAttribute("href",     dataStr);
        downloadAnchor.setAttribute("download", "clients.json");
        document.body.appendChild(downloadAnchor);
        downloadAnchor.click();
        downloadAnchor.remove();
    });

    async function attemptLogin(password) {
        try {
            const response = await fetch('/api/dashboard', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ password })
            });

            if (response.ok) {
                const data = await response.json();
                sessionStorage.setItem('dashboard_password', password);
                currentClients = data;
                showDashboard();
            } else {
                const errData = await response.json();
                loginError.textContent = errData.error || 'Contraseña incorrecta';
                sessionStorage.removeItem('dashboard_password');
            }
        } catch (error) {
            loginError.textContent = 'Error al conectar con el servidor';
        }
    }

    function showDashboard() {
        loginOverlay.classList.add('hidden');
        dashboardContent.classList.remove('hidden');
        renderData(currentClients);
    }

    function renderData(clients) {
        const tbody = document.getElementById('clients-tbody');
        tbody.innerHTML = '';

        let totalRevenue = 0;
        let totalCosts = 0;
        let totalRevus = 0;

        clients.forEach(client => {
            const revenue = client.payment;
            const cost = client.revus * COST_PER_REVU;
            const profit = revenue - cost;

            totalRevenue += revenue;
            totalCosts += cost;
            totalRevus += client.revus;

            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${client.name}</td>
                <td><span class="badge badge-${client.type}">${client.type === 'monthly' ? 'Mensual' : 'Pago Único'}</span></td>
                <td>${revenue.toFixed(2)}€</td>
                <td>${client.revus}</td>
                <td>${cost.toFixed(2)}€</td>
                <td style="color: ${profit >= 0 ? 'var(--success-color)' : 'var(--danger-color)'}; font-weight: 600;">${profit.toFixed(2)}€</td>
                <td>${client.date || 'N/A'}</td>
            `;
            tbody.appendChild(row);
        });

        const totalProfit = totalRevenue - totalCosts;

        // Update summary cards
        document.getElementById('total-revenue').textContent = `${totalRevenue.toFixed(2)}€`;
        document.getElementById('total-costs').textContent = `${totalCosts.toFixed(2)}€`;
        document.getElementById('total-profit').textContent = `${totalProfit.toFixed(2)}€`;
        document.getElementById('total-revus').textContent = totalRevus;
        
        // Style profit card
        const profitCard = document.querySelector('.metric-card.highlight');
        if (totalProfit >= 0) {
            profitCard.style.background = 'var(--accent-color)';
        } else {
            profitCard.style.background = 'var(--danger-color)';
        }
    }
});
