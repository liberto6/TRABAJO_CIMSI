document.addEventListener("DOMContentLoaded", async () => {
    const tituloPagina = document.getElementById("tituloPagina");
    const cerrarSesionBtn = document.getElementById("cerrarSesion");
    const nuevoPedidoBtn = document.getElementById("nuevoPedido");
    const verPedidosBtn = document.getElementById("verPedidos");
    const gestionarEmpleadosBtn = document.getElementById("gestionarEmpleados");
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
                    const nombre = boton.dataset.nombre;
                    const precio = parseFloat(boton.dataset.precio);

                    if (!isNaN(precio)) {
                        const listItem = document.createElement("li");
                        listItem.textContent = `${nombre} - €${precio.toFixed(2)}`;

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
                    const [nombre] = item.textContent.split(" - €");
                    const producto = productos.find((p) => p.nombre === nombre);
                    return { id_producto: producto.id, cantidad: 1 }; // Cambio aquí: id_producto
                });

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
