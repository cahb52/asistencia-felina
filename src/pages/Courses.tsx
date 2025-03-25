
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '@/components/Navbar';
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
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Table, 
  TableHeader, 
  TableBody, 
  TableRow, 
  TableHead, 
  TableCell 
} from '@/components/ui/table';
import { ArrowLeft, Plus, Edit, Trash2, BookOpen } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import db from '@/db/database';
import { Curso, SesionUsuario } from '@/models/types';

const Courses = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [usuario, setUsuario] = useState<SesionUsuario | null>(null);
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [cursoEditando, setCursoEditando] = useState<Curso | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [formData, setFormData] = useState({
    nombre: '',
    grado: '',
    seccion: ''
  });
  
  // Cargar datos iniciales
  useEffect(() => {
    const usuarioGuardado = sessionStorage.getItem('usuario');
    if (!usuarioGuardado) {
      navigate('/');
      return;
    }
    
    setUsuario(JSON.parse(usuarioGuardado));
    
    const cargarCursos = async () => {
      try {
        setIsLoading(true);
        const usuarioId = JSON.parse(usuarioGuardado).id;
        
        // Cargar cursos del profesor
        const cursosProfesor = await db.cursos
          .where('profesorId')
          .equals(usuarioId)
          .toArray();
        
        setCursos(cursosProfesor);
      } catch (error) {
        console.error('Error al cargar cursos:', error);
        toast({
          title: "Error",
          description: "No se pudieron cargar los cursos",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    cargarCursos();
  }, [navigate, toast]);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };
  
  const handleEdit = (curso: Curso) => {
    setCursoEditando(curso);
    setFormData({
      nombre: curso.nombre,
      grado: curso.grado,
      seccion: curso.seccion
    });
    setIsDialogOpen(true);
  };
  
  const handleDelete = async (id: number) => {
    // Verificar si hay estudiantes en este curso
    const estudiantesCount = await db.estudiantes
      .where('cursoId')
      .equals(id)
      .count();
    
    if (estudiantesCount > 0) {
      toast({
        title: "No se puede eliminar",
        description: "Este curso tiene estudiantes registrados. Elimina los estudiantes primero.",
        variant: "destructive"
      });
      return;
    }
    
    try {
      await db.cursos.delete(id);
      toast({
        title: "Eliminado",
        description: "Curso eliminado correctamente"
      });
      
      // Recargar la lista
      cargarCursos();
    } catch (error) {
      console.error('Error al eliminar curso:', error);
      toast({
        title: "Error",
        description: "No se pudo eliminar el curso",
        variant: "destructive"
      });
    }
  };
  
  const resetForm = () => {
    setFormData({
      nombre: '',
      grado: '',
      seccion: ''
    });
    setCursoEditando(null);
  };
  
  const cargarCursos = async () => {
    try {
      if (!usuario) return;
      
      // Cargar cursos del profesor
      const cursosProfesor = await db.cursos
        .where('profesorId')
        .equals(usuario.id)
        .toArray();
      
      setCursos(cursosProfesor);
    } catch (error) {
      console.error('Error al cargar cursos:', error);
    }
  };
  
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!usuario) {
      toast({
        title: "Error",
        description: "No hay un usuario en sesión",
        variant: "destructive"
      });
      return;
    }
    
    try {
      if (cursoEditando) {
        // Actualizar curso existente
        await db.cursos.update(cursoEditando.id!, {
          ...formData
        });
        
        toast({
          title: "Actualizado",
          description: "Curso actualizado correctamente"
        });
      } else {
        // Crear nuevo curso
        await db.cursos.add({
          ...formData,
          profesorId: usuario.id
        });
        
        toast({
          title: "Agregado",
          description: "Curso agregado correctamente"
        });
      }
      
      // Cerrar el diálogo y recargar la lista
      setIsDialogOpen(false);
      resetForm();
      cargarCursos();
    } catch (error) {
      console.error('Error al guardar curso:', error);
      toast({
        title: "Error",
        description: "No se pudo guardar el curso",
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
            <h1 className="text-3xl font-bold text-gray-900">Gestión de Cursos</h1>
            <p className="text-gray-500 mt-1">Administra los cursos, grados y secciones</p>
          </div>
        </div>
        
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Tus Cursos</h2>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="h-4 w-4 mr-2" />
                Nuevo Curso
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {cursoEditando ? "Editar Curso" : "Nuevo Curso"}
                </DialogTitle>
                <DialogDescription>
                  {cursoEditando 
                    ? "Actualiza la información del curso" 
                    : "Completa el formulario para crear un nuevo curso"}
                </DialogDescription>
              </DialogHeader>
              
              <form onSubmit={handleFormSubmit} className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="nombre">Nombre del Curso</Label>
                  <Input
                    id="nombre"
                    name="nombre"
                    placeholder="Ej: Matemáticas"
                    value={formData.nombre}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="grado">Grado</Label>
                  <Input
                    id="grado"
                    name="grado"
                    placeholder="Ej: 1ro Básico"
                    value={formData.grado}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="seccion">Sección</Label>
                  <Input
                    id="seccion"
                    name="seccion"
                    placeholder="Ej: A"
                    value={formData.seccion}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                
                <DialogFooter>
                  <Button type="submit">
                    {cursoEditando ? "Actualizar" : "Guardar"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
        
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-pulse text-center">
              <p className="text-gray-500">Cargando cursos...</p>
            </div>
          </div>
        ) : cursos.length === 0 ? (
          <Card className="bg-white shadow-sm border border-gray-200">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <BookOpen className="h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-xl font-medium text-gray-900 mb-2">No tienes cursos registrados</h3>
              <p className="text-gray-500 mb-4 text-center max-w-md">
                Agrega un curso para comenzar a gestionar estudiantes y asistencia
              </p>
              <Button onClick={() => setIsDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Agregar Curso
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Grado</TableHead>
                  <TableHead>Sección</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cursos.map((curso) => (
                  <TableRow key={curso.id} className="hover:bg-gray-50">
                    <TableCell className="font-medium">{curso.nombre}</TableCell>
                    <TableCell>{curso.grado}</TableCell>
                    <TableCell>{curso.seccion}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button 
                          variant="ghost" 
                          size="icon"
                          className="h-8 w-8 text-gray-500 hover:text-primary"
                          onClick={() => handleEdit(curso)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          className="h-8 w-8 text-gray-500 hover:text-red-600"
                          onClick={() => {
                            if (window.confirm('¿Estás seguro de que deseas eliminar este curso?')) {
                              handleDelete(curso.id!);
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </main>
    </div>
  );
};

export default Courses;
