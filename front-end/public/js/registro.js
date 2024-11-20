document.getElementById('registerForm').addEventListener('submit', async (event) => {
    event.preventDefault();

    const nombre = document.getElementById('nombre').value;
    const email = document.getElementById('email').value;
    const contraseña = document.getElementById('contraseña').value;

    try {
        const response = await fetch('/auth/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ nombre, email, contraseña }),
        });

        if (response.ok) {
            alert('Registro exitoso. Ahora puedes iniciar sesión.');
            window.location.href = '/login.html'; // Redirigir a la página de inicio de sesión
        } else {
            const error = await response.json();
            document.getElementById('registerErrorMessage').innerText = error.message;
        }
    } catch (err) {
        console.error('Error:', err);
        document.getElementById('registerErrorMessage').innerText = 'Error al conectar con el servidor.';
    }
});
