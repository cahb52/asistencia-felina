
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Layers, Users, Calendar, BookOpen, ArrowUp } from 'lucide-react';
import db from '@/db/database';
import { Curso, Estudiante, Asistencia, SesionUsuario } from '@/models/types';

const Dashboard = () => {
  const [usuario, setUsuario] = useState<SesionUsuario | null>(null);
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [estudiantes, setEstudiantes] = useState<number>(0);
  const [asistenciasHoy, setAsistenciasHoy] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  
  useEffect(() => {
    // Verificar si hay un usuario en sesión
    const usuarioGuardado = sessionStorage.getItem('usuario');
    if (!usuarioGuardado) {
      navigate('/');
      return;
    }
    
    setUsuario(JSON.parse(usuarioGuardado));
    
    const cargarDatos = async () => {
      try {
        const usuarioId = JSON.parse(usuarioGuardado).id;
        
        // Cargar cursos del profesor
        const cursosProfesor = await db.cursos
          .where('profesorId')
          .equals(usuarioId)
          .toArray();
        setCursos(cursosProfesor);
        
        // Contar todos los estudiantes
        if (cursosProfesor.length > 0) {
          const cursosIds = cursosProfesor.map(curso => curso.id);
          const totalEstudiantes = await db.estudiantes
            .where('cursoId')
            .anyOf(cursosIds as number[])
            .count();
          setEstudiantes(totalEstudiantes);
          
          // Contar asistencias de hoy
          const fechaHoy = new Date().toISOString().split('T')[0];
          const asistenciasDeHoy = await db.asistencias
            .where('fecha')
            .equals(fechaHoy)
            .and(asistencia => 
              cursosIds.includes(asistencia.cursoId as number)
            )
            .count();
          setAsistenciasHoy(asistenciasDeHoy);
        }
      } catch (error) {
        console.error('Error al cargar datos:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    cargarDatos();
  }, [navigate]);
  
  if (!usuario) {
    return null; // Redirigiendo a login
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <main className="container px-4 py-8 mx-auto max-w-7xl">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Bienvenido, {usuario.nombre}</h1>
          <p className="text-gray-500 mt-1">Gestiona la asistencia de tus cursos</p>
        </header>
        
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-pulse text-center">
              <p className="text-gray-500">Cargando información...</p>
            </div>
          </div>
        ) : (
          <>
            <div className="grid gap-6 mb-8 md:grid-cols-3">
              <Card className="glass-effect card-hover">
                <CardContent className="pt-6">
                  <div className="flex items-center">
                    <div className="p-3 rounded-full bg-blue-100 text-primary">
                      <BookOpen className="h-8 w-8" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-500">Cursos</p>
                      <h3 className="text-3xl font-bold">{cursos.length}</h3>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="glass-effect card-hover">
                <CardContent className="pt-6">
                  <div className="flex items-center">
                    <div className="p-3 rounded-full bg-green-100 text-green-600">
                      <Users className="h-8 w-8" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-500">Estudiantes</p>
                      <h3 className="text-3xl font-bold">{estudiantes}</h3>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="glass-effect card-hover">
                <CardContent className="pt-6">
                  <div className="flex items-center">
                    <div className="p-3 rounded-full bg-purple-100 text-purple-600">
                      <Calendar className="h-8 w-8" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-500">Asistencias Hoy</p>
                      <h3 className="text-3xl font-bold">{asistenciasHoy}</h3>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <h2 className="text-2xl font-bold mb-4">Tus Cursos</h2>
            
            {cursos.length === 0 ? (
              <Card className="bg-white shadow-sm border border-gray-200">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Layers className="h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-xl font-medium text-gray-900 mb-2">No tienes cursos registrados</h3>
                  <p className="text-gray-500 mb-4 text-center max-w-md">
                    Comienza agregando un curso para gestionar la asistencia de tus estudiantes
                  </p>
                  <Button onClick={() => navigate('/courses')}>
                    Agregar Curso
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {cursos.map((curso) => (
                  <Card key={curso.id} className="overflow-hidden card-hover">
                    <CardHeader className="pb-2">
                      <CardTitle>{curso.nombre}</CardTitle>
                      <CardDescription className="flex gap-1">
                        Grado: {curso.grado}, Sección: {curso.seccion}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex justify-between mt-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => navigate(`/students?curso=${curso.id}`)}
                        >
                          <Users className="h-4 w-4 mr-1" /> Estudiantes
                        </Button>
                        <Button 
                          size="sm"
                          onClick={() => navigate(`/attendance?curso=${curso.id}`)}
                        >
                          <Calendar className="h-4 w-4 mr-1" /> Asistencia
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
