
import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import StudentTable from '@/components/StudentTable';
import ImportExcel from '@/components/ImportExcel';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Sheet, 
  SheetContent, 
  SheetDescription, 
  SheetHeader, 
  SheetTitle, 
  SheetTrigger,
  SheetFooter
} from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { ArrowLeft, Plus, User, FileUp, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import db from '@/db/database';
import { Curso, Estudiante } from '@/models/types';

const Students = () => {
  const [searchParams] = useSearchParams();
  const cursoIdParam = searchParams.get('curso');
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [cursoSeleccionado, setCursoSeleccionado] = useState<number | null>(cursoIdParam ? parseInt(cursoIdParam) : null);
  const [estudiantes, setEstudiantes] = useState<Estudiante[]>([]);
  const [estudianteEditando, setEstudianteEditando] = useState<Estudiante | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    activo: true
  });
  
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
    } else {
      setEstudiantes([]);
    }
  }, [cursoSeleccionado]);
  
  const cargarEstudiantes = async (cursoId: number) => {
    try {
      setIsLoading(true);
      
      // Cargar estudiantes del curso
      const estudiantesCurso = await db.estudiantes
        .where('cursoId')
        .equals(cursoId)
        .toArray();
      
      setEstudiantes(estudiantesCurso);
    } catch (error) {
      console.error('Error al cargar estudiantes:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };
  
  const handleSwitchChange = (checked: boolean) => {
    setFormData({
      ...formData,
      activo: checked
    });
  };
  
  const handleEdit = (estudiante: Estudiante) => {
    setEstudianteEditando(estudiante);
    setFormData({
      nombre: estudiante.nombre,
      apellido: estudiante.apellido,
      activo: estudiante.activo
    });
    setIsSheetOpen(true);
  };
  
  const handleDelete = async (id: number) => {
    try {
      await db.estudiantes.delete(id);
      toast({
        title: "Eliminado",
        description: "Estudiante eliminado correctamente"
      });
      
      // Recargar la lista
      if (cursoSeleccionado) {
        cargarEstudiantes(cursoSeleccionado);
      }
    } catch (error) {
      console.error('Error al eliminar estudiante:', error);
      toast({
        title: "Error",
        description: "No se pudo eliminar el estudiante",
        variant: "destructive"
      });
    }
  };
  
  const resetForm = () => {
    setFormData({
      nombre: '',
      apellido: '',
      activo: true
    });
    setEstudianteEditando(null);
  };
  
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!cursoSeleccionado) {
      toast({
        title: "Error",
        description: "Selecciona un curso primero",
        variant: "destructive"
      });
      return;
    }
    
    try {
      if (estudianteEditando) {
        // Actualizar estudiante existente
        await db.estudiantes.update(estudianteEditando.id!, {
          ...formData
        });
        
        toast({
          title: "Actualizado",
          description: "Estudiante actualizado correctamente"
        });
      } else {
        // Crear nuevo estudiante
        await db.estudiantes.add({
          ...formData,
          cursoId: cursoSeleccionado
        });
        
        toast({
          title: "Agregado",
          description: "Estudiante agregado correctamente"
        });
      }
      
      // Cerrar el sheet y recargar la lista
      setIsSheetOpen(false);
      resetForm();
      
      if (cursoSeleccionado) {
        cargarEstudiantes(cursoSeleccionado);
      }
    } catch (error) {
      console.error('Error al guardar estudiante:', error);
      toast({
        title: "Error",
        description: "No se pudo guardar el estudiante",
        variant: "destructive"
      });
    }
  };
  
  const handleImportComplete = async (estudiantes: Estudiante[]) => {
    if (!cursoSeleccionado || estudiantes.length === 0) return;
    
    try {
      // Agregar los estudiantes a la base de datos
      await db.transaction('rw', db.estudiantes, async () => {
        for (const estudiante of estudiantes) {
          await db.estudiantes.add(estudiante);
        }
      });
      
      // Recargar la lista
      cargarEstudiantes(cursoSeleccionado);
      
      toast({
        title: "Importación completada",
        description: `Se agregaron ${estudiantes.length} estudiantes`
      });
    } catch (error) {
      console.error('Error al importar estudiantes:', error);
      toast({
        title: "Error",
        description: "No se pudieron importar los estudiantes",
        variant: "destructive"
      });
    }
  };
  
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
            <h1 className="text-3xl font-bold text-gray-900">Gestión de Estudiantes</h1>
            <p className="text-gray-500 mt-1">Administra los estudiantes de tus cursos</p>
          </div>
        </div>
        
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Seleccionar Curso</CardTitle>
            <CardDescription>
              Selecciona el curso para ver y gestionar sus estudiantes
            </CardDescription>
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
        
        {cursoSeleccionado && (
          <Tabs defaultValue="list" className="w-full">
            <TabsList className="grid w-full md:w-[400px] grid-cols-2 mb-8">
              <TabsTrigger value="list">Lista de Estudiantes</TabsTrigger>
              <TabsTrigger value="import">Importar desde Excel</TabsTrigger>
            </TabsList>
            
            <TabsContent value="list">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Estudiantes</h2>
                
                <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                  <SheetTrigger asChild>
                    <Button onClick={resetForm}>
                      <Plus className="h-4 w-4 mr-2" />
                      Agregar Estudiante
                    </Button>
                  </SheetTrigger>
                  <SheetContent>
                    <SheetHeader>
                      <SheetTitle>
                        {estudianteEditando ? "Editar Estudiante" : "Agregar Estudiante"}
                      </SheetTitle>
                      <SheetDescription>
                        {estudianteEditando 
                          ? "Actualiza la información del estudiante" 
                          : "Completa el formulario para agregar un nuevo estudiante"}
                      </SheetDescription>
                    </SheetHeader>
                    
                    <form onSubmit={handleFormSubmit} className="space-y-6 py-6">
                      <div className="space-y-2">
                        <Label htmlFor="nombre">Nombre</Label>
                        <Input
                          id="nombre"
                          name="nombre"
                          placeholder="Nombre del estudiante"
                          value={formData.nombre}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="apellido">Apellido</Label>
                        <Input
                          id="apellido"
                          name="apellido"
                          placeholder="Apellido del estudiante"
                          value={formData.apellido}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="activo"
                          checked={formData.activo}
                          onCheckedChange={handleSwitchChange}
                        />
                        <Label htmlFor="activo">Estudiante activo</Label>
                      </div>
                      
                      <SheetFooter>
                        <Button type="submit">
                          <Check className="h-4 w-4 mr-2" />
                          {estudianteEditando ? "Actualizar" : "Guardar"}
                        </Button>
                      </SheetFooter>
                    </form>
                  </SheetContent>
                </Sheet>
              </div>
              
              {isLoading ? (
                <div className="flex justify-center py-12">
                  <div className="animate-pulse text-center">
                    <p className="text-gray-500">Cargando estudiantes...</p>
                  </div>
                </div>
              ) : (
                <StudentTable 
                  estudiantes={estudiantes}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              )}
            </TabsContent>
            
            <TabsContent value="import" className="space-y-4">
              <div className="max-w-xl mx-auto">
                <ImportExcel 
                  cursoId={cursoSeleccionado} 
                  onImportComplete={handleImportComplete}
                />
              </div>
            </TabsContent>
          </Tabs>
        )}
        
        {!cursoSeleccionado && !isLoading && (
          <Card className="bg-white shadow-sm border border-gray-200">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <User className="h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-xl font-medium text-gray-900 mb-2">Selecciona un curso</h3>
              <p className="text-gray-500 mb-4 text-center max-w-md">
                Selecciona un curso para ver y gestionar sus estudiantes
              </p>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
};

export default Students;
