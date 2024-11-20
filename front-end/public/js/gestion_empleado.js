document.addEventListener("DOMContentLoaded", async () => {
    cargarEmpleados();

    // Manejador para añadir un empleado
    document.getElementById('addEmployeeForm').addEventListener('submit', async (event) => {
        event.preventDefault();

        const nombre = document.getElementById('nombre').value;
        const email = document.getElementById('email').value;
        const contraseña = document.getElementById('contraseña').value;

        try {
            const response = await fetch('/encargado/empleados', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nombre, email, contraseña }),
                credentials: 'include',
            });

            if (response.ok) {
                alert('Empleado añadido con éxito');
                cargarEmpleados(); // Recargar la tabla
                document.getElementById('addEmployeeForm').reset();
            } else {
                throw new Error('Error al añadir el empleado');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('No se pudo añadir el empleado');
        }
    });
});

// Función para cargar los empleados y llenar la tabla
async function cargarEmpleados() {
    try {
        const response = await fetch('/encargado/empleados');
        if (!response.ok) throw new Error('Error al cargar los empleados');

        const empleados = await response.json();
        const tableBody = document.querySelector('#employeeTable tbody');
        tableBody.innerHTML = ''; // Limpiar la tabla

        empleados.forEach((empleado) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${empleado.id_usuario}</td>
                <td>${empleado.nombre}</td>
                <td>${empleado.email}</td>
                <td>
                    <button onclick="eliminarEmpleado(${empleado.id_usuario})">Eliminar</button>
                </td>
            `;
            tableBody.appendChild(row);
        });
    } catch (error) {
        console.error('Error:', error);
    }
}

// Función para eliminar un empleado
async function eliminarEmpleado(id) {
    try {
        const response = await fetch(`/encargado/empleados/${id}`, {
            method: 'DELETE',
            credentials: 'include', // esto hay que ponerlo para que el backend tenga devuelta las cookies y asi verificar que estas logueado
        });

        if (response.ok) {
            alert('Empleado eliminado con éxito');
            cargarEmpleados(); // Recargar la tabla
        } else {
            throw new Error('Error al eliminar el empleado');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('No se pudo eliminar el empleado');
    }
}
