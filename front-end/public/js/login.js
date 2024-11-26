document.getElementById('loginForm').addEventListener('submit', async (event) => {
    event.preventDefault();

    const email = document.getElementById('email').value.trim();
    const contraseña = document.getElementById('contraseña').value.trim();

    if (!email || !contraseña) {
        alert('Por favor, completa todos los campos.');
        return;
    }

    try {
        const response = await fetch('/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, contraseña })
        });

        if (response.ok) {
            const data = await response.json();

            // Redirigir según el rol del usuario
            if (data.role === 'encargado') {
                window.location.href = '/encargado';
            } else if (data.role === 'empleado') {
                window.location.href = '/empleado';
            } else {
                alert('Rol desconocido. Contacta al administrador.');
            }
        } else {
            const error = await response.json();
            alert(error.message || 'Error en las credenciales. Verifica tu email y contraseña.');
        }
    } catch (err) {
        console.error('Error al conectar con el servidor:', err);
        alert('No se pudo conectar con el servidor. Intenta nuevamente.');
    }
});
