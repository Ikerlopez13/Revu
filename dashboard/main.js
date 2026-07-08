document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const passwordInput = document.getElementById('password');
    const loginError = document.getElementById('login-error');
    const loginOverlay = document.getElementById('login-overlay');
    const dashboardContent = document.getElementById('dashboard-content');
    const logoutBtn = document.getElementById('logout-btn');

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
        loadStats();
        loadReviewStats();
    }

    // ===== Evolución de reseñas (snapshots diarios de Google Places) =====
    let reviewChart = null;
    let reviewData = {};   // slug -> [{t, rating, count, name}]

    document.getElementById('review-business-select')?.addEventListener('change', (e) => {
        renderReviewChart(e.target.value);
    });

    async function loadReviewStats() {
        try {
            const resp = await fetch(
                `${SUPABASE_URL}/rest/v1/revu_review_stats?select=place_slug,business_name,rating,review_count,captured_at&order=captured_at.asc&limit=10000`,
                { headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` } }
            );
            if (!resp.ok) throw new Error('HTTP ' + resp.status);
            const rows = await resp.json();

            reviewData = {};
            rows.forEach(r => {
                if (!reviewData[r.place_slug]) reviewData[r.place_slug] = [];
                reviewData[r.place_slug].push({
                    t: new Date(r.captured_at),
                    rating: r.rating,
                    count: r.review_count,
                    name: r.business_name || r.place_slug
                });
            });

            const select = document.getElementById('review-business-select');
            const slugs = Object.keys(reviewData).sort();
            if (slugs.length === 0) {
                document.getElementById('review-stats-empty').style.display = 'block';
                document.getElementById('reviews-chart').style.display = 'none';
                return;
            }
            select.innerHTML = slugs.map(s =>
                `<option value="${s}">${reviewData[s][reviewData[s].length - 1].name}</option>`
            ).join('');
            renderReviewChart(slugs.includes('latropa') ? 'latropa' : slugs[0]);
            if (slugs.includes('latropa')) select.value = 'latropa';
        } catch (err) {
            console.error('Error cargando evolución de reseñas', err);
            document.getElementById('review-stats-empty').style.display = 'block';
        }
    }

    function renderReviewChart(slug) {
        const serie = reviewData[slug] || [];
        if (serie.length === 0) return;

        const first = serie[0];
        const last = serie[serie.length - 1];
        const deltaCount = (last.count ?? 0) - (first.count ?? 0);
        const deltaRating = ((last.rating ?? 0) - (first.rating ?? 0)).toFixed(1);

        document.getElementById('review-delta').innerHTML = `
            <div><span style="font-size:1.6rem; font-weight:800;">${last.count ?? '—'}</span><br><span style="opacity:0.6; font-size:0.85rem;">reseñas ahora</span></div>
            <div><span style="font-size:1.6rem; font-weight:800; color:${deltaCount >= 0 ? '#16a34a' : '#e5484d'};">${deltaCount >= 0 ? '+' : ''}${deltaCount}</span><br><span style="opacity:0.6; font-size:0.85rem;">desde el Revu (${first.t.toLocaleDateString('es-ES')})</span></div>
            <div><span style="font-size:1.6rem; font-weight:800;">${last.rating ?? '—'} ★</span><br><span style="opacity:0.6; font-size:0.85rem;">nota actual (${deltaRating >= 0 ? '+' : ''}${deltaRating})</span></div>
        `;

        const labels = serie.map(p => p.t.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' }));
        const ctx = document.getElementById('reviews-chart').getContext('2d');
        if (reviewChart) reviewChart.destroy();
        reviewChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels,
                datasets: [
                    {
                        label: 'Nº de reseñas',
                        data: serie.map(p => p.count),
                        borderColor: '#111',
                        backgroundColor: 'rgba(17,17,17,0.06)',
                        fill: true,
                        tension: 0.3,
                        yAxisID: 'y'
                    },
                    {
                        label: 'Nota media',
                        data: serie.map(p => p.rating),
                        borderColor: '#facc15',
                        backgroundColor: 'transparent',
                        borderDash: [6, 4],
                        tension: 0.3,
                        yAxisID: 'y1'
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: { mode: 'index', intersect: false },
                scales: {
                    y: { position: 'left', title: { display: true, text: 'Reseñas' }, beginAtZero: false },
                    y1: { position: 'right', min: 1, max: 5, title: { display: true, text: 'Nota' }, grid: { drawOnChartArea: false } }
                }
            }
        });
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

});
