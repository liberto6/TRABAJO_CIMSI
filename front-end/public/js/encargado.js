document.addEventListener("DOMContentLoaded", async () => {
    const tituloPagina = document.getElementById("tituloPagina");
    const cerrarSesionBtn = document.getElementById("cerrarSesion");
    const nuevoPedidoBtn = document.getElementById("nuevoPedido");
    const verPedidosBtn = document.getElementById("verPedidos");
    const gestionarEmpleadosBtn = document.getElementById("gestionarEmpleados");
    const modificarProductoBtn = document.getElementById("modificarProducto"); 
    const contenido = document.getElementById("contenido");

    // Obtener el nombre del encargado
    try {
        const response = await fetch('/encargado/nombre');
        const data = await response.json();

        if (response.ok) {
            tituloPagina.textContent = `PDA - Encargado: ${data.nombre}`;
        } else {
            tituloPagina.textContent = "PDA - Encargado: No identificado";
        }
    } catch (error) {
        console.error("Error al obtener el nombre del encargado:", error);
        tituloPagina.textContent = "PDA - Encargado: Error";
    }

    // Verificar ingredientes con stock bajo
    try {
        const response = await fetch('/encargado/stock-bajo');
        const ingredientes = await response.json();

        const alertaStock = document.getElementById("alertaStock");

        if (ingredientes.length > 0) {
            const alerta = ingredientes
                .map(
                    (ingrediente) =>
                        `<p>Ingrediente: <strong>${ingrediente.nombre}</strong>, Stock: ${ingrediente.stock}, Stock mínimo: ${ingrediente.stock_minimo}</p>`
                )
                .join("");

            alertaStock.innerHTML = `
                <div>
                    <h4>ALERTA DE STOCK BAJO:</h4>
                    ${alerta}
                </div>
            `;
            alertaStock.style.display = "block";
        } else {
            alertaStock.innerHTML = "<p>Todos los ingredientes están en niveles adecuados de stock.</p>";
            alertaStock.style.display = "block";
        }
    } catch (error) {
        console.error("Error al verificar el stock bajo:", error);
        const alertaStock = document.getElementById("alertaStock");
        alertaStock.innerHTML = "<p>Error al cargar los datos de stock.</p>";
        alertaStock.style.display = "block";
    }

    // Redirigir a la página de gestión de empleados
    gestionarEmpleadosBtn.addEventListener("click", () => {
        window.location.href = "/encargado/gestion_empleado.html";
    });

    // Lógica para cerrar sesión
    cerrarSesionBtn.addEventListener("click", async () => {
        try {
            const response = await fetch('/auth/logout', {
                method: 'POST',
                credentials: 'include',
            });

            if (response.ok) {
                alert("Sesión cerrada correctamente.");
                window.location.href = '/';
            } else {
                alert("Error al cerrar sesión.");
            }
        } catch (error) {
            console.error("Error al cerrar sesión:", error);
            alert("Error al cerrar sesión.");
        }
    });
// Mostrar formulario para Añadir Producto Nuevo
const añadirProductoBtn = document.getElementById("añadirProducto");

añadirProductoBtn.addEventListener("click", () => {
    contenido.innerHTML = `
        <h3>Añadir Producto Nuevo</h3>
        <form id="formNuevoProducto">
            <label for="nombreProducto">Nombre del Producto:</label>
            <input type="text" id="nombreProducto" required>

            <label for="precioProducto">Precio (€):</label>
            <input type="number" id="precioProducto" step="0.01" required>

            <label for="ingredientesProducto">Ingredientes:</label>
            <div id="listaIngredientes">
                <div class="ingrediente">
                    <input type="text" placeholder="Nombre del Ingrediente" class="nombreIngrediente" required>
                    <input type="number" placeholder="Cantidad" class="cantidadIngrediente" required>
                    <input type="number" placeholder="Stock Inicial" class="stockInicial" required>
                    <input type="number" placeholder="Stock Mínimo" class="stockMinimo" required>
                    <button type="button" class="eliminarIngrediente">Quitar</button>
                </div>
            </div>
            <button type="button" id="agregarIngrediente">Añadir Ingrediente</button>
            <br>
            <button type="submit">Guardar Producto</button>
        </form>
    `;

    // Lógica para añadir más ingredientes
    const listaIngredientes = document.getElementById("listaIngredientes");
    document.getElementById("agregarIngrediente").addEventListener("click", () => {
        const ingredienteDiv = document.createElement("div");
        ingredienteDiv.classList.add("ingrediente");
        ingredienteDiv.innerHTML = `
            <input type="text" placeholder="Nombre del Ingrediente" class="nombreIngrediente" required>
            <input type="number" placeholder="Cantidad" class="cantidadIngrediente" required>
            <input type="number" placeholder="Stock Inicial" class="stockInicial" required>
            <input type="number" placeholder="Stock Mínimo" class="stockMinimo" required>
            <button type="button" class="eliminarIngrediente">Quitar</button>
        `;
        listaIngredientes.appendChild(ingredienteDiv);

        // Eliminar un ingrediente
        ingredienteDiv.querySelector(".eliminarIngrediente").addEventListener("click", () => {
            ingredienteDiv.remove();
        });
    });

    

    // Enviar el formulario para guardar el producto
    document.getElementById("formNuevoProducto").addEventListener("submit", async (e) => {
        e.preventDefault();

        const nombre = document.getElementById("nombreProducto").value;
        const precio = parseFloat(document.getElementById("precioProducto").value);
        const ingredientes = Array.from(document.querySelectorAll(".ingrediente")).map((ingredienteDiv) => {
            return {
                nombre: ingredienteDiv.querySelector(".nombreIngrediente").value,
                cantidad: parseInt(ingredienteDiv.querySelector(".cantidadIngrediente").value),
                stockInicial: parseInt(ingredienteDiv.querySelector(".stockInicial").value),
                stockMinimo: parseInt(ingredienteDiv.querySelector(".stockMinimo").value),
            };
        });

        try {
            const response = await fetch('/encargado/nuevo-producto', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nombre, precio, ingredientes }),
            });

            if (response.ok) {
                alert("Producto añadido correctamente.");
                contenido.innerHTML = "<p>Producto guardado con éxito.</p>";
            } else {
                const error = await response.json();
                alert(`Error al añadir producto: ${error.message}`);
            }
        } catch (error) {
            console.error("Error al guardar el producto:", error);
            alert("Error al guardar el producto.");
        }
    });
});


    // Mostrar "Nuevo Pedido"
    nuevoPedidoBtn.addEventListener("click", async () => {
        try {
            const productosResponse = await fetch('/encargado/productos');
            const productos = await productosResponse.json();

            if (!productosResponse.ok) {
                throw new Error(productos.message || "Error al cargar productos.");
            }

            contenido.innerHTML = `
                <h3>Nuevo Pedido</h3>
                <div id="productos">
                    ${productos
                        .map(
                            (producto) =>
                                `<button class="producto" data-id="${producto.id}" data-nombre="${producto.nombre}" data-precio="${producto.precio}">
                                    ${producto.nombre} - €${parseFloat(producto.precio).toFixed(2)}
                                </button>`
                        )
                        .join("")}
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

            // Lógica para añadir productos a la comanda
            botonesProducto.forEach((boton) => {
                boton.addEventListener("click", () => {
                    const id = boton.dataset.id; // Recuperar el ID del botón
                    const nombre = boton.dataset.nombre;
                    const precio = parseFloat(boton.dataset.precio);
            
                    if (!isNaN(precio)) {
                        const listItem = document.createElement("li");
                        listItem.textContent = `${nombre} - €${precio.toFixed(2)}`;
                        listItem.setAttribute("data-id", id); // Asignar el ID del producto al elemento
            
                        const removeButton = document.createElement("button");
                        removeButton.textContent = "Quitar";
                        removeButton.style.marginLeft = "10px";
            
                        removeButton.addEventListener("click", () => {
                            listItem.remove();
                        });
            
                        listItem.appendChild(removeButton);
                        comandaLista.appendChild(listItem);
                    } else {
                        console.error("Precio no válido para el producto:", nombre);
                    }
                });
            });
            

            finalizarPedidoBtn.addEventListener("click", async () => {
                const items = Array.from(comandaLista.children).map((item) => {
                    const idProducto = item.getAttribute("data-id");
                    if (!idProducto) {
                        console.error("ID de producto no encontrado en la comanda:", item);
                        return null;
                    }
                    return { id_producto: parseInt(idProducto), cantidad: 1 };
                }).filter(item => item !== null);
            
                console.log("Datos enviados al backend:", items); // Log para depuración
            
                if (items.length > 0) {
                    try {
                        const response = await fetch('/encargado/procesar-pedido', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ productos: items }),
                        });
            
                        if (response.ok) {
                            const result = await response.json();
                            alert(`Pedido procesado correctamente. ID: ${result.pedidoId}`);
                            contenido.innerHTML = "<p>Pedido enviado correctamente.</p>";
                        } else {
                            const error = await response.json();
                            alert(`Error al procesar el pedido: ${error.message}`);
                        }
                    } catch (error) {
                        console.error("Error al procesar el pedido:", error);
                        alert("Error al procesar el pedido.");
                    }
                } else {
                    alert("No hay productos en la comanda.");
                }
            });
            
        } catch (error) {
            console.error("Error al obtener productos:", error);
            contenido.innerHTML = "<p>Error al cargar los productos.</p>";
        }
    });
    // Mostrar lista de productos para modificar
    modificarProductoBtn.addEventListener("click", async () => {
        try {
            const response = await fetch('/encargado/productos-completos');
            const productos = await response.json();
    
            if (!response.ok || productos.length === 0) {
                throw new Error("No hay productos disponibles.");
            }
    
            contenido.innerHTML = `
                <h3>Modificar Productos</h3>
                <ul>
                    ${productos.map(producto => {
                        const precio = parseFloat(producto.precio) || 0; // Asegúrate de que el precio es numérico
                        return `
                            <li>
                                <strong>${producto.nombre}</strong> - €${precio.toFixed(2)}
                                <button class="editarProducto" data-id="${producto.id_producto}">Editar</button>
                                <button class="eliminarProducto" data-id="${producto.id_producto}">Eliminar</button>
                            </li>`;
                    }).join("")}
                </ul>
            `;
    
            // Lógica para editar productos
            document.querySelectorAll('.editarProducto').forEach(boton => {
                boton.addEventListener("click", async () => {
                    const idProducto = boton.getAttribute("data-id");
                    mostrarFormularioModificarProducto(idProducto);
                });
            });
    
            // Lógica para eliminar productos
            document.querySelectorAll('.eliminarProducto').forEach(boton => {
                boton.addEventListener("click", async () => {
                    const idProducto = boton.getAttribute("data-id");
                    if (confirm("¿Estás seguro de que deseas eliminar este producto?")) {
                        try {
                            const response = await fetch(`/encargado/producto/${idProducto}`, {
                                method: "DELETE",
                            });
                            if (response.ok) {
                                alert("Producto eliminado correctamente.");
                                modificarProductoBtn.click(); // Recargar lista
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
            contenido.innerHTML = "<p>Error al cargar productos disponibles.</p>";
        }
    });
    

// Mostrar formulario para editar producto
async function mostrarFormularioModificarProducto(idProducto) {
    try {
        const response = await fetch(`/encargado/producto/${idProducto}`);
        const { producto, ingredientes } = await response.json();

        const precio = parseFloat(producto.precio) || 0; // Garantiza que el precio es numérico

        contenido.innerHTML = `
        <h3>Modificar Producto: ${producto.nombre}</h3>
        <form id="formModificarProducto">
            <label for="nombreProducto">Nombre del Producto:</label>
            <input type="text" id="nombreProducto" value="${producto.nombre}" required>
    
            <label for="precioProducto">Precio (€):</label>
            <input type="number" id="precioProducto" step="0.01" value="${precio.toFixed(2)}" required>
    
            <label for="ingredientesProducto">Ingredientes:</label>
            <div id="listaIngredientes">
                ${ingredientes.map(ingrediente => `
                    <div class="ingrediente" data-id="${ingrediente.id_ingrediente}">
                        <label>Nombre:</label>
                        <input type="text" value="${ingrediente.nombre_ingrediente || ''}" class="nombreIngrediente" disabled>
    
                        <label>Cantidad:</label>
                        <input type="number" value="${ingrediente.cantidad || 0}" class="cantidadIngrediente" required>
    
                        <label>Stock Actual:</label>
                        <input type="number" value="${ingrediente.stock || 0}" class="stockInicial" required>
    
                        <label>Stock Mínimo:</label>
                        <input type="number" value="${ingrediente.stock_minimo || 0}" class="stockMinimo" required>
                    </div>`).join('')}
            </div>
            <button type="submit">Guardar Cambios</button>
        </form>
    `;
    

        // Guardar cambios del producto
        document.getElementById("formModificarProducto").addEventListener("submit", async (e) => {
            e.preventDefault();

            const nombre = document.getElementById("nombreProducto").value;
            const precio = parseFloat(document.getElementById("precioProducto").value);
            const ingredientes = Array.from(document.querySelectorAll(".ingrediente")).map(div => ({
                id_ingrediente: div.getAttribute("data-id"),
                cantidad: parseInt(div.querySelector(".cantidadIngrediente").value),
                stock: parseInt(div.querySelector(".stockInicial").value),
                stock_minimo: parseInt(div.querySelector(".stockMinimo").value),
            }));

            try {
                const response = await fetch(`/encargado/producto/${idProducto}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ nombre, precio, ingredientes }),
                });

                if (response.ok) {
                    alert("Producto modificado correctamente.");
                    contenido.innerHTML = "<p>Producto actualizado con éxito.</p>";
                } else {
                    const error = await response.json();
                    alert(`Error al modificar producto: ${error.message}`);
                }
            } catch (error) {
                console.error("Error al modificar el producto:", error);
                alert("Error al modificar el producto.");
            }
        });
    } catch (error) {
        console.error("Error al obtener el producto:", error);
        contenido.innerHTML = "<p>Error al cargar los datos del producto.</p>";
    }
}



    // Mostrar "Ver Pedidos"
    verPedidosBtn.addEventListener("click", async () => {
        contenido.innerHTML = `
            <h3>Ver Pedidos</h3>
            <label for="fechaPedido">Selecciona una fecha:</label>
            <input type="date" id="fechaPedido">
            <button id="filtrarPedidos">Filtrar</button>
            <div id="resultadosPedidos">
                <p>Selecciona una fecha para ver los pedidos.</p>
            </div>
        `;

        const filtrarPedidosBtn = document.getElementById("filtrarPedidos");
        const fechaPedidoInput = document.getElementById("fechaPedido");
        const resultadosPedidos = document.getElementById("resultadosPedidos");

        filtrarPedidosBtn.addEventListener("click", async () => {
            const fechaSeleccionada = fechaPedidoInput.value;

            if (!fechaSeleccionada) {
                resultadosPedidos.innerHTML = "<p>Por favor selecciona una fecha válida.</p>";
                return;
            }

            try {
                const response = await fetch(`/encargado/ver-pedidos?fecha=${fechaSeleccionada}`);
                const pedidos = await response.json();

                if (response.ok) {
                    if (pedidos.length > 0) {
                        resultadosPedidos.innerHTML = `
                            <ul>
                                ${pedidos
                                    .map((pedido) => {
                                        const total = parseFloat(pedido.total) || 0;
                                        return `
                                            <li>
                                                Pedido ID: ${pedido.pedido_id}, Fecha: ${pedido.fecha}, Total: €${total.toFixed(2)}
                                            </li>
                                        `;
                                    })
                                    .join("")}
                            </ul>
                        `;
                    } else {
                        resultadosPedidos.innerHTML = "<p>No hay pedidos registrados para la fecha seleccionada.</p>";
                    }
                } else {
                    resultadosPedidos.innerHTML = `<p>Error al obtener los pedidos: ${pedidos.message}</p>`;
                }
            } catch (error) {
                console.error("Error al realizar la solicitud de pedidos:", error);
                resultadosPedidos.innerHTML = "<p>Error al cargar los pedidos.</p>";
            }
        });
    });
});
