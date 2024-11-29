document.addEventListener("DOMContentLoaded", async () => {
    // Cargar empleados al inicio
    cargarEmpleados();

    // Manejador para el botón de volver
    document.getElementById('volverEncargados').addEventListener('click', () => {
        window.location.href = '/encargado'; // Redirigir a la página principal de encargados
    });

    // Manejador para añadir un empleado
    document.getElementById('addEmployeeForm').addEventListener('submit', async (event) => {
        event.preventDefault();

        const nombre = document.getElementById('nombre').value.trim();
        const email = document.getElementById('email').value.trim();
        const contraseña = document.getElementById('contraseña').value.trim();

        if (!nombre || !email || !contraseña) {
            alert('Todos los campos son obligatorios.');
            return;
        }

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
                const errorData = await response.json();
                alert(`Error al añadir el empleado: ${errorData.message || 'Desconocido'}`);
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
        const response = await fetch('/encargado/empleados', {
            credentials: 'include',
        });
        if (!response.ok) throw new Error('Error al cargar los empleados');

        const empleados = await response.json();
        const tableBody = document.querySelector('#employeeTable tbody');
        tableBody.innerHTML = ''; // Limpiar la tabla

        if (empleados.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="4">No hay empleados registrados</td></tr>';
            return;
        }

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
        console.error('Error al cargar los empleados:', error);
        const tableBody = document.querySelector('#employeeTable tbody');
        tableBody.innerHTML = '<tr><td colspan="4">Error al cargar los empleados</td></tr>';
    }
}

// Función para eliminar un empleado
async function eliminarEmpleado(id) {
    if (!confirm('¿Estás seguro de que quieres eliminar este empleado?')) return;

    try {
        const response = await fetch(`/encargado/empleados/${id}`, {
            method: 'DELETE',
            credentials: 'include',
        });

        if (response.ok) {
            alert('Empleado eliminado con éxito');
            cargarEmpleados(); // Recargar la tabla
        } else {
            const errorData = await response.json();
            alert(`Error al eliminar el empleado: ${errorData.message || 'Desconocido'}`);
        }
    } catch (error) {
        console.error('Error al eliminar el empleado:', error);
        alert('No se pudo eliminar el empleado');
    }
}
