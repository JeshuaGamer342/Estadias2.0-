import { BrowserRouter as Router, Routes, Route, } from "react-router-dom";
import EjemploNavbar from "./pages/Navbar";
import './pages/PageStyles.css';
import Id from "./pages/Id";
import Fecha from "./pages/Fecha";
import Keyword from "./pages/Keyword";
import Categoria from "./pages/Categoria";


function App() {
  return (
    <Router>
      <Routes>
        <Route path='/' element={<EjemploNavbar />} />
        <Route path='/Id' element={<Id />} />
        <Route path='/Fecha' element={<Fecha />} />
        <Route path='/Keyword' element={<Keyword />} />
        <Route path='/Categoria' element={<Categoria />} />
      </Routes>
    </Router>
  )
}

export default App