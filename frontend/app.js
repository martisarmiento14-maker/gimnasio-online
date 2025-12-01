document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("loginForm");
    const errorMensaje = document.getElementById("errorMensaje");

    if (!form) {
        console.error("No se encontró el formulario de login");
        return;
    }

    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        errorMensaje.textContent = "";

        const usuario = document.getElementById("usuario").value;
        const clave = document.getElementById("clave").value;

        try {
            const res = await fetch("https://gimnasio-backend-2.onrender.com/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ usuario, clave }),
            });

            const data = await res.json();

            if (!res.ok || data.error) {
                errorMensaje.textContent = data.error || "Usuario o contraseña incorrectos.";
                return;
            }

            alert("Login exitoso!");
            window.location.href = "dashboard.html";
        } catch (err) {
            console.error(err);
            errorMensaje.textContent = "No se pudo conectar con el servidor.";
        }
    });
});
