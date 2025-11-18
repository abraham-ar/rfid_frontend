// ---- VARIABLES GLOBALES ----
let credenciales = [];
let estudiantes = [];
let historial = [];

// ---- FUNCIONES ----
function logout() {
  localStorage.clear();
  window.location.href = "index.html";
}

async function renderHistorialEstudiante(numControl) {
  const tbody = document.querySelector("#tablaHistorialEstudiante tbody");
  if (!tbody) return;

  tbody.innerHTML = "";

  const token = localStorage.getItem("token");

  try {
    const res = await fetch(`http://127.0.0.1:8000/registros/estudiante/${numControl}`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      }
    });

    if (!res.ok) {
      console.error("Error al obtener historial:", res.status);
      tbody.innerHTML = `
        <tr><td colspan="2">No se pudo cargar el historial</td></tr>
      `;
      return;
    }

    const registros = await res.json();

    if (registros.length === 0) {
      tbody.innerHTML = `
        <tr><td colspan="2">Sin registros</td></tr>
      `;
      return;
    }

    registros.forEach(r => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${r.tipo}</td>
        <td>${r.fecha}</td>
      `;
      tbody.appendChild(tr);
    });

  } catch (err) {
    console.error("Error al conectar con el servidor:", err);
    tbody.innerHTML = `
      <tr><td colspan="2">Error de conexión</td></tr>
    `;
  }
}


// ---- LOGIN con validacion ----
document.addEventListener("DOMContentLoaded", async () => {
  const token = localStorage.getItem("token");

  const res = await fetch("http://127.0.0.1:8000/auth/me", {
    method: "GET",
    headers: { "Authorization": `Bearer ${token}` }
  });

  if (!res.ok) {
    alert("No se pudo obtener el perfil");
    return;
  }

  const user = await res.json();

  document.getElementById("studentName").textContent = user.sub;
  renderHistorialEstudiante(user.sub);
});
