
import React from 'react';
import PageHeaderCard from '@/components/dashboard/PageHeaderCard';
import { Upload, FileImage, Layers, Download } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';

const PainelEditavel = () => {
  const { user } = useAuth();
  const currentPlan = user ? localStorage.getItem(`user_plan_${user.id}`) || "Pré-Pago" : "Pré-Pago";

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeaderCard 
        title="Editável Matriz"
        subtitle="Arquivos em .CDR ou .PSD"
        currentPlan={currentPlan}
        isControlPanel={false}
      />

      {/* Ferramentas de Edição */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="bg-white/75 dark:bg-gray-800/75 border-gray-200/75 dark:border-gray-700/75 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5 text-blue-600" />
              Upload CDR/PSD
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Faça upload de arquivos .CDR ou .PSD para edição
            </p>
            <Button className="w-full">
              <Upload className="h-4 w-4 mr-2" />
              Fazer Upload
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-white/75 dark:bg-gray-800/75 border-gray-200/75 dark:border-gray-700/75 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileImage className="h-5 w-5 text-green-600" />
              Editor de Imagens
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Edite imagens diretamente no navegador
            </p>
            <Button className="w-full" variant="outline">
              <FileImage className="h-4 w-4 mr-2" />
              Abrir Editor
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-white/75 dark:bg-gray-800/75 border-gray-200/75 dark:border-gray-700/75 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Layers className="h-5 w-5 text-purple-600" />
              Gerenciar Camadas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Gerencie camadas e elementos dos arquivos
            </p>
            <Button className="w-full" variant="outline">
              <Layers className="h-4 w-4 mr-2" />
              Ver Camadas
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PainelEditavel;
