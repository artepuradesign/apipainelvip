import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TrendingUp, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useApiDashboardAdmin } from '@/hooks/useApiDashboardAdmin';
import { formatDate } from '@/utils/historicoUtils';
import DashboardTitleCard from '@/components/dashboard/DashboardTitleCard';

const AdminRecargas = () => {
  const navigate = useNavigate();
  const { transactions, loadTransactions, isLoading, stats } = useApiDashboardAdmin();
  const [displayLimit, setDisplayLimit] = useState(50);

  useEffect(() => {
    loadTransactions(100);
  }, []);

  const recargaTransactions = transactions.filter(t => 
    t.description?.toLowerCase().includes('recarga') || 
    t.description?.toLowerCase().includes('depósito') ||
    t.type === 'recharge'
  );

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <DashboardTitleCard
        title="Total em Recargas"
        subtitle="Histórico completo de recargas de saldo"
        icon={<TrendingUp className="h-4 w-4 sm:h-5 sm:w-5" />}
        backTo="/dashboard/admin"
        right={
          <Button
            onClick={() => loadTransactions(100)}
            disabled={isLoading}
            variant="outline"
            size="sm"
            className="h-8 sm:h-9"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline ml-2">Atualizar</span>
          </Button>
        }
      />

      {/* Resumo */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-6 sm:pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Total Recebido</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
            <div className="text-xl sm:text-2xl font-bold text-blue-600">
              {formatCurrency(stats?.total_recharges || 0)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-6 sm:pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Total de Recargas</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
            <div className="text-xl sm:text-2xl font-bold">
              {recargaTransactions.length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-6 sm:pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Recarga Média</CardTitle>
            <TrendingUp className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
            <div className="text-xl sm:text-2xl font-bold">
              {formatCurrency(recargaTransactions.length ? (stats?.total_recharges || 0) / recargaTransactions.length : 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Recargas - Mobile First */}
      <Card>
        <CardHeader className="p-3 sm:p-6">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base sm:text-lg">Histórico de Recargas</CardTitle>
            <Badge variant="secondary" className="text-xs">
              {recargaTransactions.length} recargas
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-3 sm:p-6 pt-0 sm:pt-0">
          {isLoading ? (
            <div className="text-center py-8">
              <RefreshCw className="h-8 w-8 animate-spin text-blue-500 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">Carregando recargas...</p>
            </div>
          ) : recargaTransactions.length > 0 ? (
            <div className="space-y-3">
              {recargaTransactions.slice(0, displayLimit).map((transaction, index) => (
                <div 
                  key={transaction.id || index}
                  className="border rounded-lg p-3 sm:p-4 space-y-2 bg-card border-l-4 border-l-green-500"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs sm:text-sm text-muted-foreground">
                      {formatDate(transaction.created_at)}
                    </span>
                    <Badge variant="default" className="text-xs">Concluído</Badge>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm sm:text-base truncate">
                        {transaction.user_name || 'N/A'}
                      </p>
                      <div className="flex gap-2 text-xs text-muted-foreground">
                        <span>Antes: {formatCurrency(transaction.balance_before || 0)}</span>
                        <span>→</span>
                        <span>Depois: {formatCurrency(transaction.balance_after || 0)}</span>
                      </div>
                    </div>
                    <div className="text-right ml-3">
                      <p className="font-bold text-sm sm:text-base text-green-600">
                        {formatCurrency(transaction.amount)}
                      </p>
                      <Badge variant="outline" className="text-xs">
                        {transaction.payment_method || 'N/A'}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}

              {recargaTransactions.length > displayLimit && (
                <div className="text-center pt-2">
                  <Button 
                    variant="outline" 
                    onClick={() => setDisplayLimit(prev => prev + 50)}
                    className="w-full sm:w-auto"
                  >
                    Carregar mais ({recargaTransactions.length - displayLimit} restantes)
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <TrendingUp className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500 dark:text-gray-400">
                Nenhuma recarga registrada
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminRecargas;
