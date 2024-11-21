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
});
