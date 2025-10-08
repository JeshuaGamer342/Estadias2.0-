import { Link } from 'react-router-dom';

function EjemploNavbar() {
    return (
        <div className="home-center">
            <div className="home-content">
                <img src="/LOGO BADABUN.png" alt="LOGO BADABUN" className="home-logo" />
                <div className="home-buttons">
                    <Link to="/Id" className="home-btn">ID</Link>
                    <Link to="/Keyword" className="home-btn">Keyword</Link>
                    <Link to="/Fecha" className="home-btn">Fecha</Link>
                    <Link to="/Categoria" className="home-btn">Categoría</Link>
                </div>
            </div>
        </div>
    );
}

export default EjemploNavbar;