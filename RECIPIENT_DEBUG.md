# 🔍 Debug - Criar Recebedor

## ❌ Erro Atual
```
"The request is invalid."
```

## 🔧 Possíveis Causas

### 1. **Formato da Conta Bancária**
A Pagar.me pode exigir campos adicionais ou formato diferente.

### 2. **Campos Obrigatórios Faltando**
Pode faltar algum campo obrigatório na conta bancária.

### 3. **Formato de Dados**
Alguns campos podem precisar estar em formato específico.

## 📋 Formato Esperado pela Pagar.me

### Estrutura Completa:
```json
{
  "name": "Maria Santos",
  "email": "maria@email.com",
  "document": "12345678901",
  "type": "individual",
  "default_bank_account": {
    "holder_name": "Maria Santos",
    "holder_type": "individual",
    "holder_document": "12345678901",
    "bank": "341",
    "account_number": "12345",
    "account_type": "checking",
    "branch_number": "1234"
  }
}
```

## 🧪 Teste com curl

```bash
curl -X POST "http://localhost:3000/api/recipients" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Maria Santos",
    "email": "maria@email.com",
    "document": "12345678901",
    "bank_account": {
      "holder_name": "Maria Santos",
      "holder_type": "individual",
      "holder_document": "12345678901",
      "bank": "341",
      "account_number": "12345",
      "account_type": "checking",
      "branch_number": "1234"
    }
  }'
```

## 📊 Verificar Logs

Os logs agora mostram:
- ✅ Dados recebidos
- ✅ Payload montado
- ✅ Erros detalhados da API
- ✅ Campos com erro (se houver)

## 🔍 Próximos Passos

1. Execute o teste acima
2. Verifique os logs no terminal
3. Procure por mensagens específicas de erro
4. Compare o payload enviado com a documentação da Pagar.me

