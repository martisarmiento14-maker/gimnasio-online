// URL correcta del backend
const API_URL = "https://gimnasio-online-1.onrender.com";

document.addEventListener("DOMContentLoaded", () => {
    cargarAlumnos();
});

// CARGAR LISTA DE ALUMNOS
async function cargarAlumnos() {
    const cont = document.getElementById("listaAlumnos");
    cont.innerHTML = "<tr><td colspan='7'>Cargando...</td></tr>";

    try {
        const res = await fetch(`${API_URL}/alumnos`);
        const alumnos = await res.json();

        let html = "";

        alumnos.forEach(al => {
            const planes = obtenerPlanesTexto(al);

            const fecha = al.fecha_vencimiento 
                ? al.fecha_vencimiento.split("T")[0]
                : "-";

            html += `
                <tr>
                    <td>${al.nombre} ${al.apellido}</td>
                    <td>${al.dni || "-"}</td>
                    <td>${al.nivel || "-"}</td>
                    <td>${al.equipo || "-"}</td>
                    <td>${planes}</td>
                    <td>${fecha}</td>
                    <td>
                        <button class="btn-edit" onclick="editarAlumno(${al.id})">
                            Editar
                        </button>
                    </td>
                </tr>
            `;
        });

        cont.innerHTML = html;

    } catch (err) {
        console.error(err);
        cont.innerHTML = "<tr><td colspan='7'>Error al cargar alumnos</td></tr>";
    }
}

// Convierte los planes en texto legible
function obtenerPlanesTexto(al) {
    let p = [];

    if (al.plan_eg === 1) p.push("EG");
    if (al.plan_personalizado === 1) p.push("Pers.");
    if (al.plan_running === 1) p.push("Running");

    return p.length > 0 ? p.join(" + ") : "-";
}

// Redirigir a editar
function editarAlumno(id) {
    window.location.href = `form-alumno.html?id=${id}`;
}
