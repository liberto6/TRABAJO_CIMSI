document.addEventListener("DOMContentLoaded", async () => {
    const tituloPagina = document.getElementById("tituloPagina");
    const cerrarSesionBtn = document.getElementById("cerrarSesion");
    const nuevoPedidoBtn = document.getElementById("nuevoPedido");
    const contenido = document.getElementById("contenido");
    const verPedidosBtn = document.getElementById("verPedidos");

    // Obtener el nombre del empleado
    try {
        const response = await fetch('/empleado/nombre');
        const data = await response.json();

        if (response.ok) {
            tituloPagina.textContent = `PDA - Empleado: ${data.nombre}`;
        } else {
            tituloPagina.textContent = "PDA - Empleado: No identificado";
        }
    } catch (error) {
        console.error("Error al obtener el nombre del empleado:", error);
        tituloPagina.textContent = "PDA - Empleado: Error";
    }

    // Mostrar "Nuevo Pedido"
    nuevoPedidoBtn.addEventListener("click", async () => {
        try {
            const productosResponse = await fetch('/empleado/productos');
            const productos = await productosResponse.json();
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
            // Agregar productos a la comanda
            botonesProducto.forEach((boton) => {
                boton.addEventListener("click", () => {
                    const nombre = boton.dataset.nombre;
                    const precio = parseFloat(boton.dataset.precio);
                    if (!isNaN(precio)) {
                        const listItem = document.createElement("li");
                        listItem.textContent = `${nombre} - €${precio.toFixed(2)}`;
                        comandaLista.appendChild(listItem);
                    } else {
                        console.error("Precio no válido para el producto:", nombre);
                    }
                });
            });
            // Procesar pedido
            finalizarPedidoBtn.addEventListener("click", async () => {
                const items = Array.from(comandaLista.children).map((item) => {
                    const [nombre] = item.textContent.split(" - €");
                    const producto = productos.find((p) => p.nombre === nombre);
                    return { id: producto.id, cantidad: 1 }; // Asume cantidad = 1
                });
                if (items.length > 0) {
                    try {
                        const response = await fetch('/empleado/procesar-pedido', {
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
    

    // Mostrar "Ver Pedidos" con filtro de fecha
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
                const response = await fetch(`/empleado/ver-pedidos?fecha=${fechaSeleccionada}`);
                const pedidos = await response.json();

                if (response.ok) {
                    if (pedidos.length > 0) {
                        resultadosPedidos.innerHTML = `
                            <ul>
                                ${pedidos
                                    .map((pedido) => {
                                        const total = parseFloat(pedido.total) || 0; // Convierte a número y maneja valores nulos
                                        return `
                                            <li>
                                                Pedido ID: ${pedido.id}, Fecha: ${pedido.fecha}, Total: €${total.toFixed(2)}
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
    cerrarSesionBtn.addEventListener("click", async () => {
        try {
            // Enviar la solicitud de cierre de sesión al servidor
            const response = await fetch('/auth/logout', {
                method: 'POST',
                credentials: 'include', // Incluye las cookies en la solicitud
            });
    
            if (response.ok) {
                alert("Sesión cerrada correctamente.");
                window.location.href = '/'; // Redirige al usuario a la página de inicio de sesión
            } else {
                alert("Error al cerrar sesión. Por favor, intenta de nuevo.");
            }
        } catch (error) {
            console.error("Error al cerrar sesión:", error);
            alert("Error al cerrar sesión. Por favor, verifica tu conexión e inténtalo de nuevo.");
        }
    });
    
});
