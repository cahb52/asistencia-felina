
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Table, 
  TableBody, 
  TableCaption, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { 
  ChartContainer, 
  ChartTooltip, 
  ChartTooltipContent 
} from '@/components/ui/chart';
import { format } from 'date-fns';
import { CalendarRange, ChartBar, Download, FileSpreadsheet, ArrowLeft } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import * as XLSX from 'xlsx';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import db from '@/db/database';
import { Curso, Estudiante, Asistencia, EstadoAsistencia } from '@/models/types';

interface DateRange {
  from: Date;
  to: Date | undefined;
}

interface AsistenciaStats {
  presente: number;
  ausente: number;
  permiso: number;
  otro: number;
  total: number;
}

interface AsistenciaReporte {
  fecha: string;
  cursoNombre: string;
  estudianteNombre: string;
  estadoAsistencia: EstadoAsistencia;
  comentario?: string;
}

const COLORS = ['#10b981', '#ef4444', '#6366f1', '#f59e0b'];

const Reports = () => {
  const navigate = useNavigate();
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [cursoSeleccionado, setCursoSeleccionado] = useState<number | null>(null);
  const [dateRange, setDateRange] = useState<DateRange>({
    from: new Date(new Date().setDate(new Date().getDate() - 30)), // Last 30 days by default
    to: new Date()
  });
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [asistenciasStats, setAsistenciasStats] = useState<AsistenciaStats>({
    presente: 0,
    ausente: 0,
    permiso: 0,
    otro: 0,
    total: 0
  });
  const [asistenciasReporte, setAsistenciasReporte] = useState<AsistenciaReporte[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const usuarioGuardado = sessionStorage.getItem('usuario');
    if (!usuarioGuardado) {
      navigate('/');
      return;
    }

    const cargarDatos = async () => {
      try {
        const usuarioId = JSON.parse(usuarioGuardado).id;
        
        // Cargar cursos del profesor
        const cursosProfesor = await db.cursos
          .where('profesorId')
          .equals(usuarioId)
          .toArray();
        
        setCursos(cursosProfesor);
        
        if (cursosProfesor.length > 0) {
          setCursoSeleccionado(cursosProfesor[0].id as number);
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
  }, [navigate]);

  // Cuando cambia el curso seleccionado o el rango de fechas
  useEffect(() => {
    if (cursoSeleccionado) {
      cargarAsistencias(cursoSeleccionado, dateRange);
    }
  }, [cursoSeleccionado, dateRange]);

  const cargarAsistencias = async (cursoId: number, range: DateRange) => {
    if (!range.from || !range.to) return;
    
    try {
      setIsLoading(true);
      
      const fromDate = format(range.from, 'yyyy-MM-dd');
      const toDate = format(range.to, 'yyyy-MM-dd');
      
      // Obtener asistencias en el rango de fechas
      let asistencias = await db.asistencias
        .where('cursoId')
        .equals(cursoId)
        .toArray();
      
      // Filtrar por rango de fechas
      asistencias = asistencias.filter(a => {
        const fecha = a.fecha;
        return fecha >= fromDate && fecha <= toDate;
      });
      
      // Calcular estadísticas
      const stats: AsistenciaStats = {
        presente: 0,
        ausente: 0,
        permiso: 0,
        otro: 0,
        total: asistencias.length
      };
      
      asistencias.forEach(a => {
        if (a.estado === 'presente') stats.presente++;
        else if (a.estado === 'ausente') stats.ausente++;
        else if (a.estado === 'permiso') stats.permiso++;
        else if (a.estado === 'otro') stats.otro++;
      });
      
      setAsistenciasStats(stats);
      
      // Preparar datos para el reporte detallado
      const estudiantes = await db.estudiantes
        .where('cursoId')
        .equals(cursoId)
        .toArray();
      
      const curso = await db.cursos.get(cursoId);
      
      const reporte: AsistenciaReporte[] = [];
      
      for (const asistencia of asistencias) {
        const estudiante = estudiantes.find(e => e.id === asistencia.estudianteId);
        
        if (estudiante && curso) {
          reporte.push({
            fecha: asistencia.fecha,
            cursoNombre: `${curso.nombre} - ${curso.grado} ${curso.seccion}`,
            estudianteNombre: `${estudiante.nombre} ${estudiante.apellido}`,
            estadoAsistencia: asistencia.estado,
            comentario: asistencia.comentario
          });
        }
      }
      
      // Ordenar por fecha (más reciente primero)
      reporte.sort((a, b) => {
        return new Date(b.fecha).getTime() - new Date(a.fecha).getTime();
      });
      
      setAsistenciasReporte(reporte);
    } catch (error) {
      console.error('Error al cargar asistencias:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los datos de asistencia",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const exportToExcel = () => {
    try {
      // Crear una hoja de cálculo para estadísticas
      const statsData = [
        ['Estadísticas de Asistencia', ''],
        ['Período', `${format(dateRange.from, 'dd/MM/yyyy')} - ${format(dateRange.to as Date, 'dd/MM/yyyy')}`],
        ['Curso', cursos.find(c => c.id === cursoSeleccionado)?.nombre || ''],
        ['', ''],
        ['Estado', 'Cantidad'],
        ['Presente', asistenciasStats.presente],
        ['Ausente', asistenciasStats.ausente],
        ['Permiso', asistenciasStats.permiso],
        ['Otro', asistenciasStats.otro],
        ['Total', asistenciasStats.total]
      ];

      // Crear una hoja de cálculo para el reporte detallado
      const reporteData = [
        ['Fecha', 'Curso', 'Estudiante', 'Estado', 'Comentario']
      ];

      asistenciasReporte.forEach(row => {
        reporteData.push([
          format(new Date(row.fecha), 'dd/MM/yyyy'),
          row.cursoNombre,
          row.estudianteNombre,
          row.estadoAsistencia,
          row.comentario || ''
        ]);
      });

      // Crear un libro con ambas hojas
      const wb = XLSX.utils.book_new();
      const statsWs = XLSX.utils.aoa_to_sheet(statsData);
      const reporteWs = XLSX.utils.aoa_to_sheet(reporteData);

      // Añadir las hojas al libro
      XLSX.utils.book_append_sheet(wb, statsWs, 'Estadísticas');
      XLSX.utils.book_append_sheet(wb, reporteWs, 'Reporte Detallado');

      // Exportar el archivo
      XLSX.writeFile(wb, `Reporte_Asistencia_${format(new Date(), 'yyyyMMdd')}.xlsx`);

      toast({
        title: "Éxito",
        description: "Reporte exportado correctamente",
      });
    } catch (error) {
      console.error('Error al exportar a Excel:', error);
      toast({
        title: "Error",
        description: "No se pudo exportar el reporte",
        variant: "destructive",
      });
    }
  };

  // Preparar datos para los gráficos
  const pieData = [
    { name: 'Presente', value: asistenciasStats.presente },
    { name: 'Ausente', value: asistenciasStats.ausente },
    { name: 'Permiso', value: asistenciasStats.permiso },
    { name: 'Otro', value: asistenciasStats.otro }
  ];

  const barData = [
    { name: 'Presente', cantidad: asistenciasStats.presente },
    { name: 'Ausente', cantidad: asistenciasStats.ausente },
    { name: 'Permiso', cantidad: asistenciasStats.permiso },
    { name: 'Otro', cantidad: asistenciasStats.otro }
  ];

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
            <h1 className="text-3xl font-bold text-gray-900">Reportes y Estadísticas</h1>
            <p className="text-gray-500 mt-1">Visualiza y exporta la información de asistencia</p>
          </div>
        </div>
        
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Filtros</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4 md:flex-row">
            <div className="w-full md:w-1/2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Curso</label>
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
            </div>
            
            <div className="w-full md:w-1/2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Rango de Fechas</label>
              <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarRange className="mr-2 h-4 w-4" />
                    {dateRange.from ? (
                      dateRange.to ? (
                        <>
                          {format(dateRange.from, "dd/MM/yyyy")} -{" "}
                          {format(dateRange.to, "dd/MM/yyyy")}
                        </>
                      ) : (
                        format(dateRange.from, "dd/MM/yyyy")
                      )
                    ) : (
                      <span>Selecciona un rango</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="range"
                    selected={dateRange}
                    onSelect={(range) => {
                      if (range?.from && range?.to) {
                        setDateRange(range);
                        setIsCalendarOpen(false);
                      } else if (range?.from) {
                        setDateRange(range);
                      }
                    }}
                    numberOfMonths={2}
                    initialFocus
                    className="p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
          </CardContent>
        </Card>
        
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-pulse text-center">
              <p className="text-gray-500">Cargando datos...</p>
            </div>
          </div>
        ) : cursoSeleccionado ? (
          <>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Resultados</h2>
              <Button 
                variant="outline" 
                onClick={exportToExcel}
                disabled={asistenciasReporte.length === 0}
              >
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                Exportar a Excel
              </Button>
            </div>
            
            <Tabs defaultValue="estadisticas" className="w-full">
              <TabsList className="grid w-full md:w-[400px] grid-cols-2 mb-8">
                <TabsTrigger value="estadisticas">Estadísticas</TabsTrigger>
                <TabsTrigger value="detallado">Reporte Detallado</TabsTrigger>
              </TabsList>
              
              <TabsContent value="estadisticas" className="space-y-6">
                {asistenciasReporte.length === 0 ? (
                  <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                      <h3 className="text-xl font-medium text-gray-900 mb-2">Sin datos</h3>
                      <p className="text-gray-500 mb-4 text-center max-w-md">
                        No hay registros de asistencia para el período seleccionado
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <>
                    <div className="grid gap-6 md:grid-cols-2">
                      <Card>
                        <CardHeader>
                          <CardTitle>Resumen de Asistencia</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="h-80">
                            <ResponsiveContainer width="100%" height="100%">
                              <PieChart>
                                <Pie
                                  data={pieData}
                                  cx="50%"
                                  cy="50%"
                                  labelLine={false}
                                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                  outerRadius={80}
                                  fill="#8884d8"
                                  dataKey="value"
                                >
                                  {pieData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                  ))}
                                </Pie>
                                <Tooltip formatter={(value) => [`${value} registros`, 'Cantidad']} />
                              </PieChart>
                            </ResponsiveContainer>
                          </div>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardHeader>
                          <CardTitle>Distribución de Asistencia</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="h-80">
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart
                                data={barData}
                                margin={{
                                  top: 5,
                                  right: 30,
                                  left: 20,
                                  bottom: 5,
                                }}
                              >
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <Bar dataKey="cantidad" fill="#10b981" />
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                    
                    <Card>
                      <CardHeader>
                        <CardTitle>Estadísticas Numéricas</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Estado</TableHead>
                              <TableHead>Cantidad</TableHead>
                              <TableHead>Porcentaje</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            <TableRow>
                              <TableCell className="font-medium">Presente</TableCell>
                              <TableCell>{asistenciasStats.presente}</TableCell>
                              <TableCell>
                                {asistenciasStats.total > 0 
                                  ? ((asistenciasStats.presente / asistenciasStats.total) * 100).toFixed(1) 
                                  : 0}%
                              </TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell className="font-medium">Ausente</TableCell>
                              <TableCell>{asistenciasStats.ausente}</TableCell>
                              <TableCell>
                                {asistenciasStats.total > 0 
                                  ? ((asistenciasStats.ausente / asistenciasStats.total) * 100).toFixed(1) 
                                  : 0}%
                              </TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell className="font-medium">Permiso</TableCell>
                              <TableCell>{asistenciasStats.permiso}</TableCell>
                              <TableCell>
                                {asistenciasStats.total > 0 
                                  ? ((asistenciasStats.permiso / asistenciasStats.total) * 100).toFixed(1) 
                                  : 0}%
                              </TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell className="font-medium">Otro</TableCell>
                              <TableCell>{asistenciasStats.otro}</TableCell>
                              <TableCell>
                                {asistenciasStats.total > 0 
                                  ? ((asistenciasStats.otro / asistenciasStats.total) * 100).toFixed(1) 
                                  : 0}%
                              </TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell className="font-medium">Total</TableCell>
                              <TableCell>{asistenciasStats.total}</TableCell>
                              <TableCell>100%</TableCell>
                            </TableRow>
                          </TableBody>
                        </Table>
                      </CardContent>
                    </Card>
                  </>
                )}
              </TabsContent>
              
              <TabsContent value="detallado">
                {asistenciasReporte.length === 0 ? (
                  <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                      <h3 className="text-xl font-medium text-gray-900 mb-2">Sin datos</h3>
                      <p className="text-gray-500 mb-4 text-center max-w-md">
                        No hay registros de asistencia para el período seleccionado
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <Card>
                    <CardHeader>
                      <CardTitle>Reporte Detallado de Asistencia</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="relative overflow-x-auto">
                        <Table>
                          <TableCaption>
                            Reporte de asistencia del {format(dateRange.from, "dd/MM/yyyy")} al {format(dateRange.to as Date, "dd/MM/yyyy")}
                          </TableCaption>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Fecha</TableHead>
                              <TableHead>Estudiante</TableHead>
                              <TableHead>Estado</TableHead>
                              <TableHead>Comentario</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {asistenciasReporte.map((registro, index) => (
                              <TableRow key={index}>
                                <TableCell>{format(new Date(registro.fecha), "dd/MM/yyyy")}</TableCell>
                                <TableCell className="font-medium">{registro.estudianteNombre}</TableCell>
                                <TableCell>
                                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                    registro.estadoAsistencia === 'presente' ? 'bg-green-100 text-green-800' :
                                    registro.estadoAsistencia === 'ausente' ? 'bg-red-100 text-red-800' :
                                    registro.estadoAsistencia === 'permiso' ? 'bg-blue-100 text-blue-800' :
                                    'bg-yellow-100 text-yellow-800'
                                  }`}>
                                    {registro.estadoAsistencia}
                                  </span>
                                </TableCell>
                                <TableCell>{registro.comentario || '-'}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            </Tabs>
          </>
        ) : (
          <Card className="bg-white shadow-sm border border-gray-200">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <ChartBar className="h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-xl font-medium text-gray-900 mb-2">Selecciona un curso</h3>
              <p className="text-gray-500 mb-4 text-center max-w-md">
                Selecciona un curso y un rango de fechas para ver los reportes
              </p>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
};

export default Reports;
