document.getElementById('registerForm').addEventListener('submit', async (event) => {
    event.preventDefault();

    const nombre = document.getElementById('nombre').value.trim();
    const email = document.getElementById('email').value.trim();
    const contraseña = document.getElementById('contraseña').value.trim();
    const restaurante = document.getElementById('restaurante').value.trim();
    const emailRestaurante = document.getElementById('emailRestaurante').value.trim();
    const telefonoRestaurante = document.getElementById('telefonoRestaurante').value.trim();
    const direccionRestaurante = document.getElementById('direccionRestaurante').value.trim();

    if (!nombre || !email || !contraseña || !restaurante || !emailRestaurante || !telefonoRestaurante || !direccionRestaurante) {
        document.getElementById('registerErrorMessage').innerText = 'Todos los campos son obligatorios.';
        return;
    }

    try {
        const response = await fetch('/auth/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
                nombre, 
                email, 
                contraseña, 
                restaurante, 
                emailRestaurante, 
                telefonoRestaurante, 
                direccionRestaurante 
            }),
        });

        if (response.ok) {
            alert('Registro exitoso. Ahora puedes iniciar sesión.');
            window.location.href = '/login.html'; // Redirigir a la página de inicio de sesión
        } else {
            const error = await response.json();
            document.getElementById('registerErrorMessage').innerText = error.message || 'Error al registrarse.';
        }
    } catch (err) {
        console.error('Error al conectar con el servidor:', err);
        document.getElementById('registerErrorMessage').innerText = 'Error al conectar con el servidor.';
    }
});
