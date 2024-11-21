document.addEventListener("DOMContentLoaded", async () => {
    const tituloPagina = document.getElementById("tituloPagina");
    const cerrarSesionBtn = document.getElementById("cerrarSesion");
    const nuevoPedidoBtn = document.getElementById("nuevoPedido");
    const contenido = document.getElementById("contenido");

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
});
