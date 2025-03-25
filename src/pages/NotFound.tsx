
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center max-w-md px-4">
        <AlertTriangle className="h-16 w-16 text-amber-500 mx-auto mb-4" />
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Página no encontrada</h1>
        <p className="text-gray-600 mb-6">
          Lo sentimos, la página que buscas no existe o ha sido movida.
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <Button 
            variant="default" 
            onClick={() => navigate(-1)}
          >
            Regresar
          </Button>
          <Button 
            variant="outline" 
            onClick={() => navigate('/dashboard')}
          >
            Ir al Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
