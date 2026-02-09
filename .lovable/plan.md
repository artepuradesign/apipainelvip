# Plano de Implementacao: Reordenacao do Menu e Cobranca Condicional

## Status: ✅ IMPLEMENTADO

---

## Resumo das Alteracoes Realizadas

### 1. Reordenacao do Menu Lateral ✅
**Arquivo**: `src/components/dashboard/layout/sidebar/assinanteSidebarItems.ts`

Nova ordem:
1. Dashboard (apenas suporte)
2. **Painel de Controle** (movido para cima)
3. **Minha Conta** (movido para baixo)
4. Paineis Disponiveis
5. Administracao (apenas suporte)
6. Integracoes (apenas suporte)
7. Indicacoes

### 2. Cobranca Condicional nos Modulos ✅

#### Arquivos Alterados (remoção de `chargeAlwaysExceptHistory`):
- ConsultarCpfCns.tsx
- ConsultarCpfPis.tsx
- ConsultarCpfScore.tsx
- ConsultarCpfTitulo.tsx
- ConsultarCpfCovid.tsx
- ConsultarCpfMei.tsx
- ConsultarCpfEmpresasSocio.tsx
- ConsultarCpfDividasAtivas.tsx
- ConsultarCpfAuxilioEmergencia.tsx
- ConsultarCpfRais.tsx
- ConsultarCpfInss.tsx
- ConsultarCpfSenhasEmail.tsx
- ConsultarCpfSenhasCpf.tsx

#### Logica de Cobranca Expandida em ConsultarCpfPuxaTudo.tsx:
- `isConditionalChargeModeRaw` agora inclui `isExclusiveMode` (qualquer onlySection)
- `getConditionalRequiredCount()` mapeado para todas as secoes:
  - cns → cnsCount
  - pis → result.pis
  - titulo → result.titulo_eleitor
  - score → result.score > 0
  - vacinas → vacinasCount
  - empresas_socio → empresasSocioCount
  - cnpj_mei → cnpjMeiCount
  - dividas_ativas → dividasAtivasCount
  - auxilio_emergencial → auxiliosEmergenciais.length
  - rais → rais.length
  - inss → inssCount
  - senhas_email → senhaEmailCount
  - senhas_cpf → senhaCpfCount

---

## Fluxo de Usuario Apos Implementacao

1. Usuario digita CPF e clica "Consultar"
2. Sistema busca dados no banco
3. **SE dados encontrados na secao especifica**:
   - Exibe resultados
   - Registra consulta e debita saldo
   - Toast: "✅ Consulta cobrada! Valor: R$ X.XX"
4. **SE dados NAO encontrados na secao**:
   - Exibe mensagem de "nao encontrado"
   - NAO registra consulta
   - NAO debita saldo
   - Toast: "❌ Nenhum registro encontrado. Consulta nao cobrada."
