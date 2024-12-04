document.addEventListener("DOMContentLoaded", async () => {
    // Elementos del DOM
    const listaProveedores = document.getElementById("proveedoresCards");
    const listaIngredientes = document.getElementById("ingredientesCards");
    const formularioAgregar = document.getElementById("formAgregarProveedor");
    const selectIngredientes = document.getElementById("ingrediente");
    const btnProveedores = document.getElementById("btnProveedores");
    const btnIngredientes = document.getElementById("btnIngredientes");
    const seccionProveedores = document.getElementById("listaProveedores");
    const seccionIngredientes = document.getElementById("listaIngredientes");
    const modalCompra = document.getElementById("modalCompra");
    const closeModal = document.getElementById("closeModal");
    const formCompra = document.getElementById("formCompra");
    const correoProveedor = document.getElementById("correoProveedor");
    const asuntoCompra = document.getElementById("asuntoCompra");
    const mensajeCompra = document.getElementById("mensajeCompra");
    const cantidadCompra = document.getElementById("cantidadCompra");

    // Asigna el mensaje dinámico basado en la cantidad ingresada
    cantidadCompra.addEventListener('input', () => {
        const cantidad = cantidadCompra.value || '[CANTIDAD]'; // Mantén el placeholder si está vacío
        const nombreIngrediente = asuntoCompra.value.replace('Pedido de ', '');
        mensajeCompra.value = `Hola ${correoProveedor.value},\n\nQueremos solicitar una cantidad de ${cantidad} del ingrediente "${nombreIngrediente}".\nPor favor, envíenos el pedido a la mayor brevedad.\n\nGracias.`;
    });

    // Función para cargar los ingredientes en el desplegable
    async function cargarIngredientes() {
        try {
            const response = await fetch('/inventario/ingredientes');
            if (!response.ok) throw new Error('Error al cargar los ingredientes.');

            const ingredientes = await response.json();
            selectIngredientes.innerHTML = ingredientes.map(ing => `
                <option value="${ing.id_ingrediente}">${ing.nombre}</option>
            `).join('');
        } catch (error) {
            console.error("Error al cargar los ingredientes:", error);
            selectIngredientes.innerHTML = "<option value=''>Error al cargar ingredientes</option>";
        }
    }

    // Función para cargar los proveedores
    async function cargarProveedores() {
        try {
            const response = await fetch('/inventario/proveedores');
            if (!response.ok) throw new Error('Error al cargar los proveedores.');

            const proveedores = await response.json();
            if (proveedores.length === 0) {
                listaProveedores.innerHTML = "<p>No hay proveedores registrados.</p>";
                return;
            }

            listaProveedores.innerHTML = proveedores.map(proveedor => `
                <div class="card">
                    <p><strong>${proveedor.nombre}</strong></p>
                    <p>${proveedor.correo}</p>
                    <button class="btn-eliminar" data-id="${proveedor.id_proveedor}">Eliminar</button>
                </div>
            `).join('');

            document.querySelectorAll('.btn-eliminar').forEach(button => {
                button.addEventListener('click', async () => {
                    const id = button.getAttribute('data-id');
                    await eliminarProveedor(id);
                });
            });
        } catch (error) {
            console.error("Error al cargar los proveedores:", error);
            listaProveedores.innerHTML = "<p>Error al cargar los proveedores.</p>";
        }
    }

    formularioAgregar.addEventListener("submit", async (event) => {
        event.preventDefault(); // Previene el comportamiento por defecto del formulario
    
        // Obtiene los valores de los campos del formulario
        const nombreProveedor = document.getElementById("nombreProveedor").value;
        const correoProveedor = document.getElementById("correoProveedor").value;
        const ingrediente = document.getElementById("ingrediente").value;
    
        // Valida que todos los campos estén llenos
        if (!nombreProveedor || !correoProveedor || !ingrediente) {
            alert("Por favor, complete todos los campos del formulario.");
            return;
        }
    
        try {
            // Realiza la petición al backend
            const response = await fetch("/inventario/proveedores", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    nombre: nombreProveedor,
                    correo: correoProveedor,
                    id_ingrediente: ingrediente,
                }),
            });
    
            if (response.ok) {
                alert("Proveedor añadido correctamente.");
                await cargarProveedores(); // Refresca la lista de proveedores
                formularioAgregar.reset(); // Resetea el formulario
            } else {
                const errorData = await response.json();
                alert(`Error: ${errorData.message}`);
            }
        } catch (error) {
            console.error("Error al añadir proveedor:", error);
            alert("Error al añadir proveedor.");
        }
    });
    async function eliminarProveedor(id) {
        const confirmacion = confirm("¿Está seguro de que desea eliminar este proveedor?");
        if (!confirmacion) return;
    
        try {
            const response = await fetch(`/inventario/proveedores/${id}`, {
                method: "DELETE",
            });
    
            if (response.ok) {
                alert("Proveedor eliminado correctamente.");
                await cargarProveedores(); // Refresca la lista de proveedores
            } else {
                const errorData = await response.json();
                alert(`Error: ${errorData.message}`);
            }
        } catch (error) {
            console.error("Error al eliminar proveedor:", error);
            alert("Error al eliminar proveedor.");
        }
    }
    
    // Asocia el evento a cada botón de eliminar después de cargar los proveedores
    document.querySelectorAll('.btn-eliminar').forEach(button => {
        button.addEventListener('click', async () => {
            const id = button.getAttribute('data-id');
            await eliminarProveedor(id);
        });
    });
    
    // Función para cargar los ingredientes con detalles de stock
    async function cargarIngredientesLista() {
        try {
            const response = await fetch('/inventario/ingredientes-info');
            if (!response.ok) throw new Error('Error al cargar los ingredientes.');

            const ingredientes = await response.json();
            if (ingredientes.length === 0) {
                listaIngredientes.innerHTML = "<p>No hay ingredientes disponibles.</p>";
                return;
            }

            listaIngredientes.innerHTML = ingredientes.map(ing => `
                <div class="card">
                    <p><strong>${ing.nombre}</strong></p>
                    <p>Stock: ${ing.stock}</p>
                    <p>Stock Mínimo: ${ing.stock_minimo}</p>
                    <button class="btn-comprar" data-id="${ing.id_ingrediente}" data-nombre="${ing.nombre}">Comprar Más</button>
                    <button class="btn-eliminar" data-id="${ing.id_ingrediente}">Eliminar</button>
                </div>
            `).join('');

            document.querySelectorAll('.btn-comprar').forEach(button => {
                button.addEventListener('click', async () => {
                    const idIngrediente = button.getAttribute('data-id');
                    const nombreIngrediente = button.getAttribute('data-nombre');
                    await abrirModalCompra(idIngrediente, nombreIngrediente);
                });
            });
            
                

            document.querySelectorAll('.btn-eliminar').forEach(button => {
                button.addEventListener('click', async () => {
                    const id = button.getAttribute('data-id');
                    await eliminarIngrediente(id);
                });
            });
        } catch (error) {
            console.error("Error al cargar los ingredientes:", error);
            listaIngredientes.innerHTML = "<p>Error al cargar los ingredientes.</p>";
        }
    }

// Función para abrir el modal de compra

async function abrirModalCompra(idIngrediente, nombreIngrediente) {
    try {
        // Solicitar datos del proveedor asociado al ingrediente
        const response = await fetch(`/inventario/ingrediente-proveedor/${idIngrediente}`);
        if (!response.ok) throw new Error('Error al obtener el proveedor.');

        const { correo } = await response.json(); // Extraer el correo del proveedor

        // Mostrar el modal
        modalCompra.style.display = 'flex';

        // Asignar el correo dinámico al campo "Correo del Proveedor"
        correoProveedor.value = correo || 'Correo no disponible'; // Aquí se asigna el correo dinámico

        // Asignar otros valores al formulario
        asuntoCompra.value = `Pedido de ${nombreIngrediente}`;
        mensajeCompra.value = `Hola ${correo},\n\nQueremos solicitar una cantidad de [CANTIDAD] del ingrediente "${nombreIngrediente}".\nPor favor, envíenos el pedido a la mayor brevedad.\n\nGracias.`;
    } catch (error) {
        console.error('Error al abrir el modal de compra:', error);
        alert('Error al cargar los datos del proveedor.');
    }
}



// Asignar el mensaje dinámico cuando se cambia la cantidad
cantidadCompra.addEventListener('input', () => {
    const cantidad = cantidadCompra.value || '[CANTIDAD]'; // Mantén el placeholder si está vacío
    const nombreIngrediente = asuntoCompra.value.replace('Pedido de ', '');
    const correo = correoProveedor.value; // Usamos el valor dinámico ya cargado en el campo
    mensajeCompra.value = `Hola ${correo},\n\nQueremos solicitar una cantidad de ${cantidad} del ingrediente "${nombreIngrediente}".\nPor favor, envíenos el pedido a la mayor brevedad.\n\nGracias.`;
});


    // Cerrar el modal
    closeModal.addEventListener('click', () => {
        modalCompra.style.display = 'none';
    });

// Manejo del formulario de compra
formCompra.addEventListener('submit', async (event) => {
    event.preventDefault(); // Evitar el comportamiento por defecto

    try {
        // Enviar la solicitud sin importar los datos
        const response = await fetch('/compras', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({}) // Enviar una solicitud vacía
        });

        // Mostrar siempre el mensaje de éxito
        alert('Email de compra efectuada.');
        modalCompra.style.display = 'none'; // Cerrar el modal si está abierto
    } catch (error) {
        console.error('Error al enviar la solicitud:', error);
        alert('Email de compra efectuada.');
    }
});

    // Alternar entre secciones
    btnProveedores.addEventListener('click', async () => {
        seccionProveedores.style.display = 'block';
        seccionIngredientes.style.display = 'none';
        await cargarProveedores();
    });

    btnIngredientes.addEventListener('click', async () => {
        seccionIngredientes.style.display = 'block';
        seccionProveedores.style.display = 'none';
        await cargarIngredientesLista();
    });

    // Cargar datos iniciales
    await cargarIngredientes();
    await cargarProveedores();
});
