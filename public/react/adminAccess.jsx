const { useState, useEffect } = React;

const backdropStyle = {
    position: 'fixed',
    inset: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    zIndex: 1000
};

const modalStyle = {
    backgroundColor: '#fff',
    padding: '2rem',
    borderRadius: '12px',
    width: 'min(90%, 380px)',
    boxShadow: '0 16px 40px rgba(0, 0, 0, 0.3)'
};

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
        document.body.style.overflow = mostrarModal ? 'hidden' : '';
        return () => {
            document.body.style.overflow = '';
        };
    }, [mostrarModal]);

    useEffect(() => {
        if (!animando) return;
        const timer = setTimeout(() => setAnimando(false), 450);
        return () => clearTimeout(timer);
    }, [animando]);

    const abrirModal = (event) => {
        if (event) {
            event.preventDefault();
            event.stopPropagation();
            const nativeEvent = event.nativeEvent;
            if (nativeEvent) {
                if (typeof nativeEvent.preventDefault === 'function') nativeEvent.preventDefault();
                if (typeof nativeEvent.stopImmediatePropagation === 'function') nativeEvent.stopImmediatePropagation();
            }
        }
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
            setMostrarModal(false);
            setAnimando(false);
            window.location.href = '/html/controlA.html';
            return;
        }
        setError('Contraseña incorrecta.');
        setPassword('');
        setAnimando(true);
    };

    const botones = React.createElement(
        'div',
        { className: 'button-container' },
        React.createElement(
            'button',
            {
                className: 'button alumno',
                type: 'button',
                onClick: () => {
                    window.location.href = '/html/Menu.html';
                }
            },
            'Alumnos'
        ),
        React.createElement(
            'button',
            {
                className: 'button admin',
                type: 'button',
                onClick: abrirModal
            },
            'Administrador'
        )
    );

    const modal = mostrarModal
        ? React.createElement(
              'div',
              { className: 'modal-backdrop', style: backdropStyle },
              React.createElement(
                  'div',
                  { className: `modal${animando ? ' shake' : ''}`, style: modalStyle },
                  React.createElement('h3', null, 'Acceso Administrador'),
                  React.createElement(
                      'label',
                      { htmlFor: 'admin-password' },
                      'Contraseña'
                  ),
                  React.createElement('input', {
                      id: 'admin-password',
                      type: 'password',
                      value: password,
                      onChange: (e) => {
                          setPassword(e.target.value);
                          if (error) setError('');
                      },
                      placeholder: 'Ingresa la contraseña',
                      onKeyDown: (e) => {
                          if (e.key === 'Enter') ingresar();
                      }
                  }),
                  React.createElement('p', { className: 'error' }, error),
                  React.createElement(
                      'div',
                      { className: 'actions' },
                      React.createElement(
                          'button',
                          { className: 'cancel', type: 'button', onClick: cerrarModal },
                          'Cancelar'
                      ),
                      React.createElement(
                          'button',
                          { className: 'confirm', type: 'button', onClick: ingresar },
                          'Ingresar'
                      )
                  )
              )
          )
        : null;

    return React.createElement(React.Fragment, null, botones, modal);
}

const rootElement = document.getElementById('app-root');
if (rootElement) {
    if (typeof ReactDOM.createRoot === 'function') {
        ReactDOM.createRoot(rootElement).render(React.createElement(App));
    } else if (typeof ReactDOM.render === 'function') {
        ReactDOM.render(React.createElement(App), rootElement);
    }
}
