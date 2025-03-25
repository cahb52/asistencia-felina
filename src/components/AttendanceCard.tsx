
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, X, Clock, HelpCircle } from 'lucide-react';
import { EstadoAsistencia } from '@/models/types';

interface AttendanceCardProps {
  nombre: string;
  apellido: string;
  estadoActual?: EstadoAsistencia;
  onStatusChange: (estado: EstadoAsistencia) => void;
}

const AttendanceCard: React.FC<AttendanceCardProps> = ({
  nombre,
  apellido,
  estadoActual,
  onStatusChange,
}) => {
  return (
    <Card className="w-full overflow-hidden card-hover">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium">
          {nombre} {apellido}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm text-gray-500">Estado:</span>
          {estadoActual && (
            <Badge 
              className={`
                ${estadoActual === 'presente' ? 'bg-green-100 text-green-800' : ''} 
                ${estadoActual === 'ausente' ? 'bg-red-100 text-red-800' : ''} 
                ${estadoActual === 'permiso' ? 'bg-amber-100 text-amber-800' : ''} 
                ${estadoActual === 'otro' ? 'bg-gray-100 text-gray-800' : ''}
              `}
            >
              {estadoActual === 'presente' && 'Presente'}
              {estadoActual === 'ausente' && 'Ausente'}
              {estadoActual === 'permiso' && 'Permiso'}
              {estadoActual === 'otro' && 'Otro'}
            </Badge>
          )}
        </div>
        
        <div className="grid grid-cols-2 gap-2">
          <Button 
            size="sm" 
            variant={estadoActual === 'presente' ? 'default' : 'outline'} 
            className={estadoActual === 'presente' ? 'bg-green-600 hover:bg-green-700' : 'hover:border-green-600 hover:text-green-600'}
            onClick={() => onStatusChange('presente')}
          >
            <Check className="h-4 w-4 mr-1" /> Presente
          </Button>
          
          <Button 
            size="sm" 
            variant={estadoActual === 'ausente' ? 'default' : 'outline'} 
            className={estadoActual === 'ausente' ? 'bg-red-600 hover:bg-red-700' : 'hover:border-red-600 hover:text-red-600'}
            onClick={() => onStatusChange('ausente')}
          >
            <X className="h-4 w-4 mr-1" /> Ausente
          </Button>
          
          <Button 
            size="sm" 
            variant={estadoActual === 'permiso' ? 'default' : 'outline'} 
            className={estadoActual === 'permiso' ? 'bg-amber-600 hover:bg-amber-700' : 'hover:border-amber-600 hover:text-amber-600'}
            onClick={() => onStatusChange('permiso')}
          >
            <Clock className="h-4 w-4 mr-1" /> Permiso
          </Button>
          
          <Button 
            size="sm" 
            variant={estadoActual === 'otro' ? 'default' : 'outline'} 
            className={estadoActual === 'otro' ? 'bg-gray-600 hover:bg-gray-700' : 'hover:border-gray-600 hover:text-gray-600'}
            onClick={() => onStatusChange('otro')}
          >
            <HelpCircle className="h-4 w-4 mr-1" /> Otro
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default AttendanceCard;
