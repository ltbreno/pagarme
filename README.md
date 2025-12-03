# Backend Pagar.me API

Backend Node.js para integração com a API da Pagar.me, focado em pagamentos com cartão de crédito e PIX.

## 🚀 Funcionalidades

- ✅ Pagamentos com cartão de crédito
- ✅ Pagamentos com PIX
- ✅ Validação de dados
- ✅ Persistência em Supabase + PostgreSQL (dual-write)
- ✅ Estrutura RESTful
- ✅ Logging e tratamento de erros
- ✅ Webhooks para notificações da Pagar.me
- ✅ Gestão de clientes e recebedores
- ✅ Transferências entre recebedores

## 🛠️ Tecnologias

- **Node.js** - Runtime JavaScript
- **Express.js** - Framework web
- **Supabase** - Banco de dados principal (PostgreSQL na nuvem)
- **PostgreSQL** - Banco de dados local (backup)
- **Pagar.me API v5** - Processamento de pagamentos
- **Joi** - Validação de dados
- **Axios** - Cliente HTTP

## 🔷 Integração com Supabase

Este backend utiliza **Supabase como banco de dados principal** para armazenar pagamentos, com PostgreSQL local servindo como backup.

### Estratégia de Dual-Write

1. **Supabase (Principal)**: Todos os pagamentos são salvos no Supabase primeiro
2. **PostgreSQL (Backup)**: Dados são replicados no PostgreSQL local
3. **Fallback Inteligente**: Se o Supabase falhar, o sistema continua funcionando com PostgreSQL
4. **Leitura Prioritária**: Buscas são feitas no Supabase primeiro, com fallback para PostgreSQL

### Configuração do Supabase

Adicione as credenciais do Supabase no arquivo `.env`:

```env
SUPABASE_URL=https://sua-url.supabase.co
SUPABASE_ANON_KEY=sua_chave_anonima_aqui
```

Para obter as credenciais:
1. Acesse [Supabase Dashboard](https://supabase.com/dashboard)
2. Vá em **Settings** → **API**
3. Copie a **Project URL** e **anon/public key**

### Mapeamento de Campos

O backend faz o mapeamento automático entre os formatos:

| Campo Interno | Campo Supabase | Descrição |
|--------------|----------------|-----------|
| `pagarme_id` | `pagarme_order_id` | ID do pedido na Pagar.me |
| `amount` | `amount` e `total_amount` | Valor em centavos |
| `payment_method` | `payment_method` | Método de pagamento |
| `status` | `status` | Status do pagamento |
| `pagarme_response.charges[0].id` | `pagarme_payment_id` | ID do pagamento |
| `pagarme_response.charges[0].last_transaction.card.brand` | `card_brand` | Bandeira do cartão |
| `pagarme_response.charges[0].last_transaction.card.last_four_digits` | `card_last_four_digits` | Últimos 4 dígitos |

### Funcionamento sem Supabase

O sistema funciona **normalmente sem o Supabase configurado**. Se as credenciais não estiverem no `.env`, apenas o PostgreSQL local será usado.

### Documentação Detalhada

Para mais informações sobre a integração com Supabase, consulte:
- [SUPABASE_INTEGRATION.md](./SUPABASE_INTEGRATION.md) - Documentação completa da integração
- [WEBHOOK_SETUP.md](./WEBHOOK_SETUP.md) - Configuração de webhooks
- [EXAMPLES.md](./EXAMPLES.md) - Exemplos de uso da API

## 📦 Instalação

1. **Clone o repositório e instale as dependências:**
```bash
npm install
```

2. **Configure as variáveis de ambiente:**
```bash
cp .env.example .env
```

Edite o arquivo `.env` com suas configurações:
```env
# API Pagar.me
PAGARME_API_KEY=sua-chave-api-aqui
PAGARME_BASE_URL=https://api.pagar.me/core/v5

# Supabase (Principal)
SUPABASE_URL=https://sua-url.supabase.co
SUPABASE_ANON_KEY=sua_chave_anonima_aqui

# Banco PostgreSQL (Backup)
DB_HOST=localhost
DB_PORT=5432
DB_NAME=pagarme_db
DB_USER=postgres
DB_PASSWORD=sua-senha

# Aplicação
PORT=3000
NODE_ENV=development
```

3. **Configure o banco de dados PostgreSQL:**
```bash
# Certifique-se de que o PostgreSQL está rodando
npm run init-db
```

## ▶️ Executando

### Desenvolvimento:
```bash
npm run dev
```

### Produção:
```bash
npm start
```

A aplicação estará disponível em `http://localhost:3000`

## 📚 API Endpoints

### Pagamentos com Cartão de Crédito

**POST** `/api/payments/credit-card`

Cria um novo pagamento com cartão de crédito.

**Body:**
```json
{
  "amount": 10000,
  "card_token": "card_token_aqui",
  "installments": 1,
  "customer_name": "João Silva",
  "customer_email": "joao@email.com",
  "customer_document": "12345678901",
  "description": "Compra de produto"
}
```

### Pagamentos com PIX

**POST** `/api/payments/pix`

Cria um novo pagamento com PIX.

**Body:**
```json
{
  "amount": 5000,
  "customer_name": "João Silva",
  "customer_email": "joao@email.com",
  "customer_document": "12345678901",
  "description": "Pagamento via PIX"
}
```

### Criar Cliente

**POST** `/api/customers`

Cria um novo cliente na Pagar.me.

**Body:**
```json
{
  "name": "João Silva",
  "email": "joao@email.com",
  "document": "12345678901",
  "type": "individual",
  "phone_numbers": [{
    "country_code": "55",
    "area_code": "11",
    "number": "999999999"
  }]
}
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

### Criar Recebedor

**POST** `/api/recipients`

Cria um novo recebedor na Pagar.me (para split de pagamento).

**Body:**
```json
{
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
}
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

### Criar Transferência

**POST** `/api/transfers`

Cria uma transferência para um recebedor.

**Body:**
```json
{
  "recipient_id": "rp_xxxxxxxxxxxxx",
  "amount": 10000,
  "order_id": "or_xxxxxxxxxxxxx"
}
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

### Outros Endpoints

- **GET** `/api/payments/:id` - Obter pagamento por ID
- **GET** `/api/payments` - Listar pagamentos (com filtros opcionais)
- **GET** `/api/payments/stats/summary` - Estatísticas de pagamentos
- **GET** `/api/customers/:id` - Obter cliente por ID
- **GET** `/api/recipients/:id` - Obter recebedor por ID
- **POST** `/api/payments/card-token` - Criar token de cartão (teste - só para desenvolvimento)
- **POST** `/api/payments/tokens` - Receber token criado no frontend
- **POST** `/api/payments/validate-token` - Validar token de cartão
- **GET** `/health` - Health check

## 🔧 Scripts Disponíveis

```bash
npm run dev          # Desenvolvimento com nodemon
npm start           # Produção
npm run init-db     # Inicializar banco de dados
npm test           # Executar testes
```

## 📊 Estrutura do Banco de Dados

### Tabela `payments`

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | SERIAL | Chave primária |
| pagarme_id | VARCHAR | ID do pedido na Pagar.me |
| amount | INTEGER | Valor em centavos |
| currency | VARCHAR | Moeda (padrão: BRL) |
| payment_method | VARCHAR | Método: 'credit_card' ou 'pix' |
| status | VARCHAR | Status do pagamento |
| description | TEXT | Descrição do pagamento |
| card_token | VARCHAR | Token do cartão |
| installments | INTEGER | Número de parcelas |
| pix_qr_code | TEXT | QR Code do PIX |
| pix_qr_code_url | VARCHAR | URL do QR Code PIX |
| customer_name | VARCHAR | Nome do cliente |
| customer_email | VARCHAR | Email do cliente |
| customer_document | VARCHAR | CPF/CNPJ |
| pagarme_response | JSONB | Resposta completa da API |
| created_at | TIMESTAMP | Data de criação |
| updated_at | TIMESTAMP | Data de atualização |

## 🔐 Segurança

- Validação rigorosa de dados de entrada
- Sanitização de dados sensíveis
- Tratamento adequado de erros
- Logs de auditoria
- **Chave secreta nunca exposta ao frontend**
- Tokenização segura via SDK no frontend

## 🔑 Fluxo de Tokenização Seguro

### ✅ Método Correto (Recomendado):

1. **Frontend** (Flutter/Web) cria token usando **chave pública**:
```javascript
import pagarme from '@api/pagarme';

pagarme.criarTokenCartao({
  card: {
    number: '4111111111111111',
    holder_name: 'João Silva',
    exp_month: '12',
    exp_year: '30',
    cvv: '123'
  },
  type: 'card'
}, {appId: 'pk_test_4Rqd0p3Fp6Ca71D8'})
.then(({ data }) => {
  // Enviar apenas o TOKEN para o backend
  enviarParaBackend(data.id); // ex: "token_xyz123..."
});
```

2. **Backend** recebe apenas o token seguro:
```javascript
// POST /api/payments/credit-card
{
  "amount": 10000,
  "card_token": "token_xyz123...", // ← Token seguro, não dados do cartão
  "customer_name": "João Silva",
  "customer_email": "joao@email.com",
  "customer_document": "12345678901"
}
```

### ❌ Método Incorreto (Não Faça):

- ❌ Nunca envie dados do cartão (número, CVV, etc.) do frontend para o backend
- ❌ Nunca use a chave secreta no frontend
- ❌ Nunca exponha dados sensíveis em logs ou responses

### 🛡️ Por que isso é seguro:

- **Chave pública** só cria tokens, não processa pagamentos
- **Token** é uma referência segura aos dados do cartão
- **Chave secreta** fica apenas no backend para processamento
- Dados do cartão nunca trafegam pela sua infraestrutura

## 🧪 Testes

Para testar os endpoints, você pode usar ferramentas como:

- **Postman**
- **Insomnia**
- **curl**

### Exemplo com curl - Cartão de Crédito:

```bash
curl -X POST http://localhost:3000/api/payments/credit-card \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 10000,
    "card_token": "card_test_token",
    "installments": 1,
    "customer_name": "João Silva",
    "customer_email": "joao@email.com",
    "customer_document": "12345678901",
    "description": "Teste de pagamento"
  }'
```

### Exemplo com curl - PIX:

```bash
curl -X POST http://localhost:3000/api/payments/pix \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 5000,
    "customer_name": "João Silva",
    "customer_email": "joao@email.com",
    "customer_document": "12345678901",
    "description": "Teste PIX"
  }'
```

## 📝 Notas Importantes

1. **Chave API**: Use a chave de teste da Pagar.me durante desenvolvimento
2. **Valores**: Todos os valores são em centavos (R$ 10,00 = 1000)
3. **Documentos**: CPF deve ter 11 dígitos, CNPJ deve ter 14 dígitos
4. **Cartão Token**: Use o endpoint `/card-token` para gerar tokens de teste
5. **PIX**: O QR Code tem validade de 1 hora por padrão

## 🧪 Cartões de Teste Pagar.me

Para testar pagamentos sem usar cartões reais, use estes números:

### ✅ **Cartões de SUCESSO:**

| Número | Bandeira | Cenário |
|--------|----------|---------|
| `4000000000000010` | Visa | **SUCESSO** - Todas as operações aprovadas |
| `4000000000000044` | Visa | **SUCESSO** - Todas as operações aprovadas |
| `5880267390145457` | Hipercard | **SUCESSO** - Todas as operações aprovadas |

### ❌ **Cartões de FALHA (para testar erros):**

| Número | Bandeira | Cenário |
|--------|----------|---------|
| `4000000000000028` | Visa | **FALHA** - Sempre rejeitado |
| `5880267390145458` | Hipercard | **FALHA** - Sempre rejeitado |

### 📝 **Dados de Teste Padrão:**

```javascript
{
  number: '4000000000000010',  // ← Use este para SUCESSO
  holder_name: 'Teste da Silva',
  exp_month: '12',
  exp_year: '30',
  cvv: '123'
}
```

### ⚠️ **Importante:**

- Use **sempre** os cartões de teste em desenvolvimento
- Cartões reais **nunca** funcionam no modo teste
- Todos os cartões de teste têm CVV `123`
- Data de expiração deve ser futura

## 🔔 Webhooks

O backend está configurado para receber webhooks da Pagar.me automaticamente.

**Endpoint:** `POST /api/payments/webhook`

**Eventos suportados:**
- ✅ `order.paid` - Pedido pago
- ✅ `order.payment_failed` - Pagamento falhou
- ✅ `charge.paid` - Cobrança paga (PIX)
- ✅ `charge.pending` - Cobrança pendente
- ✅ `charge.refunded` - Reembolso

**Configuração:** Veja [WEBHOOK_SETUP.md](./WEBHOOK_SETUP.md) para instruções detalhadas.

## 🚀 Próximos Passos

- [x] Implementar webhooks para notificações
- [ ] Adicionar autenticação JWT
- [ ] Implementar testes automatizados
- [ ] Adicionar Docker
- [ ] Documentação completa da API
- [ ] Implementar outras formas de pagamento
- [ ] Dashboard administrativo

## 📞 Suporte

Para dúvidas sobre a API da Pagar.me, consulte a [documentação oficial](https://docs.pagar.me/reference/introdu%C3%A7%C3%A3o-1).

## 📄 Licença

Este projeto está sob a licença MIT.
