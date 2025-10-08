import React from 'react';
import { useNavigate } from 'react-router-dom';

const BackHomeButton = ({ label = 'Regresar' }) => {
    const navigate = useNavigate();
    return (
        <button className="back-home-button" onClick={() => navigate('/')}>{label}</button>
    );
};

export default BackHomeButton;
