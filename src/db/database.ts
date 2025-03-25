
import Dexie, { Table } from 'dexie';
import { Curso, Estudiante, Asistencia, Usuario } from '../models/types';

class AsistenciaDB extends Dexie {
  usuarios!: Table<Usuario>;
  cursos!: Table<Curso>;
  estudiantes!: Table<Estudiante>;
  asistencias!: Table<Asistencia>;

  constructor() {
    super('asistenciaFelina');
    
    this.version(1).stores({
      usuarios: '++id, nombre, correo, contraseña',
      cursos: '++id, nombre, grado, seccion, profesorId',
      estudiantes: '++id, nombre, apellido, cursoId, activo',
      asistencias: '++id, estudianteId, cursoId, fecha, estado, comentario'
    });
  }
}

const db = new AsistenciaDB();

// Agregar datos iniciales si la base de datos está vacía
async function initializeDatabase() {
  const usuariosCount = await db.usuarios.count();
  
  if (usuariosCount === 0) {
    // Agregar usuario de prueba
    await db.usuarios.add({
      nombre: 'Profesor Demo',
      correo: 'demo@escuela.edu.gt',
      contraseña: 'demo123' // En una aplicación real, esto debería estar hasheado
    });
    
    console.log('Base de datos inicializada con datos de prueba');
  }
}

initializeDatabase().catch(error => {
  console.error('Error inicializando la base de datos:', error);
});

export default db;
