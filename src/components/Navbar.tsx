
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Menu, X, BookOpen, Users, Calendar, Layers, LogOut } from 'lucide-react';

const Navbar: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const location = useLocation();
  
  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <nav className="bg-white/80 backdrop-blur-md border-b border-gray-200 py-4 px-6 sticky top-0 z-50 shadow-sm">
      <div className="flex justify-between items-center">
        <Link to="/dashboard" className="flex items-center gap-2">
          <BookOpen className="h-6 w-6 text-primary" />
          <span className="text-xl font-semibold text-gray-900">AsistenciaFelina</span>
        </Link>
        
        {/* Navegación para pantallas grandes */}
        <div className="hidden md:flex items-center gap-6">
          <Link 
            to="/dashboard" 
            className={`transition-colors duration-200 ${isActive('/dashboard') 
              ? 'text-primary font-medium' 
              : 'text-gray-600 hover:text-gray-900'}`}
          >
            Dashboard
          </Link>
          <Link 
            to="/attendance" 
            className={`transition-colors duration-200 ${isActive('/attendance') 
              ? 'text-primary font-medium' 
              : 'text-gray-600 hover:text-gray-900'}`}
          >
            Asistencia
          </Link>
          <Link 
            to="/students" 
            className={`transition-colors duration-200 ${isActive('/students') 
              ? 'text-primary font-medium' 
              : 'text-gray-600 hover:text-gray-900'}`}
          >
            Estudiantes
          </Link>
          <Link 
            to="/courses" 
            className={`transition-colors duration-200 ${isActive('/courses') 
              ? 'text-primary font-medium' 
              : 'text-gray-600 hover:text-gray-900'}`}
          >
            Cursos
          </Link>
          
          <Button 
            variant="ghost" 
            className="ml-4 text-gray-600 hover:text-gray-900"
            onClick={() => {
              // Lógica para cerrar sesión
              window.location.href = '/';
            }}
          >
            <LogOut className="h-4 w-4 mr-1" />
            Salir
          </Button>
        </div>
        
        {/* Botón para móviles */}
        <Button 
          variant="ghost" 
          className="md:hidden" 
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </Button>
      </div>
      
      {/* Menú móvil */}
      {isMenuOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 bg-white border-b border-gray-200 shadow-md animate-in">
          <div className="flex flex-col p-4 space-y-3">
            <Link 
              to="/dashboard" 
              className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-gray-100"
              onClick={() => setIsMenuOpen(false)}
            >
              <Layers className="h-5 w-5" />
              <span>Dashboard</span>
            </Link>
            <Link 
              to="/attendance" 
              className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-gray-100"
              onClick={() => setIsMenuOpen(false)}
            >
              <Calendar className="h-5 w-5" />
              <span>Asistencia</span>
            </Link>
            <Link 
              to="/students" 
              className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-gray-100"
              onClick={() => setIsMenuOpen(false)}
            >
              <Users className="h-5 w-5" />
              <span>Estudiantes</span>
            </Link>
            <Link 
              to="/courses" 
              className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-gray-100"
              onClick={() => setIsMenuOpen(false)}
            >
              <BookOpen className="h-5 w-5" />
              <span>Cursos</span>
            </Link>
            <Button 
              variant="ghost" 
              className="flex items-center justify-start gap-2 px-3 py-2 rounded-md hover:bg-gray-100"
              onClick={() => {
                // Lógica para cerrar sesión
                window.location.href = '/';
              }}
            >
              <LogOut className="h-5 w-5" />
              <span>Salir</span>
            </Button>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
