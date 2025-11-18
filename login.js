document.addEventListener("DOMContentLoaded", async () => {
  const loginForm = document.getElementById("loginForm");
  const roleSelect = document.getElementById("role");
  const adminFields = document.getElementById("adminFields");
  const studentFields = document.getElementById("studentFields");

  // Mostrar campos según rol
  if (roleSelect) {
    roleSelect.addEventListener("change", () => {
      adminFields.classList.add("hidden");
      studentFields.classList.add("hidden");
      if (roleSelect.value === "admin") adminFields.classList.remove("hidden");
      if (roleSelect.value === "student") studentFields.classList.remove("hidden");
    });
  }

  // Vlidacion
  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const role = roleSelect.value;

      let url = "";
      let body = new URLSearchParams();

      if (role === "admin") {
        const username = document.getElementById("adminUser").value;
        const password = document.getElementById("adminPass").value;

        url = "http://127.0.0.1:8000/auth/login/admin";
        body.append("username", username);
        body.append("password", password);

      } else if (role === "student") {
        const username = document.getElementById("studentId").value;
        const password = document.getElementById("studentCurp").value;

        url = "http://127.0.0.1:8000/auth/login/estudiante";
        body.append("username", username);
        body.append("password", password);

      } else {
        alert("Selecciona un rol");
        return;
      }

      try {
        const res = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded"
          },
          body: body
        });

        if (!res.ok) {
          alert("Credenciales incorrectas");
          return;
        }

        const data = await res.json();

        // Guardar token
        localStorage.setItem("token", data.access_token);
        localStorage.setItem("role", role);

        // Redirigir
        if (role === "admin") {
          window.location.href = "paneladmi.html";
        } else {
          window.location.href = "student.html";
        }

      } catch (err) {
        console.error(err);
        alert("Error conectando con el servidor");
      }
    });
  }
  const token = localStorage.getItem("token");

});