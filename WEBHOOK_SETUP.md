# 🔔 Configuração de Webhooks Pagar.me

Este guia explica como configurar webhooks para receber notificações automáticas de pagamentos PIX e cartão.

## 📋 O que são Webhooks?

Webhooks são notificações HTTP que a Pagar.me envia automaticamente para seu servidor quando eventos importantes acontecem (pagamento aprovado, falha, reembolso, etc).

## 🚀 Passo a Passo

### 1. **Expor seu Backend para Internet**

Para desenvolvimento local, use **ngrok** ou **localtunnel**:

#### Opção A: ngrok (Recomendado)
```bash
# Instalar ngrok: https://ngrok.com/download
ngrok http 3000
```

Você receberá uma URL pública:
```
Forwarding: https://abc123.ngrok.io -> http://localhost:3000
```

#### Opção B: localtunnel
```bash
# Instalar
npm install -g localtunnel

# Executar
lt --port 3000
```

### 2. **Configurar Webhook no Dashboard Pagar.me**

1. Acesse: https://dashboard.pagar.me
2. Vá em **Configurações** → **Webhooks**
3. Clique em **Criar Webhook**
4. Preencha:
   - **URL**: `https://sua-url-publica.ngrok.io/api/payments/webhook`
   - **Número Máximo de Tentativas**: 3
   - **Eventos**: Selecione:
     - ✅ `order.paid` - Pedido pago
     - ✅ `order.payment_failed` - Pagamento falhou
     - ✅ `charge.paid` - Cobrança paga (PIX)
     - ✅ `charge.pending` - Cobrança pendente
     - ✅ `charge.refunded` - Reembolso

5. Clique em **Salvar**

### 3. **Testar Webhook**

#### Teste 1: Criar pagamento PIX
```bash
curl -X POST "http://localhost:3000/api/payments/pix" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 10000,
    "customer_name": "João Silva",
    "customer_email": "joao@email.com",
    "customer_document": "12345678901",
    "customer_phone": {
      "area_code": "11",
      "number": "999999999"
    }
  }'
```

#### Teste 2: Simular pagamento no Dashboard
1. Acesse o pedido criado no Dashboard
2. Clique em **Simular Pagamento**
3. Escolha **Aprovar**

#### Teste 3: Ver logs do webhook
Verifique os logs do seu servidor:
```
📡 ============================================
📡 Webhook recebido da Pagar.me
📡 ============================================
📌 Evento: order.paid
📌 ID: or_XXXXXXXXX
✅ Pedido PAGO!
💰 Processando pedido pago: or_XXXXXXXXX
✅ Pagamento 1 atualizado para PAID
```

## 📊 Eventos Suportados

| Evento | Descrição | Quando acontece |
|--------|-----------|-----------------|
| `order.paid` | Pedido pago | Pagamento aprovado |
| `order.payment_failed` | Pagamento falhou | Cartão recusado, PIX expirado |
| `charge.paid` | Cobrança paga | PIX pago, boleto pago |
| `charge.pending` | Cobrança pendente | Aguardando pagamento |
| `charge.refunded` | Reembolso | Dinheiro devolvido |

## 🔍 Estrutura do Webhook

### Exemplo de Payload (order.paid):
```json
{
  "id": "hook_xyz123",
  "type": "order.paid",
  "data": {
    "id": "or_ABC123XYZ",
    "status": "paid",
    "amount": 10000,
    "charges": [{
      "id": "ch_123",
      "status": "paid",
      "payment_method": "pix",
      "paid_at": "2025-12-02T15:30:00Z"
    }]
  }
}
```

## 🛡️ Segurança

### Validar Origem (Recomendado para Produção)

Adicione validação de IP ou assinatura:

```javascript
// src/middleware/webhook-validation.middleware.js
const validateWebhook = (req, res, next) => {
  // IPs da Pagar.me (exemplo)
  const allowedIPs = [
    '54.207.66.192',
    '54.207.88.53',
    // Adicione outros IPs da Pagar.me
  ];

  const clientIP = req.ip || req.connection.remoteAddress;

  if (!allowedIPs.includes(clientIP)) {
    console.warn(`⚠️ Webhook de IP não autorizado: ${clientIP}`);
    // Em produção, você pode rejeitar:
    // return res.status(403).json({ error: 'Forbidden' });
  }

  next();
};
```

## 🧪 Testar Localmente

### 1. Usar endpoint de teste do Dashboard
No Dashboard Pagar.me, você pode **enviar webhook manualmente** para testar.

### 2. Usar curl para simular webhook
```bash
curl -X POST "http://localhost:3000/api/payments/webhook" \
  -H "Content-Type: application/json" \
  -d '{
    "id": "hook_test_123",
    "type": "order.paid",
    "data": {
      "id": "or_TEST123",
      "status": "paid",
      "amount": 10000
    }
  }'
```

## 📝 Logs e Monitoramento

### Ver logs em tempo real:
```bash
npm run dev
```

### Verificar pagamentos no banco:
```sql
SELECT id, pagarme_id, status, amount, payment_method, updated_at 
FROM payments 
ORDER BY updated_at DESC 
LIMIT 10;
```

## ⚠️ Importante

1. **Sempre responda 200 OK**: Mesmo com erro, responda 200 para evitar reenvios
2. **Idempotência**: O mesmo webhook pode ser enviado múltiplas vezes
3. **Timeout**: Processe rápido (< 5 segundos) ou use fila
4. **Logs**: Registre tudo para debug

## 🚀 Produção

### Checklist:
- [ ] URL HTTPS válida (não ngrok)
- [ ] Validação de IP/assinatura
- [ ] Logs estruturados
- [ ] Monitoramento de falhas
- [ ] Fila para processamento assíncrono
- [ ] Retry logic para falhas

## 📞 Suporte

- Documentação: https://docs.pagar.me/docs/webhooks
- Dashboard: https://dashboard.pagar.me
- Logs de webhook no Dashboard: **Configurações** → **Webhooks** → **Histórico**

## 🎯 Fluxo Completo PIX

1. **Cliente** cria pagamento PIX
2. **Backend** gera QR Code (status: `pending`)
3. **Cliente** paga com app bancário
4. **Pagar.me** detecta pagamento
5. **Webhook** notifica seu backend (`charge.paid`)
6. **Backend** atualiza status para `paid`
7. **Sistema** libera produto/serviço

---

✅ **Webhook configurado e funcionando!** 🎉

