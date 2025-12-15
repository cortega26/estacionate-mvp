import React from 'react';
import { Link } from 'react-router-dom';

export const FailurePage = () => {
    return (
        <div className="min-h-screen flex items-center justify-center bg-red-50">
            <div className="text-center p-8 bg-white rounded shadow-lg">
                <div className="text-6xl mb-4">❌</div>
                <h1 className="text-2xl font-bold text-gray-800 mb-2">Pago Fallido</h1>
                <p className="text-gray-600 mb-6">Algo salió mal o cancelaste el proceso.</p>
                <Link to="/search" className="bg-gray-600 text-white px-6 py-2 rounded hover:bg-gray-700">
                    Intentar Nuevamente
                </Link>
            </div>
        </div>
    );
};
