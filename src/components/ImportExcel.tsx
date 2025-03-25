
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileUp, Check } from 'lucide-react';
import * as XLSX from 'xlsx';
import { useToast } from '@/hooks/use-toast';
import { Estudiante } from '@/models/types';

interface ImportExcelProps {
  cursoId: number;
  onImportComplete: (estudiantes: Estudiante[]) => void;
}

const ImportExcel: React.FC<ImportExcelProps> = ({ cursoId, onImportComplete }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const handleImport = async () => {
    if (!file) {
      toast({
        title: "Error",
        description: "Por favor selecciona un archivo Excel",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);

    try {
      const data = await readExcel(file);
      
      if (!data || data.length === 0) {
        throw new Error("El archivo no contiene datos");
      }

      // Validar estructura del archivo
      const requiredFields = ['nombre', 'apellido'];
      const firstRow = data[0];
      
      const missingFields = requiredFields.filter(
        field => !Object.keys(firstRow).map(k => k.toLowerCase()).includes(field)
      );

      if (missingFields.length > 0) {
        throw new Error(`Faltan columnas requeridas: ${missingFields.join(', ')}`);
      }

      // Transformar datos
      const estudiantes: Estudiante[] = data.map(row => ({
        nombre: row.nombre || row.Nombre || '',
        apellido: row.apellido || row.Apellido || '',
        cursoId: cursoId,
        activo: true
      }));

      // Devolver los estudiantes al componente padre
      onImportComplete(estudiantes);
      
      toast({
        title: "Importación exitosa",
        description: `Se importaron ${estudiantes.length} estudiantes`,
        variant: "default",
      });
      
      // Limpiar el input de archivo
      setFile(null);
      
    } catch (error) {
      console.error('Error al importar:', error);
      toast({
        title: "Error al importar",
        description: error instanceof Error ? error.message : "Error desconocido",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const readExcel = (file: File): Promise<any[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const data = e.target?.result;
          const workbook = XLSX.read(data, { type: 'binary' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const json = XLSX.utils.sheet_to_json(worksheet);
          resolve(json);
        } catch (error) {
          reject(new Error('Error al procesar el archivo Excel'));
        }
      };
      
      reader.onerror = () => {
        reject(new Error('Error al leer el archivo'));
      };
      
      reader.readAsBinaryString(file);
    });
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-xl">Importar Estudiantes</CardTitle>
        <CardDescription>
          Importa estudiantes desde un archivo Excel (.xlsx)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid w-full items-center gap-1.5">
            <Input
              id="excel-file"
              type="file"
              accept=".xlsx, .xls"
              onChange={handleFileChange}
              className="cursor-pointer"
            />
            {file && (
              <p className="text-sm text-muted-foreground flex items-center">
                <Check className="h-3 w-3 mr-1 text-green-500" />
                {file.name}
              </p>
            )}
          </div>
          
          <Button 
            onClick={handleImport} 
            disabled={!file || isUploading}
            className="w-full"
          >
            <FileUp className="h-4 w-4 mr-2" />
            {isUploading ? 'Importando...' : 'Importar Estudiantes'}
          </Button>
          
          <div className="text-sm text-muted-foreground mt-4">
            <p className="font-medium">Formato requerido:</p>
            <p>El archivo Excel debe contener las columnas: <strong>Nombre</strong>, <strong>Apellido</strong></p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ImportExcel;
