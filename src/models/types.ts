
// Usuario (Profesor)
export interface Usuario {
  id?: number;
  nombre: string;
  correo: string;
  contraseña: string;
}

// Curso
export interface Curso {
  id?: number;
  nombre: string;
  grado: string;
  seccion: string;
  profesorId: number;
}

// Estudiante
export interface Estudiante {
  id?: number;
  nombre: string;
  apellido: string;
  cursoId: number;
  activo: boolean;
}

// Estados de asistencia
export type EstadoAsistencia = 'presente' | 'ausente' | 'permiso' | 'otro';

// Asistencia
export interface Asistencia {
  id?: number;
  estudianteId: number;
  cursoId: number;
  fecha: string; // formato ISO YYYY-MM-DD
  estado: EstadoAsistencia;
  comentario?: string;
}

// Usuario en sesión
export interface SesionUsuario {
  id: number;
  nombre: string;
  correo: string;
}
