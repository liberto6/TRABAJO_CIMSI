document.addEventListener("DOMContentLoaded", async () => {
    const tituloPagina = document.getElementById("tituloPagina");
    const cerrarSesionBtn = document.getElementById("cerrarSesion");
    const nuevoPedidoBtn = document.getElementById("nuevoPedido");
    const verPedidosBtn = document.getElementById("verPedidos");
    const gestionarEmpleadosBtn = document.getElementById("gestionarEmpleados");
    const añadirProductoBtn = document.getElementById("añadirProducto");
    const modificarProductoBtn = document.getElementById("modificarProducto");
    const contenido = document.getElementById("contenido");

    // Obtener el nombre del encargado
    try {
        const response = await fetch('/encargado/nombre');
        const data = await response.json();
        tituloPagina.textContent = response.ok && data.nombre
            ? `PDA - Encargado: ${data.nombre}`
            : "PDA - Encargado: No identificado";
    } catch (error) {
        console.error("Error al obtener el nombre del encargado:", error);
    }

    // Verificar ingredientes con stock bajo
    try {
        const response = await fetch('/encargado/stock-bajo');
        const ingredientes = await response.json();
        const alertaStock = document.getElementById("alertaStock");

        if (ingredientes.length > 0) {
            alertaStock.innerHTML = `
                <h4 style="color: white; text-align: center;">⚠️ ALERTA: Stock Bajo ⚠️</h4>
                ${ingredientes.map(ing => `
                    <p style="margin: 0; color: white;">
                        Ingrediente: <strong>${ing.nombre}</strong> - Stock actual: <strong>${ing.stock}</strong> (Mínimo: ${ing.stock_minimo})
                    </p>
                `).join("")}
            `;
            alertaStock.style.display = "block";
            alertaStock.style.backgroundColor = "#ff4d4f"; // Fondo rojo fuerte
            alertaStock.style.border = "1px solid #cc0000"; // Borde rojo oscuro
            alertaStock.style.padding = "10px";
            alertaStock.style.borderRadius = "8px";
        } else {
            alertaStock.innerHTML = `
                <p style="color: green; text-align: center;">✅ Todo está en orden. No hay alertas de stock.</p>
            `;
            alertaStock.style.display = "block";
            alertaStock.style.backgroundColor = "#d4edda"; // Fondo verde claro
            alertaStock.style.border = "1px solid #28a745"; // Borde verde
            alertaStock.style.padding = "10px";
            alertaStock.style.borderRadius = "8px";
        }
    } catch (error) {
        console.error("Error al verificar stock bajo:", error);
    }

    // Cerrar sesión
    cerrarSesionBtn.addEventListener("click", async () => {
        const confirmarCierre = confirm("¿Estás seguro de que deseas cerrar sesión?");
        if (confirmarCierre) {
            try {
                const response = await fetch('/auth/logout', { method: 'POST' });
                if (response.ok) {
                    alert("Sesión cerrada correctamente.");
                    window.location.href = '/';
                } else {
                    alert("Error al cerrar sesión. Inténtalo de nuevo.");
                }
            } catch (error) {
                console.error("Error al cerrar sesión:", error);
                alert("Se produjo un error al cerrar sesión.");
            }
        }
    });

    // Función para cargar productos
    async function cargarProductos() {
        try {
            const response = await fetch('/encargado/productos-completos');
            const productos = await response.json();

            const listaProductos = document.getElementById("listaProductos");
            if (productos.length) {
                listaProductos.innerHTML = productos.map(prod => `
                    <li>
                        <strong>${prod.nombre}</strong> - €${parseFloat(prod.precio).toFixed(2)}
                        <ul>${prod.ingredientes.map(ing => `<li>${ing.ingrediente} (${parseFloat(ing.cantidad).toFixed(2)})</li>`).join("")}</ul>
                    </li>
                `).join("");
            } else {
                listaProductos.innerHTML = "<p>No hay productos registrados.</p>";
            }
        } catch (error) {
            console.error("Error al cargar productos:", error);
        }
    }
    // Botón "Gestionar Inventario"
        const gestionarInventarioBtn = document.createElement("button");
        gestionarInventarioBtn.id = "gestionarInventario";
        gestionarInventarioBtn.className = "gestion";
        gestionarInventarioBtn.innerHTML = '<i class="fas fa-boxes"></i> Gestionar Inventario';

        // Insertar el botón en el menú
        const menuDerecha = document.querySelector(".menu-derecha");
        menuDerecha.appendChild(gestionarInventarioBtn);

        // Evento para redirigir a la página de gestión de inventario
        gestionarInventarioBtn.addEventListener("click", () => {
            window.location.href = "/encargado/gestion_inventario";
        });
        


    // Botón "Nuevo Pedido"
    nuevoPedidoBtn.addEventListener("click", async () => {
        try {
            const response = await fetch('/encargado/productos');
            const productos = await response.json();

            if (!productos.length) {
                contenido.innerHTML = "<p>No hay productos disponibles para realizar pedidos.</p>";
                return;
            }

            contenido.innerHTML = `
                <h3>Nuevo Pedido</h3>
                <div id="productos">
                    ${productos.map(producto => `
                        <button class="producto" data-id="${producto.id}" data-nombre="${producto.nombre}" data-precio="${producto.precio}">
                            ${producto.nombre} - €${parseFloat(producto.precio).toFixed(2)}
                        </button>
                    `).join("")}
                </div>
                <div id="comanda">
                    <h4>Comanda</h4>
                    <ul id="comandaLista"></ul>
                    <button id="finalizarPedido">Finalizar Pedido</button>
                </div>
            `;

            const botonesProducto = document.querySelectorAll(".producto");
            const comandaLista = document.getElementById("comandaLista");
            const finalizarPedidoBtn = document.getElementById("finalizarPedido");

            // Añadir productos a la comanda
            botonesProducto.forEach(boton => {
                boton.addEventListener("click", () => {
                    const id = boton.dataset.id;
                    const nombre = boton.dataset.nombre;
                    const precio = parseFloat(boton.dataset.precio);

                    const listItem = document.createElement("li");
                    listItem.textContent = `${nombre} - €${precio.toFixed(2)}`;
                    listItem.setAttribute("data-id", id);

                    const removeButton = document.createElement("button");
                    removeButton.textContent = "Quitar";
                    removeButton.style.marginLeft = "10px";

                    removeButton.addEventListener("click", () => {
                        listItem.remove();
                    });

                    listItem.appendChild(removeButton);
                    comandaLista.appendChild(listItem);
                });
            });

            finalizarPedidoBtn.addEventListener("click", async () => {
                const items = Array.from(comandaLista.children).map(item => ({
                    id_producto: parseInt(item.getAttribute("data-id")),
                    cantidad: 1
                }));

                if (!items.length) {
                    alert("No hay productos en la comanda.");
                    return;
                }

                try {
                    const response = await fetch('/encargado/procesar-pedido', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ productos: items }),
                    });

                    if (response.ok) {
                        alert("Pedido realizado correctamente.");
                        contenido.innerHTML = "<p>Pedido enviado con éxito.</p>";
                    } else {
                        const error = await response.json();
                        alert(`Error al procesar el pedido: ${error.message}`);
                    }
                } catch (error) {
                    console.error("Error al procesar el pedido:", error);
                }
            });
        } catch (error) {
            console.error("Error al cargar productos para el pedido:", error);
            contenido.innerHTML = "<p>Error al cargar los productos.</p>";
        }
    });
// Botón "Añadir Producto Nuevo"
document.getElementById("añadirProducto").addEventListener("click", async () => {
    try {
        // Obtener lista de ingredientes existentes
        const response = await fetch('/encargado/ingredientes');
        const ingredientesExistentes = await response.json();

        // Renderizar el formulario de añadir producto
        contenido.innerHTML = `
            <h3>Añadir Producto Nuevo</h3>
            <form id="formNuevoProducto">
                <label for="nombreProducto">Nombre del Producto:</label>
                <input type="text" id="nombreProducto" required>

                <label for="precioProducto">Precio (€):</label>
                <input type="number" id="precioProducto" step="0.01" required>

                <label>Ingredientes:</label>
                <div id="listaIngredientes">
                    <div class="ingrediente">
                        <select class="ingredienteExistente">
                            <option value="">-- Seleccionar Ingrediente Existente --</option>
                            ${ingredientesExistentes.map(ing => `
                                <option value="${ing.id_ingrediente}">${ing.nombre} (Stock: ${ing.stock})</option>
                            `).join("")}
                        </select>
                        <div class="nuevoIngredienteCampos" style="display: none;">
                            <input type="text" placeholder="Nombre del Ingrediente" class="nombreIngrediente">
                            <input type="number" placeholder="Stock Inicial" class="stockIngrediente" step="0.01">
                            <input type="number" placeholder="Stock Mínimo" class="stockMinimoIngrediente" step="0.01">
                        </div>
                        <input type="number" step="0.01" placeholder="Cantidad a usar" class="cantidadIngrediente">
                        <button type="button" class="eliminarIngrediente">Quitar</button>
                    </div>
                </div>
                <button type="button" id="agregarIngrediente">Añadir Ingrediente Nuevo</button>
                <button type="submit">Guardar Producto</button>
            </form>

            <div id="crearIngredienteContainer" style="margin-top: 20px; display: none;">
                <h4>Crear Nuevo Ingrediente</h4>
                <form id="formCrearIngrediente">
                    <label for="nuevoIngredienteNombre">Nombre:</label>
                    <input type="text" id="nuevoIngredienteNombre" required>
                    
                    <label for="nuevoIngredienteStock">Stock Inicial:</label>
                    <input type="number" id="nuevoIngredienteStock" step="0.01" required>

                    <label for="nuevoIngredienteStockMinimo">Stock Mínimo:</label>
                    <input type="number" id="nuevoIngredienteStockMinimo" step="0.01" required>

                    <button type="submit">Guardar Ingrediente</button>
                </form>
            </div>
        `;

        const listaIngredientes = document.getElementById("listaIngredientes");

        // Botón para añadir un nuevo ingrediente al formulario
        document.getElementById("agregarIngrediente").addEventListener("click", () => {
            const ingredienteDiv = document.createElement("div");
            ingredienteDiv.classList.add("ingrediente");

            ingredienteDiv.innerHTML = `
                <select class="ingredienteExistente">
                    <option value="">-- Seleccionar Ingrediente Existente --</option>
                    ${ingredientesExistentes.map(ing => `
                        <option value="${ing.id_ingrediente}">${ing.nombre} (Stock: ${ing.stock})</option>
                    `).join("")}
                </select>
                <div class="nuevoIngredienteCampos" style="display: none;">
                    <input type="text" placeholder="Nombre del Ingrediente" class="nombreIngrediente">
                    <input type="number" placeholder="Stock Inicial" class="stockIngrediente" step="0.01">
                    <input type="number" placeholder="Stock Mínimo" class="stockMinimoIngrediente" step="0.01">
                </div>
                <input type="number" step="0.01" placeholder="Cantidad a usar" class="cantidadIngrediente">
                <button type="button" class="eliminarIngrediente">Quitar</button>
            `;

            listaIngredientes.appendChild(ingredienteDiv);

            const selectIngrediente = ingredienteDiv.querySelector(".ingredienteExistente");
            const nuevoIngredienteCampos = ingredienteDiv.querySelector(".nuevoIngredienteCampos");

            // Cambiar entre campos dinámicamente según selección del ingrediente
            selectIngrediente.addEventListener("change", () => {
                if (selectIngrediente.value) {
                    nuevoIngredienteCampos.style.display = "none"; // Ocultar campos de nuevo ingrediente
                } else {
                    nuevoIngredienteCampos.style.display = "block"; // Mostrar campos de nuevo ingrediente
                }
            });

            // Botón para eliminar un ingrediente del formulario
            ingredienteDiv.querySelector(".eliminarIngrediente").addEventListener("click", () => {
                ingredienteDiv.remove();
            });
        });

        // Botón para mostrar formulario de crear nuevo ingrediente
        const crearIngredienteContainer = document.getElementById("crearIngredienteContainer");
        document.getElementById("agregarIngrediente").insertAdjacentHTML(
            "afterend",
            '<button type="button" id="mostrarCrearIngrediente" style="margin-top: 10px;">Crear Nuevo Ingrediente</button>'
        );
        document.getElementById("mostrarCrearIngrediente").addEventListener("click", () => {
            crearIngredienteContainer.style.display =
                crearIngredienteContainer.style.display === "none" ? "block" : "none";
        });

        // Manejo del formulario de creación de nuevo ingrediente
        document.getElementById("formCrearIngrediente").addEventListener("submit", async (e) => {
            e.preventDefault();

            const nuevoIngredienteNombre = document.getElementById("nuevoIngredienteNombre").value;
            const nuevoIngredienteStock = parseFloat(document.getElementById("nuevoIngredienteStock").value);
            const nuevoIngredienteStockMinimo = parseFloat(document.getElementById("nuevoIngredienteStockMinimo").value);

            if (!nuevoIngredienteNombre || isNaN(nuevoIngredienteStock) || isNaN(nuevoIngredienteStockMinimo)) {
                alert("Por favor, completa todos los campos del nuevo ingrediente.");
                return;
            }

            try {
                const response = await fetch('/encargado/nuevo-ingrediente', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        nombre: nuevoIngredienteNombre,
                        stock: nuevoIngredienteStock,
                        stock_minimo: nuevoIngredienteStockMinimo,
                    }),
                });

                if (response.ok) {
                    alert("Ingrediente añadido correctamente.");
                    crearIngredienteContainer.style.display = "none"; // Ocultar formulario después de añadir
                } else {
                    const error = await response.json();
                    alert(`Error al guardar ingrediente: ${error.message}`);
                }
            } catch (error) {
                console.error("Error al guardar ingrediente:", error);
                alert("Error al guardar el ingrediente.");
            }
        });

        // Manejo del formulario de envío del producto
        document.getElementById("formNuevoProducto").addEventListener("submit", async (e) => {
            e.preventDefault();
        
            try {
                const nombre = document.getElementById("nombreProducto")?.value;
                const precio = parseFloat(document.getElementById("precioProducto")?.value);
        
                const ingredientes = Array.from(document.querySelectorAll(".ingrediente") || []).map((div) => {
                    const idIngrediente = div.querySelector(".ingredienteExistente")?.value;
                    const cantidad = parseFloat(div.querySelector(".cantidadIngrediente")?.value);
        
                    return {
                        id_ingrediente: idIngrediente || null,
                        cantidad: cantidad || 0,
                    };
                });
        
                // Validar que al menos hay un ingrediente válido
                if (!ingredientes || ingredientes.length === 0) {
                    alert("Debes añadir al menos un ingrediente.");
                    return;
                }
        
                const response = await fetch("/encargado/nuevo-producto", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ nombre, precio, ingredientes }),
                });
        
                if (response.ok) {
                    alert("Producto añadido correctamente.");
                    cargarProductos();
                } else {
                    const error = await response.json();
                    alert(`Error al guardar producto: ${error.message}`);
                }
            } catch (error) {
                console.error("Error al guardar producto:", error);
                alert("Se produjo un error al intentar guardar el producto.");
            }
        });
        
        
    } catch (error) {
        console.error("Error al cargar ingredientes:", error);
    }
}); 


    // Botón "Ver Pedidos"
    verPedidosBtn.addEventListener("click", () => {
        contenido.innerHTML = `
            <h3>Ver Pedidos</h3>
            <label for="fechaPedido">Selecciona una fecha:</label>
            <input type="date" id="fechaPedido">
            <button id="filtrarPedidos">Filtrar</button>
            <div id="resultadosPedidos">
                <p>Selecciona una fecha para ver los pedidos.</p>
            </div>
        `;

        document.getElementById("filtrarPedidos").addEventListener("click", async () => {
            const fechaPedido = document.getElementById("fechaPedido").value;
            const resultadosPedidos = document.getElementById("resultadosPedidos");

            if (!fechaPedido) {
                resultadosPedidos.innerHTML = "<p>Por favor selecciona una fecha válida.</p>";
                return;
            }

            try {
                const response = await fetch(`/encargado/ver-pedidos?fecha=${fechaPedido}`);
                const pedidos = await response.json();

                if (Array.isArray(pedidos) && pedidos.length > 0) {
                    resultadosPedidos.innerHTML = `
                        <ul>
                            ${pedidos.map(pedido => `
                                <li>
                                    Pedido ID: ${pedido.id_pedido}, Fecha: ${pedido.fecha}, Total: €${parseFloat(pedido.total).toFixed(2)}
                                    <ul>
                                        ${(pedido.detalles || []).map(detalle => `
                                            <li>Producto: ${detalle.producto} - Cantidad: ${detalle.cantidad}</li>
                                        `).join("")}
                                    </ul>
                                </li>
                            `).join("")}
                        </ul>
                    `;
                } else {
                    resultadosPedidos.innerHTML = "<p>No hay pedidos registrados para la fecha seleccionada.</p>";
                }
            } catch (error) {
                console.error("Error al cargar los pedidos:", error);
                resultadosPedidos.innerHTML = "<p>Error al cargar los pedidos.</p>";
            }
        });
    });

    // Botón "Gestionar Empleados"
    gestionarEmpleadosBtn.addEventListener("click", () => {
        window.location.href = "/encargado/gestion_empleado.html";
    });

    // Botón "Modificar Productos"
// Modificar Producto
modificarProductoBtn.addEventListener("click", async () => {
    try {
        const response = await fetch('/encargado/productos-completos');
        const productos = await response.json();

        if (!response.ok || productos.length === 0) {
            contenido.innerHTML = "<p>No hay productos disponibles para modificar.</p>";
            return;
        }

        contenido.innerHTML = `
            <h3>Modificar Productos</h3>    
            
            <ul>
                ${productos.map(prod => `
                    <li>
                        <strong>${prod.nombre}</strong> - €${parseFloat(prod.precio).toFixed(2)}
                        <button class="editarProducto" data-id="${prod.id_producto}">Editar</button>
                        <button class="eliminarProducto" data-id="${prod.id_producto}">Eliminar</button>
                    </li>
                `).join("")}
            </ul>
        `;

        document.querySelectorAll('.editarProducto').forEach(boton => {
            boton.addEventListener("click", async () => {
                const idProducto = boton.getAttribute("data-id");
                mostrarFormularioModificarProducto(idProducto);
            });
        });

        document.querySelectorAll('.eliminarProducto').forEach(boton => {
            boton.addEventListener("click", async () => {
                const idProducto = boton.getAttribute("data-id");
                if (confirm("¿Estás seguro de que deseas eliminar este producto?")) {
                    try {
                        const response = await fetch(`/encargado/producto/${idProducto}`, { method: "DELETE" });
                        if (response.ok) {
                            alert("Producto eliminado correctamente.");
                            modificarProductoBtn.click();
                        } else {
                            const error = await response.json();
                            alert(`Error al eliminar producto: ${error.message}`);
                        }
                    } catch (error) {
                        console.error("Error al eliminar producto:", error);
                    }
                }
            });
        });
    } catch (error) {
        console.error("Error al cargar productos:", error);
        contenido.innerHTML = "<p>Error al cargar los productos disponibles.</p>";
    }
});

async function mostrarFormularioModificarProducto(idProducto) {
    try {
        const response = await fetch(`/encargado/producto/${idProducto}`);
        const { producto, ingredientes } = await response.json();

        contenido.innerHTML = `
    <h3>Modificar Producto: ${producto.nombre}</h3>
    <form id="formModificarProducto" data-id-producto="${producto.id_producto}">
        <label for="nombreProducto">Nombre del Producto:</label>
        <input type="text" id="nombreProducto" value="${producto.nombre}" required>

        <label for="precioProducto">Precio (€):</label>
        <input type="number" id="precioProducto" step="0.01" value="${parseFloat(producto.precio).toFixed(2)}" required>

        <label>Ingredientes:</label>
        <div id="listaIngredientes">
            ${ingredientes.map(ing => `
                <div class="ingrediente" data-id="${ing.id_ingrediente}">
                    <input type="text" value="${ing.nombre_ingrediente}" class="nombreIngrediente" required>
                    <input type="number" step="0.01" value="${ing.cantidad}" class="cantidadIngrediente" required>
                    <input type="number" step="0.01" value="${ing.stock}" class="stockIngrediente" required>
                    <input type="number" step="0.01" value="${ing.stock_minimo}" class="stockMinimoIngrediente" required>
                    <button type="button" class="guardarIngrediente">Guardar</button>
                    <button type="button" class="eliminarIngrediente">Eliminar</button>
                </div>
            `).join("")}
        </div>
        <button type="submit">Guardar Cambios</button>
    </form>
`;


document.querySelectorAll('.guardarIngrediente').forEach(boton => {
    boton.addEventListener('click', async () => {
        const ingredienteDiv = boton.parentElement;
        const idIngrediente = ingredienteDiv.getAttribute('data-id');
        const nombre = ingredienteDiv.querySelector('.nombreIngrediente').value;
        const cantidad = parseFloat(ingredienteDiv.querySelector('.cantidadIngrediente').value);
        const stock = parseFloat(ingredienteDiv.querySelector('.stockIngrediente').value);
        const stockMinimo = parseFloat(ingredienteDiv.querySelector('.stockMinimoIngrediente').value);

        // Validar que los datos son correctos
        if (!nombre || isNaN(cantidad) || isNaN(stock) || isNaN(stockMinimo)) {
            alert("Por favor, completa todos los campos del ingrediente correctamente.");
            return;
        }

        try {
            const response = await fetch(`/encargado/ingrediente/${idIngrediente}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nombre, cantidad, stock, stock_minimo: stockMinimo })
            });

            if (response.ok) {
                alert("Ingrediente actualizado correctamente.");
            } else {
                const error = await response.json();
                alert(`Error al guardar el ingrediente: ${error.message}`);
            }
        } catch (error) {
            console.error("Error al guardar el ingrediente:", error);
            alert("Error al guardar el ingrediente.");
        }
    });
});



        // Función para eliminar un ingrediente
        document.querySelectorAll('.eliminarIngrediente').forEach(boton => {
            boton.addEventListener('click', async (e) => {
                const ingredienteDiv = e.target.parentElement;
                const idIngrediente = ingredienteDiv.getAttribute('data-id');

                if (confirm('¿Estás seguro de eliminar este ingrediente?')) {
                    try {
                        const response = await fetch(`/encargado/ingrediente/${idIngrediente}`, { method: 'DELETE' });

                        if (response.ok) {
                            alert('Ingrediente eliminado correctamente.');
                            ingredienteDiv.remove();
                        } else {
                            const error = await response.json();
                            alert(`Error al eliminar ingrediente: ${error.message}`);
                        }
                    } catch (error) {
                        console.error('Error al eliminar ingrediente:', error);
                    }
                }
            });
        });
// Guardar cambios en el producto y sus ingredientes
document.getElementById('formModificarProducto').addEventListener('submit', async (e) => {
    e.preventDefault();

    const nombre = document.getElementById('nombreProducto').value;
    const precio = parseFloat(document.getElementById('precioProducto').value);
    const ingredientes = Array.from(document.querySelectorAll('.ingrediente')).map(div => ({
        id_ingrediente: div.getAttribute('data-id'),
        nombre: div.querySelector('.nombreIngrediente').value,
        cantidad: parseFloat(div.querySelector('.cantidadIngrediente').value),
        stock: parseFloat(div.querySelector('.stockIngrediente').value),
        stock_minimo: parseFloat(div.querySelector('.stockMinimoIngrediente').value),
    }));

    // Validar que los datos son correctos
    if (!nombre || isNaN(precio) || !ingredientes.length) {
        alert('Por favor, completa todos los campos del producto e ingredientes.');
        return;
    }

    try {
        const idProducto = document.getElementById('formModificarProducto').getAttribute('data-id-producto');
if (!idProducto || idProducto === 'null') {
    alert('ID del producto no válido. Actualización cancelada.');
    return;
}


        const response = await fetch(`/encargado/producto/${idProducto}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nombre, precio, ingredientes }),
        });

        if (response.ok) {
            alert('Producto actualizado correctamente.');
            modificarProductoBtn.click(); // Volver a la vista de productos
        } else {
            const error = await response.json();
            alert(`Error al actualizar producto: ${error.message}`);
        }
    } catch (error) {
        console.error('Error al actualizar producto:', error);
        alert('Hubo un error al intentar actualizar el producto.');
    }
});
} catch (error) {
    console.error("Error al cargar producto para modificar:", error);
}
}



    // Cargar productos al inicio
    cargarProductos();
});
