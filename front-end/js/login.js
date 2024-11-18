document.getElementById('loginForm').addEventListener('submit', async (event) => {
    event.preventDefault();

    const email = document.getElementById('email').value;
    const contraseña = document.getElementById('contraseña').value;

    try {
        const response = await fetch('/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, contraseña }),
        });

        if (response.ok) {
            const data = await response.json();
            alert(`Bienvenido, ${data.nombre}`);
            // Redirige según el rol
            if (data.rol === 'encargado') {
                window.location.href = '/views/encargado.html'; // Vista para encargados
            } else if (data.rol === 'empleado') {
                window.location.href = '/views/empleado.html'; // Vista para empleados (asegúrate de crear esta página)
            }
        } else {
            const error = await response.json();
            document.getElementById('errorMessage').innerText = error.message;
        }
    } catch (err) {
        console.error('Error:', err);
        document.getElementById('errorMessage').innerText = 'Error al conectar con el servidor.';
    }
});
