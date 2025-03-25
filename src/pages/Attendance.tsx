
import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import AttendanceCard from '@/components/AttendanceCard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar as CalendarIcon, Save, ArrowLeft } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import db from '@/db/database';
import { Curso, Estudiante, Asistencia, EstadoAsistencia } from '@/models/types';

const Attendance = () => {
  const [searchParams] = useSearchParams();
  const cursoIdParam = searchParams.get('curso');
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [cursoSeleccionado, setCursoSeleccionado] = useState<number | null>(cursoIdParam ? parseInt(cursoIdParam) : null);
  const [estudiantes, setEstudiantes] = useState<Estudiante[]>([]);
  const [fecha, setFecha] = useState<Date>(new Date());
  const [estadosAsistencia, setEstadosAsistencia] = useState<{[key: number]: EstadoAsistencia}>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  // Cargar datos iniciales
  useEffect(() => {
    const usuarioGuardado = sessionStorage.getItem('usuario');
    if (!usuarioGuardado) {
      navigate('/');
      return;
    }
    
    const cargarDatos = async () => {
      try {
        setIsLoading(true);
        const usuarioId = JSON.parse(usuarioGuardado).id;
        
        // Cargar cursos del profesor
        const cursosProfesor = await db.cursos
          .where('profesorId')
          .equals(usuarioId)
          .toArray();
        
        setCursos(cursosProfesor);
        
        // Si hay un curso en URL y está entre los cursos del profesor
        if (cursoIdParam && cursosProfesor.some(c => c.id === parseInt(cursoIdParam))) {
          setCursoSeleccionado(parseInt(cursoIdParam));
          await cargarEstudiantes(parseInt(cursoIdParam));
        }
      } catch (error) {
        console.error('Error al cargar datos:', error);
        toast({
          title: "Error",
          description: "No se pudieron cargar los datos",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    cargarDatos();
  }, [navigate, cursoIdParam, toast]);
  
  // Cuando cambia el curso seleccionado
  useEffect(() => {
    if (cursoSeleccionado) {
      cargarEstudiantes(cursoSeleccionado);
    }
  }, [cursoSeleccionado]);
  
  // Cuando cambia la fecha o el curso, cargar asistencias existentes
  useEffect(() => {
    if (cursoSeleccionado && fecha) {
      cargarAsistencias(cursoSeleccionado, fecha);
    }
  }, [cursoSeleccionado, fecha]);
  
  const cargarEstudiantes = async (cursoId: number) => {
    try {
      setIsLoading(true);
      
      // Cargar estudiantes del curso
      const estudiantesCurso = await db.estudiantes
        .where('cursoId')
        .equals(cursoId)
        .and(estudiante => estudiante.activo)
        .toArray();
      
      setEstudiantes(estudiantesCurso);
      
      // Cargar asistencias de la fecha seleccionada
      await cargarAsistencias(cursoId, fecha);
    } catch (error) {
      console.error('Error al cargar estudiantes:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const cargarAsistencias = async (cursoId: number, fecha: Date) => {
    try {
      const fechaString = format(fecha, 'yyyy-MM-dd');
      
      // Cargar asistencias existentes
      const asistencias = await db.asistencias
        .where('cursoId')
        .equals(cursoId)
        .and(a => a.fecha === fechaString)
        .toArray();
      
      // Mapear asistencias por estudiante
      const nuevosEstados: {[key: number]: EstadoAsistencia} = {};
      
      asistencias.forEach(asistencia => {
        nuevosEstados[asistencia.estudianteId] = asistencia.estado;
      });
      
      setEstadosAsistencia(nuevosEstados);
    } catch (error) {
      console.error('Error al cargar asistencias:', error);
    }
  };
  
  const cambiarEstadoAsistencia = (estudianteId: number, estado: EstadoAsistencia) => {
    setEstadosAsistencia(prevEstados => ({
      ...prevEstados,
      [estudianteId]: estado
    }));
  };
  
  const guardarAsistencia = async () => {
    if (!cursoSeleccionado) {
      toast({
        title: "Error",
        description: "Selecciona un curso",
        variant: "destructive",
      });
      return;
    }
    
    setIsSaving(true);
    
    try {
      const fechaString = format(fecha, 'yyyy-MM-dd');
      
      // Obtener asistencias existentes para actualizar o eliminar
      const asistenciasExistentes = await db.asistencias
        .where('cursoId')
        .equals(cursoSeleccionado)
        .and(a => a.fecha === fechaString)
        .toArray();
      
      // Crear mapa de asistencias existentes por estudianteId
      const mapaAsistenciasExistentes = new Map(
        asistenciasExistentes.map(a => [a.estudianteId, a.id])
      );
      
      // Crear transacción
      await db.transaction('rw', db.asistencias, async () => {
        // Para cada estudiante con estado registrado
        for (const estudianteId of Object.keys(estadosAsistencia).map(Number)) {
          const estado = estadosAsistencia[estudianteId];
          const asistenciaExistenteId = mapaAsistenciasExistentes.get(estudianteId);
          
          if (asistenciaExistenteId) {
            // Actualizar asistencia existente
            await db.asistencias.update(asistenciaExistenteId, {
              estado: estado
            });
            
            // Eliminar del mapa para saber cuáles borrar después
            mapaAsistenciasExistentes.delete(estudianteId);
          } else {
            // Crear nueva asistencia
            await db.asistencias.add({
              estudianteId: estudianteId,
              cursoId: cursoSeleccionado,
              fecha: fechaString,
              estado: estado
            });
          }
        }
        
        // Eliminar asistencias que ya no existen (si el usuario quitó el estado)
        for (const asistenciaId of mapaAsistenciasExistentes.values()) {
          await db.asistencias.delete(asistenciaId);
        }
      });
      
      toast({
        title: "Guardado exitoso",
        description: "Asistencia registrada correctamente",
      });
    } catch (error) {
      console.error('Error al guardar asistencia:', error);
      toast({
        title: "Error",
        description: "No se pudo guardar la asistencia",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  // Estadísticas de asistencia actual
  const totalEstudiantes = estudiantes.length;
  const totalRegistrados = Object.keys(estadosAsistencia).length;
  const presentes = Object.values(estadosAsistencia).filter(e => e === 'presente').length;
  const ausentes = Object.values(estadosAsistencia).filter(e => e === 'ausente').length;
  const permisos = Object.values(estadosAsistencia).filter(e => e === 'permiso').length;
  const otros = Object.values(estadosAsistencia).filter(e => e === 'otro').length;
  
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <main className="container px-4 py-8 mx-auto max-w-7xl">
        <div className="flex items-center mb-8">
          <Button 
            variant="ghost" 
            size="icon"
            className="mr-2"
            onClick={() => navigate('/dashboard')}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Registro de Asistencia</h1>
            <p className="text-gray-500 mt-1">Registra la asistencia diaria de tus cursos</p>
          </div>
        </div>
        
        <div className="grid gap-6 md:grid-cols-3 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Seleccionar Curso</CardTitle>
            </CardHeader>
            <CardContent>
              <Select 
                value={cursoSeleccionado?.toString() || ""} 
                onValueChange={(value) => setCursoSeleccionado(parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un curso" />
                </SelectTrigger>
                <SelectContent>
                  {cursos.map((curso) => (
                    <SelectItem key={curso.id} value={curso.id!.toString()}>
                      {curso.nombre} - {curso.grado} {curso.seccion}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Seleccionar Fecha</CardTitle>
            </CardHeader>
            <CardContent>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {fecha ? format(fecha, "PPP", { locale: es }) : "Seleccionar fecha"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={fecha}
                    onSelect={(date) => date && setFecha(date)}
                    initialFocus
                    locale={es}
                  />
                </PopoverContent>
              </Popover>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Estadísticas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Total estudiantes:</span>
                  <span className="font-medium">{totalEstudiantes}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Registrados:</span>
                  <span className="font-medium">{totalRegistrados}</span>
                </div>
                <div className="flex justify-between items-center text-green-600">
                  <span className="text-sm">Presentes:</span>
                  <span className="font-medium">{presentes}</span>
                </div>
                <div className="flex justify-between items-center text-red-600">
                  <span className="text-sm">Ausentes:</span>
                  <span className="font-medium">{ausentes}</span>
                </div>
                <div className="flex justify-between items-center text-amber-600">
                  <span className="text-sm">Permisos:</span>
                  <span className="font-medium">{permisos}</span>
                </div>
                <div className="flex justify-between items-center text-gray-600">
                  <span className="text-sm">Otros:</span>
                  <span className="font-medium">{otros}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-pulse text-center">
              <p className="text-gray-500">Cargando estudiantes...</p>
            </div>
          </div>
        ) : (
          <>
            {!cursoSeleccionado ? (
              <Card className="bg-white shadow-sm border border-gray-200">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <h3 className="text-xl font-medium text-gray-900 mb-2">Selecciona un curso</h3>
                  <p className="text-gray-500 text-center max-w-md">
                    Selecciona un curso para comenzar a registrar la asistencia
                  </p>
                </CardContent>
              </Card>
            ) : estudiantes.length === 0 ? (
              <Card className="bg-white shadow-sm border border-gray-200">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <h3 className="text-xl font-medium text-gray-900 mb-2">No hay estudiantes</h3>
                  <p className="text-gray-500 mb-4 text-center max-w-md">
                    Este curso no tiene estudiantes registrados
                  </p>
                  <Button onClick={() => navigate(`/students?curso=${cursoSeleccionado}`)}>
                    Agregar Estudiantes
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold">Lista de Estudiantes</h2>
                  <Button 
                    onClick={guardarAsistencia}
                    disabled={isSaving}
                    className="ml-auto"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {isSaving ? 'Guardando...' : 'Guardar Asistencia'}
                  </Button>
                </div>
                
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {estudiantes.map((estudiante) => (
                    <AttendanceCard
                      key={estudiante.id}
                      nombre={estudiante.nombre}
                      apellido={estudiante.apellido}
                      estadoActual={estadosAsistencia[estudiante.id!]}
                      onStatusChange={(estado) => cambiarEstadoAsistencia(estudiante.id!, estado)}
                    />
                  ))}
                </div>
                
                <div className="flex justify-end mt-8">
                  <Button 
                    onClick={guardarAsistencia}
                    disabled={isSaving}
                    size="lg"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {isSaving ? 'Guardando...' : 'Guardar Asistencia'}
                  </Button>
                </div>
              </>
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default Attendance;
