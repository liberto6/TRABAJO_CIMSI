document.addEventListener("DOMContentLoaded", () => {
    const volverEncargadoBtn = document.getElementById("volverEncargado");
    const proveedoresLista = document.getElementById("proveedoresLista");
    const ingredientesLista = document.getElementById("ingredientesLista");
    const modalProveedor = document.getElementById("modalProveedor");
    const modalCompra = document.getElementById("modalCompra");
    const nombreProveedorInput = document.getElementById("nombreProveedor");
    const correoProveedorInput = document.getElementById("correoProveedor");
    const cantidadCompraInput = document.getElementById("cantidadCompra");

    let proveedorSeleccionado = null;

    // Volver a la página del encargado
    volverEncargadoBtn.addEventListener("click", () => {
        window.location.href = "/encargado/encargado.html";
    });

    // Cargar lista de proveedores
    async function cargarProveedores() {
        try {
            const response = await fetch("/proveedores");
            const data = await response.json();

            if (!response.ok || data.length === 0) {
                proveedoresLista.innerHTML = "<p>No hay proveedores registrados.</p>";
                return;
            }

            proveedoresLista.innerHTML = data.map(proveedor => `
                <div class="card">
                    <h3>${proveedor.nombre}</h3>
                    <p><strong>Correo:</strong> ${proveedor.correo}</p>
                    <div class="card-actions">
                        <button class="btn editar-btn" data-id="${proveedor.id}">Editar</button>
                        <button class="btn eliminar-btn" data-id="${proveedor.id}">Eliminar</button>
                    </div>
                </div>
            `).join("");

            // Añadir eventos a los botones de editar y eliminar
            document.querySelectorAll(".editar-btn").forEach(btn => {
                btn.addEventListener("click", () => abrirModalProveedor(btn.dataset.id));
            });
            document.querySelectorAll(".eliminar-btn").forEach(btn => {
                btn.addEventListener("click", () => eliminarProveedor(btn.dataset.id));
            });
        } catch (error) {
            console.error("Error al cargar los proveedores:", error);
        }
    }

    // Abrir modal para editar proveedor
    function abrirModalProveedor(id) {
        proveedorSeleccionado = id;
        modalProveedor.classList.remove("hidden");
        // Si hay un id, estamos editando
        if (id) {
            const proveedor = { nombre: "Prueba", correo: "correo@example.com" }; // Cargar datos reales aquí
            nombreProveedorInput.value = proveedor.nombre;
            correoProveedorInput.value = proveedor.correo;
        } else {
            nombreProveedorInput.value = "";
            correoProveedorInput.value = "";
        }
    }

    // Cerrar modal
    modalProveedor.querySelector(".cancelar-btn").addEventListener("click", () => {
        modalProveedor.classList.add("hidden");
        proveedorSeleccionado = null;
    });

    cargarProveedores();
});
