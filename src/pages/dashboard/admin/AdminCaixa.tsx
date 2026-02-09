import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DollarSign, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useApiDashboardAdmin } from '@/hooks/useApiDashboardAdmin';
import { formatDate } from '@/utils/historicoUtils';
import DashboardTitleCard from '@/components/dashboard/DashboardTitleCard';

const AdminCaixa = () => {
  const navigate = useNavigate();
  const { transactions, loadTransactions, isLoading } = useApiDashboardAdmin();
  const [displayLimit, setDisplayLimit] = useState(50);

  useEffect(() => {
    loadTransactions(100);
  }, []);

  const filteredTransactions = transactions.filter((transaction) => {
    const isDuplicate = 
      transaction.description?.includes('Comissão por indicação - usuario Leonardo Castro') ||
      transaction.description?.includes('Bônus de indicação por APIPainel') ||
      (transaction.user_name === 'APIPainel' && transaction.description?.includes('Comissão'));

    const method = (transaction.payment_method || '').toLowerCase().trim();
    const allowedMethods = ['pix', 'credit', 'cartao', 'card', 'paypal', 'crypto', 'criptomoeda', 'cripto'];
    const isAllowedMethod = allowedMethods.some((m) => method.includes(m));

    const isCredit = transaction.type === 'credit' || transaction.amount > 0;

    return !isDuplicate && isCredit && isAllowedMethod;
  });

  const totalCaixa = filteredTransactions.reduce((sum, t) => sum + t.amount, 0);

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
        title="Saldo em Caixa"
        subtitle="Detalhamento completo do caixa central"
        icon={<DollarSign className="h-4 w-4 sm:h-5 sm:w-5" />}
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
            <CardTitle className="text-xs sm:text-sm font-medium">Saldo Total</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
            <div className="text-xl sm:text-2xl font-bold text-green-600">
              {formatCurrency(totalCaixa)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-6 sm:pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Total de Transações</CardTitle>
            <DollarSign className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
            <div className="text-xl sm:text-2xl font-bold">
              {filteredTransactions.length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-6 sm:pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Média por Transação</CardTitle>
            <DollarSign className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
            <div className="text-xl sm:text-2xl font-bold">
              {formatCurrency(filteredTransactions.length ? totalCaixa / filteredTransactions.length : 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Transações - Mobile First */}
      <Card>
        <CardHeader className="p-3 sm:p-6">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base sm:text-lg">Histórico de Transações</CardTitle>
            <Badge variant="secondary" className="text-xs">
              {filteredTransactions.length} registros
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-3 sm:p-6 pt-0 sm:pt-0">
          {isLoading ? (
            <div className="text-center py-8">
              <RefreshCw className="h-8 w-8 animate-spin text-blue-500 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">Carregando transações...</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredTransactions.slice(0, displayLimit).map((transaction, index) => (
                <div 
                  key={transaction.id || index}
                  className="border rounded-lg p-3 sm:p-4 space-y-2 bg-card"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs sm:text-sm text-muted-foreground">
                      {formatDate(transaction.created_at)}
                    </span>
                    <Badge variant={transaction.type === 'credit' ? 'default' : 'destructive'} className="text-xs">
                      {transaction.type === 'credit' ? 'Crédito' : 'Débito'}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm sm:text-base truncate">
                        {transaction.user_name || 'N/A'}
                      </p>
                      <p className="text-xs sm:text-sm text-muted-foreground truncate">
                        {transaction.description}
                      </p>
                    </div>
                    <div className="text-right ml-3">
                      <p className={`font-bold text-sm sm:text-base ${transaction.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(transaction.amount)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {transaction.payment_method || 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>
              ))}

              {filteredTransactions.length > displayLimit && (
                <div className="text-center pt-2">
                  <Button 
                    variant="outline" 
                    onClick={() => setDisplayLimit(prev => prev + 50)}
                    className="w-full sm:w-auto"
                  >
                    Carregar mais ({filteredTransactions.length - displayLimit} restantes)
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminCaixa;
