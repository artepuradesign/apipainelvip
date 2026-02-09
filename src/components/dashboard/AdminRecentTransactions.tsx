import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DollarSign } from 'lucide-react';
import { type DashboardTransaction } from '@/hooks/useApiDashboardAdmin';

interface AdminRecentTransactionsProps {
  recentTransactions: DashboardTransaction[];
}

const AdminRecentTransactions: React.FC<AdminRecentTransactionsProps> = ({ recentTransactions }) => {
  
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  // Remove duplicatas baseadas na descrição e valor para evitar exibir transações similares
  const deduplicateTransactions = (transactions: DashboardTransaction[]) => {
    const seen = new Set();
    const seenBonusUsers = new Set();
    
    return transactions.filter(transaction => {
      // Para transações de bônus/comissão, verificar por usuário e valor
      if (transaction.description.toLowerCase().includes('bônus') || 
          transaction.description.toLowerCase().includes('comissão') ||
          transaction.description.toLowerCase().includes('indicação')) {
        
        // Extrair nome do usuário da descrição
        const userMatch = transaction.description.match(/(?:usuário|por|indicado por|Rodrigo)\s+(\w+)/i);
        const userName = userMatch ? userMatch[1] : transaction.user_name;
        const bonusKey = `${userName}-${transaction.amount}-bonus`;
        
        if (seenBonusUsers.has(bonusKey)) {
          return false;
        }
        seenBonusUsers.add(bonusKey);
        return true;
      }
      
      // Para outras transações, usar lógica anterior
      const dateKey = new Date(transaction.created_at).toISOString().slice(0, 16);
      const key = `${transaction.description}-${transaction.amount}-${dateKey}`;
      
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  };

  const uniqueTransactions = deduplicateTransactions(recentTransactions);

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'recarga': return 'border-l-blue-500';
      case 'entrada': return 'border-l-green-500';
      case 'consulta': return 'border-l-purple-500';
      case 'saque': return 'border-l-red-500';
      case 'comissao': return 'border-l-yellow-500';
      case 'indicacao': return 'border-l-orange-500';
      case 'plano': return 'border-l-emerald-500';
      default: return 'border-l-gray-500';
    }
  };

  return (
    <Card>
      <CardHeader className="pb-2 sm:pb-4">
        <CardTitle className="flex items-center gap-2 text-sm sm:text-base md:text-lg">
          <DollarSign className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
          Transações do Caixa Central
        </CardTitle>
      </CardHeader>
      <CardContent className="px-2 sm:px-6">
        <div className="space-y-1.5 sm:space-y-2 max-h-72 sm:max-h-96 overflow-y-auto">
          {uniqueTransactions.length > 0 ? (
            uniqueTransactions.map((transaction) => (
              <div 
                key={transaction.id} 
                className={`flex items-start sm:items-center justify-between p-2 sm:p-3 bg-muted/50 rounded-lg border-l-4 ${getTypeColor(transaction.type)}`}
              >
                <div className="flex-1 min-w-0 space-y-0.5 sm:space-y-1">
                  {/* Descrição */}
                  <p className="text-xs sm:text-sm font-medium text-foreground truncate pr-2">
                    {transaction.description}
                  </p>
                  
                  {/* Info secundária */}
                  <div className="flex flex-wrap items-center gap-1 sm:gap-2">
                    {/* Data/hora */}
                    <span className="text-[10px] sm:text-xs text-muted-foreground">
                      {new Date(transaction.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })} {new Date(transaction.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    
                    {/* Módulo */}
                    {transaction.module_name && (
                      <Badge variant="outline" className="text-[9px] sm:text-[10px] px-1 py-0 h-3.5 sm:h-4 font-normal">
                        {transaction.module_name}
                      </Badge>
                    )}
                    
                    {/* Usuário */}
                    {transaction.user_name && (
                      <span className="text-[10px] sm:text-xs text-primary/70 truncate max-w-[80px] sm:max-w-[120px]">
                        {transaction.user_name}
                      </span>
                    )}
                  </div>
                </div>
                
                {/* Valor */}
                <div className="ml-2 flex-shrink-0">
                  <Badge 
                    variant="secondary"
                    className={`text-[10px] sm:text-xs font-semibold px-1.5 sm:px-2 ${
                      ['recarga', 'entrada', 'plano', 'indicacao', 'comissao'].includes(transaction.type) 
                        ? "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300"
                        : "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300"
                    }`}
                  >
                    {['recarga', 'entrada', 'plano', 'indicacao', 'comissao'].includes(transaction.type) ? '+' : '-'}
                    {formatCurrency(transaction.amount)}
                  </Badge>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-6 sm:py-8 text-muted-foreground">
              <DollarSign className="h-8 w-8 sm:h-10 sm:w-10 mx-auto mb-2 sm:mb-3 opacity-50" />
              <p className="text-xs sm:text-sm">Nenhuma transação no caixa ainda</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default AdminRecentTransactions;
