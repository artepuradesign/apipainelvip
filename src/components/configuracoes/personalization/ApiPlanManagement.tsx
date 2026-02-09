import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Crown, Plus, RefreshCw, Loader2, AlertCircle } from 'lucide-react';
import { useApiPlans } from '@/hooks/useApiPlans';
import EmptyState from '@/components/ui/empty-state';
import ApiPlanForm from './ApiPlanForm';
import ApiPlansCardView from './ApiPlansCardView';

const ApiPlanManagement = () => {
  const { plans, isLoading, createPlan, updatePlan, deletePlan, loadPlans, togglePlanStatus } = useApiPlans();
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [showForm, setShowForm] = useState(false);

  const handleCreatePlan = () => {
    setSelectedPlan(null);
    setShowForm(true);
  };

  const handleEditPlan = (plan: any) => {
    setSelectedPlan(plan);
    setShowForm(true);
  };

  const handleToggleStatus = async (id: number) => {
    try {
      await togglePlanStatus(id);
    } catch (error) {
      console.error('Erro ao alterar status do plano:', error);
    }
  };

  const handleFormSubmit = async (planData: any) => {
    try {
      if (selectedPlan) {
        await updatePlan(selectedPlan.id, planData);
      } else {
        await createPlan(planData);
      }
      setShowForm(false);
      setSelectedPlan(null);
    } catch (error) {
      console.error('Erro ao salvar plano:', error);
    }
  };

  const handleFormCancel = () => {
    setShowForm(false);
    setSelectedPlan(null);
  };

  const handleDeletePlan = async (id: number) => {
    if (window.confirm('Tem certeza que deseja excluir este plano?')) {
      try {
        await deletePlan(id);
      } catch (error) {
        console.error('Erro ao excluir plano:', error);
      }
    }
  };

  if (showForm) {
    return (
      <ApiPlanForm
        plan={selectedPlan}
        onSubmit={handleFormSubmit}
        onCancel={handleFormCancel}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Gerenciamento de Planos (API)
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Configure planos do sistema via API externa
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={loadPlans}
            variant="outline"
            size="sm"
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
          <Button
            onClick={handleCreatePlan}
            className="bg-blue-600 hover:bg-blue-700"
            disabled={isLoading}
          >
            <Plus className="h-4 w-4 mr-2" />
            Novo Plano
          </Button>
        </div>
      </div>

      {isLoading ? (
        <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <CardContent className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <span className="ml-2 text-gray-600">Carregando planos...</span>
          </CardContent>
        </Card>
      ) : plans.length === 0 ? (
        <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <CardContent className="py-12">
            <EmptyState 
              icon={AlertCircle}
              title="Nenhum plano encontrado"
              description="Comece criando seu primeiro plano para que os usuários possam assinar."
            />
            <div className="flex justify-center mt-6">
              <Button onClick={handleCreatePlan} className="bg-blue-600 hover:bg-blue-700">
                <Plus className="h-4 w-4 mr-2" />
                Criar Primeiro Plano
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <ApiPlansCardView
          plans={plans}
          onEdit={handleEditPlan}
          onDelete={handleDeletePlan}
          onToggleStatus={handleToggleStatus}
        />
      )}
    </div>
  );
};

export default ApiPlanManagement;
