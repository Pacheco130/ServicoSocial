const { useState, useEffect } = React;

function App() {
    const [mostrarModal, setMostrarModal] = useState(false);
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [animando, setAnimando] = useState(false);

    useEffect(() => {
        if (!mostrarModal) return;
        const timer = setTimeout(() => {
            const input = document.getElementById('admin-password');
            if (input) input.focus();
        }, 0);
        return () => clearTimeout(timer);
    }, [mostrarModal]);

    useEffect(() => {
        if (!animando) return;
        const timer = setTimeout(() => setAnimando(false), 450);
        return () => clearTimeout(timer);
    }, [animando]);

    const abrirModal = () => {
        setPassword('');
        setError('');
        setMostrarModal(true);
    };

    const cerrarModal = () => {
        setMostrarModal(false);
        setPassword('');
        setError('');
        setAnimando(false);
    };

    const ingresar = () => {
        if (password === 'IPN_DEYAE.2025') {
            window.location.href = '/html/controlA.html';
            return;
        }
        setError('Contraseña incorrecta.');
        setPassword('');
        setAnimando(true);
    };

    return (
        <>
            <div className="button-container">
                <button className="button alumno" onClick={() => window.location.href = '/html/Menu.html'}>
                    Alumnos
                </button>
                <button className="button admin" onClick={abrirModal}>
                    Administrador
                </button>
            </div>

            {mostrarModal && (
                <div className="modal-backdrop">
                    <div className={`modal${animando ? ' shake' : ''}`}>
                        <h3>Acceso Administrador</h3>
                        <label htmlFor="admin-password">Contraseña</label>
                        <input
                            id="admin-password"
                            type="password"
                            value={password}
                            onChange={(e) => {
                                setPassword(e.target.value);
                                if (error) setError('');
                            }}
                            placeholder="Ingresa la contraseña"
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') ingresar();
                            }}
                        />
                        <p className="error">{error}</p>
                        <div className="actions">
                            <button className="cancel" type="button" onClick={cerrarModal}>Cancelar</button>
                            <button className="confirm" type="button" onClick={ingresar}>Ingresar</button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

const root = document.getElementById('app-root');
if (root) {
    ReactDOM.createRoot(root).render(<App />);
}
