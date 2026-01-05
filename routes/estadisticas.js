const API_URL = "https://gimnasio-online-1.onrender.com";

let charts = {}; // guardar instancias

document.addEventListener("DOMContentLoaded", () => {
    const mesInput = document.getElementById("mes");

    // mes actual por defecto
    const hoy = new Date();
    mesInput.value = `${hoy.getFullYear()}-${String(hoy.getMonth()+1).padStart(2,"0")}`;

    cargarStats();
    mesInput.addEventListener("change", cargarStats);
});

async function cargarStats() {
    const mes = document.getElementById("mes").value;
    if (!mes) return;

    console.log("📅 Mes seleccionado:", mes);

    const res = await fetch(`${API_URL}/estadisticas?mes=${mes}`);
    const data = await res.json();

    console.log("📊 Datos recibidos:", data);

    // ===============================
    // 1️⃣ TOTAL ALUMNOS
    // ===============================
    const altas = Number(data.totalAlumnos.find(x => x.tipo === "alta")?.count || 0);
    const renov = Number(data.totalAlumnos.find(x => x.tipo === "renovacion")?.count || 0);

    crearGrafico("graficoAlumnos", "bar",
        ["Altas", "Renovaciones"],
        [altas, renov]
    );

    // ===============================
    // 2️⃣ PLANES
    // ===============================
    let planes = {
        "Plan EG": 0,
        "Personalizado": 0,
        "Running": 0,
        "Combo Pers + Run": 0,
        "Combo EG + Run": 0
    };

    data.planes.forEach(p => {
        if (p.plan_eg && p.plan_running) planes["Combo EG + Run"] += Number(p.total);
        else if (p.plan_personalizado && p.plan_running) planes["Combo Pers + Run"] += Number(p.total);
        else if (p.plan_eg) planes["Plan EG"] += Number(p.total);
        else if (p.plan_personalizado) planes["Personalizado"] += Number(p.total);
        else if (p.plan_running) planes["Running"] += Number(p.total);
    });

    crearGrafico("graficoPlanes", "pie",
        Object.keys(planes),
        Object.values(planes)
    );

    // ===============================
    // 3️⃣ EG por días
    // ===============================
    crearGrafico(
        "graficoEg",
        "bar",
        data.egDias.map(d => `${d.dias_eg_pers} días`),
        data.egDias.map(d => Number(d.count))
    );

    // ===============================
    // 4️⃣ PERSONALIZADO por días
    // ===============================
    crearGrafico(
        "graficoPers",
        "bar",
        data.persDias.map(d => `${d.dias_eg_pers} días`),
        data.persDias.map(d => Number(d.count))
    );

    // ===============================
    // 5️⃣ INGRESOS
    // ===============================
    const efectivo = Number(data.ingresos.find(i => i.metodo_pago === "efectivo")?.sum || 0);
    const transferencia = Number(data.ingresos.find(i => i.metodo_pago === "transferencia")?.sum || 0);

    crearGrafico("graficoIngresos", "doughnut",
        ["Efectivo", "Transferencia"],
        [efectivo, transferencia]
    );
}

// ===============================
// 🧠 FUNCIÓN ÚNICA PARA GRÁFICOS
// ===============================
function crearGrafico(id, tipo, labels, data) {
    const ctx = document.getElementById(id);
    if (!ctx) return;

    // destruir si existe
    if (charts[id]) charts[id].destroy();

    charts[id] = new Chart(ctx, {
        type: tipo,
        data: {
            labels,
            datasets: [{
                data,
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { display: true }
            }
        }
    });
}
