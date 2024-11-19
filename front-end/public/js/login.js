document.getElementById('loginForm').addEventListener('submit', async (event) => {
    event.preventDefault();

    const email = document.getElementById('email').value;
    const contraseña = document.getElementById('contraseña').value;

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
            if (data.role === 'encargado') {
                window.location.href = '/encargado';
            } else if (data.role === 'empleado') {
                window.location.href = '/empleado';
            }
        } else {
            const error = await response.json();
            alert(error.message);
        }
    } catch (err) {
        console.error('Error:', err);
        alert('Error al conectar con el servidor.');
    }
});
