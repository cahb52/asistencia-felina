
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { BookOpen } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import db from '@/db/database';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Verificar credenciales
      const usuario = await db.usuarios
        .where('correo')
        .equals(email)
        .first();

      if (!usuario || usuario.contraseña !== password) {
        throw new Error('Credenciales incorrectas');
      }

      // Guardar sesión (en una aplicación real usaríamos tokens JWT)
      sessionStorage.setItem('usuario', JSON.stringify({
        id: usuario.id,
        nombre: usuario.nombre,
        correo: usuario.correo
      }));

      toast({
        title: "Inicio de sesión exitoso",
        description: `Bienvenido, ${usuario.nombre}`,
      });

      // Redirigir al dashboard
      navigate('/dashboard');
    } catch (error) {
      console.error('Error al iniciar sesión:', error);
      toast({
        title: "Error al iniciar sesión",
        description: error instanceof Error ? error.message : "Error desconocido",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 p-4">
      <div className="w-full max-w-md animate-in-slide">
        <div className="flex flex-col items-center mb-8">
          <BookOpen className="h-12 w-12 text-primary mb-2" />
          <h1 className="text-3xl font-bold text-gray-900">AsistenciaFelina</h1>
          <p className="text-gray-500 mt-1">Sistema de Asistencia Escolar</p>
        </div>
        
        <Card className="w-full glass-effect">
          <CardHeader>
            <CardTitle className="text-2xl text-center">Iniciar Sesión</CardTitle>
            <CardDescription className="text-center">
              Ingresa tus credenciales para acceder
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Correo Electrónico</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="usuario@escuela.edu.gt"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Contraseña</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'Verificando...' : 'Ingresar'}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex justify-center">
            <p className="text-sm text-muted-foreground">
              Datos de prueba: demo@escuela.edu.gt / demo123
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default Login;
