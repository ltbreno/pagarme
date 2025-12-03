# 📚 Exemplos de Uso da API

Este arquivo contém exemplos práticos de como usar todos os endpoints da API.

## 🔵 Clientes

### Criar Cliente

```bash
curl -X POST "http://localhost:3000/api/customers" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "João Silva",
    "email": "joao@email.com",
    "document": "12345678901",
    "type": "individual",
    "phone_numbers": [{
      "country_code": "55",
      "area_code": "11",
      "number": "999999999"
    }]
  }'
```

**Resposta:**
```json
{
  "success": true,
  "message": "Cliente criado com sucesso",
  "data": {
    "pagarme_customer_id": "cus_xxxxxxxxxxxxx"
  }
}
```

### Obter Cliente

```bash
curl -X GET "http://localhost:3000/api/customers/cus_xxxxxxxxxxxxx"
```

---

## 🟢 Recebedores

### Criar Recebedor

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

**Resposta:**
```json
{
  "success": true,
  "message": "Recebedor criado com sucesso",
  "data": {
    "pagarme_recipient_id": "rp_xxxxxxxxxxxxx"
  }
}
```

### Obter Recebedor

```bash
curl -X GET "http://localhost:3000/api/recipients/rp_xxxxxxxxxxxxx"
```

---

## 💰 Transferências

### Criar Transferência

```bash
curl -X POST "http://localhost:3000/api/transfers" \
  -H "Content-Type: application/json" \
  -d '{
    "recipient_id": "rp_xxxxxxxxxxxxx",
    "amount": 10000,
    "order_id": "or_xxxxxxxxxxxxx"
  }'
```

**Resposta:**
```json
{
  "success": true,
  "message": "Transferência criada com sucesso",
  "data": {
    "transfer_id": "trf_xxxxxxxxxxxxx"
  }
}
```

---

## 🔄 Fluxo Completo: Pagamento + Transferência

### Passo 1: Criar Cliente
```bash
CUSTOMER_RESPONSE=$(curl -s -X POST "http://localhost:3000/api/customers" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "João Silva",
    "email": "joao@email.com",
    "document": "12345678901",
    "type": "individual"
  }')

CUSTOMER_ID=$(echo $CUSTOMER_RESPONSE | grep -o '"pagarme_customer_id":"[^"]*"' | cut -d'"' -f4)
echo "Cliente criado: $CUSTOMER_ID"
```

### Passo 2: Criar Recebedor
```bash
RECIPIENT_RESPONSE=$(curl -s -X POST "http://localhost:3000/api/recipients" \
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
  }')

RECIPIENT_ID=$(echo $RECIPIENT_RESPONSE | grep -o '"pagarme_recipient_id":"[^"]*"' | cut -d'"' -f4)
echo "Recebedor criado: $RECIPIENT_ID"
```

### Passo 3: Criar Pagamento PIX
```bash
PAYMENT_RESPONSE=$(curl -s -X POST "http://localhost:3000/api/payments/pix" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 50000,
    "customer_name": "João Silva",
    "customer_email": "joao@email.com",
    "customer_document": "12345678901",
    "customer_phone": {
      "area_code": "11",
      "number": "999999999"
    }
  }')

ORDER_ID=$(echo $PAYMENT_RESPONSE | grep -o '"pagarme_order_id":"[^"]*"' | cut -d'"' -f4)
echo "Pedido criado: $ORDER_ID"
```

### Passo 4: Aguardar Pagamento (ou simular no Dashboard)

### Passo 5: Criar Transferência para Recebedor
```bash
curl -X POST "http://localhost:3000/api/transfers" \
  -H "Content-Type: application/json" \
  -d "{
    \"recipient_id\": \"$RECIPIENT_ID\",
    \"amount\": 40000,
    \"order_id\": \"$ORDER_ID\"
  }"
```

---

## 📋 Códigos de Banco (Exemplos)

| Código | Banco |
|--------|-------|
| `001` | Banco do Brasil |
| `033` | Santander |
| `104` | Caixa Econômica |
| `237` | Bradesco |
| `341` | Itaú |
| `356` | Banco Real |
| `422` | Safra |

---

## ⚠️ Notas Importantes

1. **Valores**: Sempre em centavos (R$ 10,00 = 1000)
2. **Documentos**: CPF (11 dígitos) ou CNPJ (14 dígitos) - apenas números
3. **Telefones**: DDD com 2 dígitos, número com 8 ou 9 dígitos
4. **Contas Bancárias**: Use códigos válidos de bancos brasileiros
5. **IDs**: Todos os IDs retornados são da Pagar.me e devem ser salvos para referência futura

---

## 🧪 Testes Rápidos

### Teste 1: Cliente Simples
```bash
curl -X POST "http://localhost:3000/api/customers" \
  -H "Content-Type: application/json" \
  -d '{"name":"Teste","email":"teste@email.com","document":"12345678901","type":"individual"}'
```

### Teste 2: Recebedor Simples
```bash
curl -X POST "http://localhost:3000/api/recipients" \
  -H "Content-Type: application/json" \
  -d '{
    "name":"Teste",
    "email":"teste@email.com",
    "document":"12345678901",
    "bank_account":{
      "holder_name":"Teste",
      "holder_type":"individual",
      "holder_document":"12345678901",
      "bank":"341",
      "account_number":"12345",
      "account_type":"checking",
      "branch_number":"1234"
    }
  }'
```

### Teste 3: Transferência Simples
```bash
curl -X POST "http://localhost:3000/api/transfers" \
  -H "Content-Type: application/json" \
  -d '{"recipient_id":"rp_xxxxxxxxxxxxx","amount":10000}'
```

---

✅ **Todos os endpoints estão prontos para uso!** 🚀

