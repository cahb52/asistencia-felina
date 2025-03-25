
import React from 'react';
import { 
  Table, 
  TableHeader, 
  TableBody, 
  TableRow, 
  TableHead, 
  TableCell 
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Edit, Trash2 } from 'lucide-react';
import { Estudiante } from '@/models/types';

interface StudentTableProps {
  estudiantes: Estudiante[];
  onEdit: (estudiante: Estudiante) => void;
  onDelete: (id: number) => void;
}

const StudentTable: React.FC<StudentTableProps> = ({
  estudiantes,
  onEdit,
  onDelete
}) => {
  return (
    <div className="w-full overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nombre</TableHead>
            <TableHead>Apellido</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {estudiantes.length === 0 ? (
            <TableRow>
              <TableCell colSpan={4} className="text-center py-6 text-gray-500">
                No hay estudiantes registrados
              </TableCell>
            </TableRow>
          ) : (
            estudiantes.map((estudiante) => (
              <TableRow key={estudiante.id} className="hover:bg-gray-50">
                <TableCell className="font-medium">{estudiante.nombre}</TableCell>
                <TableCell>{estudiante.apellido}</TableCell>
                <TableCell>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    estudiante.activo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {estudiante.activo ? 'Activo' : 'Inactivo'}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button 
                      variant="ghost" 
                      size="icon"
                      className="h-8 w-8 text-gray-500 hover:text-primary"
                      onClick={() => onEdit(estudiante)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      className="h-8 w-8 text-gray-500 hover:text-red-600"
                      onClick={() => {
                        if (window.confirm('¿Estás seguro de que deseas eliminar este estudiante?')) {
                          onDelete(estudiante.id!);
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default StudentTable;
