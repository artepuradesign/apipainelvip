import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { cookieUtils } from '@/utils/cookieUtils';

// Interceptor global para requisições da API
export const useApiInterceptor = () => {
  const { signOut } = useAuth();

  useEffect(() => {
    // Interceptar fetch global
    const originalFetch = window.fetch;

    window.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
      // Verificar se é uma requisição para nossa API
      const url = typeof input === 'string' ? input : input.toString();
      const isApiRequest = url.includes('api.artepuradesign.com.br');

      if (isApiRequest) {
        // Adicionar token automaticamente se não foi especificado
        const token = cookieUtils.get('session_token') || cookieUtils.get('api_session_token');
        
        if (token && init) {
          const headers = new Headers(init.headers);
          
          // Só adicionar Authorization se não foi especificado
          if (!headers.has('Authorization')) {
            headers.set('Authorization', `Bearer ${token}`);
          }
          
          init.headers = headers;
        }
      }

      try {
        const response = await originalFetch(input, init);

        // Verificar se a resposta indica token expirado (apenas para erros reais de auth)
        if (isApiRequest && response.status === 401) {
          console.log('🚫 [API_INTERCEPTOR] Status 401 detectado para:', url);
          
          // Verificar se realmente é um erro de autenticação, não de server
          const responseText = await response.clone().text();
          console.log('🚫 [API_INTERCEPTOR] Response text:', responseText.substring(0, 200) + '...');
          
          const isAuthError = responseText.includes('unauthorized') || 
                             responseText.includes('token') || 
                             responseText.includes('autenticação') ||
                             responseText.includes('authentication') ||
                             responseText.includes('expirado') ||
                             responseText.includes('expired');
          
          // Só fazer logout se for erro real de autenticação, não server error
          if (isAuthError) {
            console.log('🚫 [API_INTERCEPTOR] Erro real de autenticação detectado, redirecionando para logout');
            await signOut();
            
            // Redirecionar para página de logout
            window.location.href = '/logout';
          } else {
            console.warn('🚫 [API_INTERCEPTOR] 401 recebido mas não parece ser erro de auth, ignorando logout');
          }
        }
        
        // Log para erros 500 também
        if (isApiRequest && response.status >= 500) {
          console.warn('🚫 [API_INTERCEPTOR] Erro de servidor detectado:', response.status, 'para URL:', url);
        }

        return response;
      } catch (error) {
        console.error('❌ [API_INTERCEPTOR] Erro na requisição:', error);
        throw error;
      }
    };

    // Cleanup: restaurar fetch original quando o componente for desmontado
    return () => {
      window.fetch = originalFetch;
    };
  }, [signOut]);
};