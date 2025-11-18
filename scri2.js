// ---- VARIABLES GLOBALES ----
let credenciales = [];
let estudiantes = [];
let historial = [];

// ---- FUNCIONES ----
function logout() {
  localStorage.clear();
  window.location.href = "index.html";
}

function showSection(id) {
  document.querySelectorAll(".section").forEach(s => s.classList.add("hidden"));
  document.getElementById(id).classList.remove("hidden");
}

async function renderHistorial() {
  const tbody = document.querySelector("#tablaHistorial tbody");
  if (!tbody) return;
  tbody.innerHTML = "";

  const token = localStorage.getItem("token");

  try {
    const res = await fetch("http://127.0.0.1:8000/registros", {
      method: "GET",
      headers: { "Authorization": `Bearer ${token}` }
    });

    if (!res.ok) throw new Error("Error al obtener historial");

    const historial = await res.json();

    historial.forEach(r => {

      const tr = document.createElement("tr");

      const nombreCompleto = `${r.nombre} ${r.apPaterno} ${r.apMaterno ?? ""}`.trim();

      const fecha = new Date(r.fecha).toLocaleString("es-MX", {
        dateStyle: "short",
        timeStyle: "short",
        hour12: false
      });

      tr.innerHTML = `
        <td>${nombreCompleto}</td>
        <td style="text-transform: capitalize;">${r.tipo}</td>
        <td>${fecha}</td>
      `;

      tbody.appendChild(tr);
    });

  } catch (err) {
    console.error("Error al cargar historial:", err);
    alert("No se pudo cargar el historial");
  }
}


async function getCredencialesDisponibles() {
  const token = localStorage.getItem("token");

  const res = await fetch("http://127.0.0.1:8000/credencial", {
    method: "GET",
    headers: { "Authorization": `Bearer ${token}` }
  });

  if (!res.ok) throw new Error("Error al obtener credenciales");

  const todas = await res.json();

  // Filtrar: aceptadas y no usadas
  return todas.filter(c => c.aceptada === true && c.enUso === false);
}


// Renderizar credenciales con botones de acción
async function renderCredenciales() {
  const tbody = document.querySelector("#tablaCredenciales tbody");
  if (!tbody) return;
  tbody.innerHTML = "";

  const token = localStorage.getItem("token");

  const res = await fetch("http://127.0.0.1:8000/credencial", {
    method: "GET",
    headers: { "Authorization": `Bearer ${token}` }
  });

  if (!res.ok) throw new Error("Error al obtener credenciales");

  credenciales = await res.json();

  // Renderizar tabla correctamente
  credenciales.forEach((c, index) => {
    const tr = document.createElement("tr");

    // Determinar estado textual
    let estado = "pendiente";
    let color = "black";

    if (c.aceptada && !c.enUso) {
      estado = "aceptada";
      color = "green";
    }
    if (c.aceptada && c.enUso) {
      estado = "en uso";
      color = "blue";
    }
    if (!c.aceptada) {
      estado = "pendiente";
      color = "orange";
    }

    // Determinar acciones
    const accionesHTML = (!c.aceptada)
      ? `
          <button class="aceptar" data-index="${index}">Aceptar</button>
          <button class="rechazar" data-index="${index}">Rechazar</button>
        `
      : `<em>Sin acciones</em>`;

    tr.innerHTML = `
      <td>${c.idCredencial}</td>
      <td style="color:${color}; text-transform:capitalize;">${estado}</td>
      <td>${c.enUso ? "Sí" : "No"}</td>
      <td>${accionesHTML}</td>
    `;

    tbody.appendChild(tr);
  });
}

// Renderizar estudiantes
async function renderEstudiantes() {

  const tbody = document.querySelector("#tablaEstudiantes tbody");
  if (!tbody) return;
  tbody.innerHTML = "";

  const token = localStorage.getItem("token");
  try {
    const response = await fetch("http://127.0.0.1:8000/estudiante", {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error("Error al obtener estudiantes");
    }

    estudiantes = await response.json();

    const credencialesDisponibles = await getCredencialesDisponibles();

    estudiantes.forEach(e => {
      const tr = document.createElement("tr");

      // Caso: estudiante NO tiene credencial
      let celdaCredencial;

      if (!e.idCredencial) {

        // Si no hay credenciales disponibles:
        if (credencialesDisponibles.length === 0) {
          celdaCredencial = `<td>No hay credenciales disponibles</td>`;
        } else {
          // Crear select dinámico
          const options = credencialesDisponibles
            .map(c => `<option value="${c.idCredencial}">${c.idCredencial}</option>`)
            .join("");

          celdaCredencial = `
            <td>
              <select id="select-${e.numControl}">
                ${options}
              </select>
              <button data-id="${e.numControl}" class="asignar-btn">Asignar</button>
            </td>
          `;
        }

      } else {
        // Estudiante ya tiene credencial
        celdaCredencial = `<td>${e.idCredencial}</td>`;
      }

      tr.innerHTML = `
        <td>${e.numControl}</td>
        <td>${e.nombre}</td>
        ${celdaCredencial}
      `;

      tbody.appendChild(tr);
    });

  } catch (err) {
    console.error("Error al obtener estudiantes:", err);
    alert("No se pudieron obtener los estudiantes");
    return;
  }
}

//EVENTO QUE ASIGNA CREDENCIAL A ESTUDIANTE
document.addEventListener("click", async (e) => {

  if (!e.target.classList.contains("asignar-btn")) return;

  const numControl = e.target.dataset.id;
  const select = document.getElementById(`select-${numControl}`);
  const idCredencial = select.value;

  const token = localStorage.getItem("token");

  try {
    const res = await fetch(`http://127.0.0.1:8000/estudiante/${numControl}/credencial`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({ idCredencial })
    });

    if (!res.ok) {
      const err = await res.json();
      alert(err.detail || "Error al asignar credencial");
      return;
    }

    alert("Credencial asignada correctamente");

    // Vuelve a cargar toda la lista
    renderEstudiantes();

  } catch (err) {
    console.error(err);
    alert("Error conectando con el servidor");
  }
});


// ---- LÓGICA PRINCIPAL ----
document.addEventListener("DOMContentLoaded", () => {

  // Aceptar o rechazar credenciales
const tablaCred = document.querySelector("#tablaCredenciales tbody");

if (tablaCred) {
  tablaCred.addEventListener("click", async (e) => {
    const index = e.target.dataset.index;
    if (index === undefined) return;

    const cred = credenciales[index];
    if (!cred) return;

    const token = localStorage.getItem("token");

    // Aceptar credencial
    if (e.target.classList.contains("aceptar")) {
      try {
        const res = await fetch(`http://127.0.0.1:8000/credencial/`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify({
            idCredencial: cred.idCredencial,
            aceptada: true,
            enUso: false  // Al aceptar no la ponemos en uso todavía
          })
        });

        if (!res.ok) throw new Error("Error al aceptar credencial");

        alert(`Credencial ${cred.idCredencial} aceptada correctamente.`);

        // Actualizar local
        cred.aceptada = true;
        cred.enUso = false;

        renderCredenciales();

      } catch (err) {
        console.error(err);
        alert("No se pudo aceptar la credencial");
      }
    }

    // Rechazar credencial
    if (e.target.classList.contains("rechazar")) {
      try {
        const res = await fetch(`http://127.0.0.1:8000/credencial/`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify({
            idCredencial: cred.idCredencial,
            aceptada: false,
            enUso: false
          })
        });

        if (!res.ok) throw new Error("Error al rechazar credencial");

        alert(`Credencial ${cred.idCredencial} rechazada.`);

        // Actualizar local
        cred.aceptada = false;
        cred.enUso = false;

        renderCredenciales();

      } catch (err) {
        console.error(err);
        alert("No se pudo rechazar la credencial");
      }
    }
  });
}


  // Registro de estudiantes
  const formEst = document.getElementById("formEstudiante");
  if (formEst) {
    formEst.addEventListener("submit", async e => {
      e.preventDefault();

      const nuevoEstudiante = {
        numControl: document.getElementById("numControl").value.trim(),
        CURP: document.getElementById("CURP").value.trim(),
        nombre: document.getElementById("nombre").value.trim(),
        apPaterno: document.getElementById("apPaterno").value.trim(),
        apMaterno: document.getElementById("apMaterno").value.trim(),
        semestre: document.getElementById("semestre").value.trim(),
        carrera: document.getElementById("carrera").value.trim(),
      };

      try {
        const token = localStorage.getItem("token");

        const response = await fetch("http://127.0.0.1:8000/estudiante", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify(nuevoEstudiante),
        });

        if (!response.ok) {
          const error = await response.json();
          alert("Error: " + error.detail);
          return;
        }

        const estudianteCreado = await response.json();

        renderEstudiantes();
        renderCredenciales();

        formEst.reset();
        alert("Estudiante registrado.");

      } catch (err) {
        console.error("Error al registrar estudiante:", err);
        alert("Error de conexión con el servidor");
      }
    });
  }

  renderCredenciales();
  renderEstudiantes();
  renderHistorial();
});
