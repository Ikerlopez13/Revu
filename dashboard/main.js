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
        const slug = document.getElementById('client-slug').value;
        const date = document.getElementById('client-date').value;

        const newClient = {
            id: currentClients.length + 1,
            name,
            type,
            payment,
            revus,
            slug,
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
        loadStats();
    }

    // ===== Estadísticas de clicks (Supabase) =====
    const SUPABASE_URL = 'https://mqlfptujypzofidvmjnb.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1xbGZwdHVqeXB6b2ZpZHZtam5iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAyMTI1NjksImV4cCI6MjA4NTc4ODU2OX0.mJvjuxTga1xx_TfwGnm0M9QfLFMLikjSP9Fw8DUBOD4';

    document.getElementById('refresh-stats-btn')?.addEventListener('click', loadStats);

    async function loadStats() {
        const tbody = document.getElementById('stats-tbody');
        try {
            const resp = await fetch(
                `${SUPABASE_URL}/rest/v1/revu_clicks?select=slug,created_at&order=created_at.desc&limit=10000`,
                { headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` } }
            );
            if (!resp.ok) throw new Error('HTTP ' + resp.status);
            const clicks = await resp.json();

            const now = new Date();
            const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
            const startWeek = now.getTime() - 7 * 24 * 3600 * 1000;

            let totToday = 0, totWeek = 0;
            const bySlug = {};
            clicks.forEach(c => {
                const t = new Date(c.created_at).getTime();
                const s = c.slug || '(desconocido)';
                if (!bySlug[s]) bySlug[s] = { today: 0, week: 0, total: 0, last: t };
                bySlug[s].total++;
                if (t > bySlug[s].last) bySlug[s].last = t;
                if (t >= startWeek) { bySlug[s].week++; totWeek++; }
                if (t >= startToday) { bySlug[s].today++; totToday++; }
            });

            document.getElementById('clicks-today').textContent = totToday;
            document.getElementById('clicks-week').textContent = totWeek;
            document.getElementById('clicks-total').textContent = clicks.length;

            const rows = Object.entries(bySlug).sort((a, b) => b[1].total - a[1].total);
            if (rows.length === 0) {
                tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; opacity:0.6;">Todavía no hay clicks registrados. En cuanto alguien use un enlace aparecerá aquí.</td></tr>';
                return;
            }
            tbody.innerHTML = rows.map(([slug, st]) => `
                <td><a href="https://revutags.com/${slug}" target="_blank">revutags.com/${slug}</a></td>
                <td>${st.today}</td>
                <td>${st.week}</td>
                <td style="font-weight:700;">${st.total}</td>
                <td>${new Date(st.last).toLocaleString('es-ES', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</td>
            `).map(r => `<tr>${r}</tr>`).join('');
        } catch (err) {
            console.error('Error cargando estadísticas', err);
            if (tbody) tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; color:#e5484d;">Error al cargar las estadísticas.</td></tr>';
        }
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
                <td><a href="https://revutags.com/${client.slug || ''}" target="_blank">/${client.slug || ''}</a></td>
                <td><span class="badge badge-${client.type}">${client.type === 'monthly' ? 'Mensual' : 'Pago Único'}</span></td>
                <td>${revenue.toFixed(2)}€</td>
                <td>${client.revus}</td>
                <td>${cost.toFixed(2)}€</td>
                <td style="color: ${profit >= 0 ? 'var(--success-color)' : 'var(--danger-color)'}; font-weight: 600;">${profit.toFixed(2)}€</td>
                <td>${client.date || 'N/A'}</td>
                <td><button class="btn btn-secondary btn-sm delete-btn" data-id="${client.id}" style="background-color: var(--danger-color); color: white;">Borrar</button></td>
            `;
            tbody.appendChild(row);
        });

        // Add delete listeners
        const deleteBtns = tbody.querySelectorAll('.delete-btn');
        deleteBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = parseInt(e.target.getAttribute('data-id'));
                currentClients = currentClients.filter(c => c.id !== id);
                renderData(currentClients);
            });
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
