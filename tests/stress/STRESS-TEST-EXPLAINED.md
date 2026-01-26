# Stress Test WhatsApp - Documentação Técnica

> Como testar 100+ conversas simultâneas de WhatsApp **sem usar o WhatsApp de verdade**.

## TL;DR

O stress test **simula** webhooks do WhatsApp enviando POSTs idênticos aos que a Meta enviaria. O servidor não consegue distinguir - processa como se fosse tráfego real.

---

## Como o WhatsApp Cloud API Funciona

Quando um usuário manda mensagem no WhatsApp, acontece isso:

```
┌──────────────┐      ┌─────────────────┐      ┌──────────────────┐
│   Usuário    │ ───▶ │   Meta/WhatsApp │ ───▶ │   Seu Servidor   │
│  (celular)   │      │   (Cloud API)   │      │   /api/webhook   │
└──────────────┘      └─────────────────┘      └──────────────────┘
     "Olá!"                  │
                             ▼
                    POST /api/webhook
                    Content-Type: application/json
                    Body: { payload padronizado }
```

A Meta faz um **POST HTTP** no seu endpoint `/api/webhook` com um JSON padronizado.

---

## Estrutura do Payload da Meta

Este é o formato exato que a Meta envia quando alguém manda mensagem:

```json
{
  "object": "whatsapp_business_account",
  "entry": [
    {
      "id": "WHATSAPP_BUSINESS_ACCOUNT_ID",
      "changes": [
        {
          "value": {
            "messaging_product": "whatsapp",
            "metadata": {
              "phone_number_id": "123456789012345",
              "display_phone_number": "+5511999999999"
            },
            "contacts": [
              {
                "profile": {
                  "name": "João Silva"
                },
                "wa_id": "5511988887777"
              }
            ],
            "messages": [
              {
                "from": "5511988887777",
                "id": "wamid.HBgNNTUxMTk4ODg4Nzc3NxUCABIYFjNFQjBCNkU2Q0Y2...",
                "timestamp": "1706234567",
                "type": "text",
                "text": {
                  "body": "Olá, tudo bem?"
                }
              }
            ]
          },
          "field": "messages"
        }
      ]
    }
  ]
}
```

### Campos importantes:

| Campo | Descrição |
|-------|-----------|
| `phone_number_id` | ID do seu número no WhatsApp Business |
| `wa_id` | Número do usuário que mandou a mensagem |
| `messages[].from` | Mesmo que `wa_id` |
| `messages[].id` | ID único da mensagem (formato `wamid.xxx`) |
| `messages[].text.body` | Conteúdo da mensagem |

---

## O "Truque" do Stress Test

### Conceito

```
┌──────────────────┐                          ┌──────────────────┐
│   STRESS TEST    │ ─── POST (mesmo JSON) ──▶│   Seu Servidor   │
│   (computador)   │                          │   /api/webhook   │
└──────────────────┘                          └──────────────────┘
        │
        │  Gera JSON idêntico ao da Meta
        │  Com telefones fake (5511900000001, 5511900000002...)
        │  Mensagens variadas do pool
        ▼
     Servidor processa como se fosse real!
```

### Por que funciona?

1. **Webhooks são "portas abertas"** - aceitam POST de qualquer origem
2. **O servidor valida o formato**, não a origem
3. **JSON é idêntico** ao que a Meta enviaria
4. **Servidor não consegue distinguir** teste de tráfego real

### Comparação

| Aspecto | WhatsApp Real | Stress Test |
|---------|---------------|-------------|
| Origem do request | Servidores da Meta (IP deles) | Seu computador |
| Formato do JSON | Padrão documentado | Padrão documentado (copiado) |
| Telefone do usuário | Real (pessoa existente) | Fake (5511900000XXX) |
| Autenticação | Nenhuma no webhook* | Nenhuma |
| Processamento | IA + DB + resposta | IA + DB + resposta (falha no envio) |

> *A Meta pode enviar um header `X-Hub-Signature-256` para validação, mas é opcional.

---

## Implementação do Stress Test

### Arquivos principais

```
tests/stress/
├── run-stress-test.ts      # Script principal - orquestra o teste
├── config.ts               # Configurações (VUs, duração, thresholds)
├── webhook-payload.ts      # Gera payloads idênticos à Meta
├── metrics-collector.ts    # Coleta latência, throughput, erros
└── reports/                # Relatórios gerados (JSON, CSV, TXT)
```

### Gerador de Payload (`webhook-payload.ts`)

```typescript
// Pool de mensagens realistas
const MESSAGE_POOL = [
  'Olá!',
  'Qual o horário de funcionamento?',
  'Quero fazer um pedido',
  'Preciso de ajuda',
  'Quero falar com atendente',
  // ... 27 mensagens variadas
]

// Gera telefone único por índice
function generateUniquePhone(index: number): string {
  const suffix = String(index).padStart(6, '0')
  return `5511900${suffix}`  // Ex: 5511900000042
}

// Gera payload completo
function generateWebhookPayload({ phone, message }) {
  return {
    object: 'whatsapp_business_account',
    entry: [{
      id: WABA_ID,
      changes: [{
        value: {
          messaging_product: 'whatsapp',
          metadata: { phone_number_id, display_phone_number },
          contacts: [{ profile: { name: 'Nome Aleatório' }, wa_id: phone }],
          messages: [{
            from: phone,
            id: generateMessageId(),  // wamid.HBgNNTUxMTk...
            timestamp: now(),
            type: 'text',
            text: { body: message }
          }]
        },
        field: 'messages'
      }]
    }]
  }
}
```

### Worker (Virtual User)

```typescript
// Cada worker = 1 usuário com telefone fixo
async function worker(workerId: number, stopSignal: () => boolean) {
  const phone = generateUniquePhone(workerId)  // Telefone fixo!

  while (!stopSignal()) {
    const payload = generateWebhookPayload({
      phone,
      message: getRandomMessage()
    })

    await fetch(TARGET_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })

    await sleep(50)  // Simula tempo de digitação
  }
}
```

---

## O que o Servidor Faz (sem saber que é teste)

```
1. Recebe POST /api/webhook
2. Valida estrutura do JSON ✓
3. Extrai: telefone, mensagem, metadata
4. Busca/cria conversa no banco (Supabase)
5. Carrega histórico da conversa
6. Envia para IA processar (Gemini/OpenAI)
7. IA gera resposta
8. Tenta enviar resposta via Meta API ← FALHA (phone_number_id fake)
9. Salva no banco mesmo assim
```

### Por que a resposta falha?

Quando o servidor tenta **responder** ao usuário, ele faz:

```typescript
await fetch(`https://graph.facebook.com/v21.0/${phoneNumberId}/messages`, {
  method: 'POST',
  headers: { Authorization: `Bearer ${token}` },
  body: JSON.stringify({ to: phone, text: resposta })
})
```

Como o `phoneNumberId` é fake (ou o `phone` não existe), a Meta retorna erro. Mas isso não importa para o stress test - o objetivo é testar **a capacidade de processamento**, não o envio.

---

## Executando o Stress Test

### Comandos disponíveis

```bash
# Teste local
npm run test:stress:local

# Teste em produção
npm run test:stress:prod

# Customizado
npx tsx tests/stress/run-stress-test.ts \
  --target=https://seu-dominio.com/api/webhook \
  --vus=100 \
  --duration=60
```

### Opções

| Flag | Descrição | Default |
|------|-----------|---------|
| `--target=URL` | URL do webhook | localhost:3000 |
| `--vus=N` | Virtual Users (conversas simultâneas) | 50 |
| `--duration=N` | Duração em segundos | 60 |
| `--quick` | Teste rápido (10 VUs, 10s) | - |
| `--aggressive` | Teste pesado (até 1000 VUs) | - |

### Exemplo de saída

```
╔══════════════════════════════════════════════════════════════════╗
║                    SMARTZAP STRESS TEST                          ║
╠══════════════════════════════════════════════════════════════════╣
║  Target: https://smartzap.exemplo.com/api/webhook               ║
║  Phases: 1                                                       ║
╚══════════════════════════════════════════════════════════════════╝

📍 Iniciando fase: custom (100 VUs por 60s)
   ⏳ 30/60s | 1847 reqs | 61.5 req/s
   ✅ Fase custom concluída: 3694 requisições

📊 RESUMO
────────────────────────────────────────────────────────────────────
  Total de requisições:  3694
  Sucesso:               3650 (98.81%)
  Erros:                 44 (1.19%)
  Throughput:            61.5 req/s

⏱️  LATÊNCIA
────────────────────────────────────────────────────────────────────
  Mínimo:   312ms
  Máximo:   4521ms
  Média:    847ms
  p50:      723ms
  p95:      1890ms
  p99:      3102ms
```

---

## Métricas Coletadas

### Latência (tempo de resposta)

- **p50**: 50% das requisições responderam em até X ms
- **p95**: 95% das requisições responderam em até X ms
- **p99**: 99% das requisições responderam em até X ms

### Throughput

- Requisições por segundo (req/s)
- Indica capacidade máxima do sistema

### Taxa de erro

- Percentual de requisições que falharam
- Códigos de erro agrupados para análise

### Thresholds padrão

| Métrica | Limite | Descrição |
|---------|--------|-----------|
| p50 | ≤ 500ms | Metade das requests deve ser rápida |
| p95 | ≤ 2000ms | Quase todas devem responder em 2s |
| p99 | ≤ 5000ms | Apenas 1% pode ser lento |
| Taxa de erro | ≤ 1% | Quase nenhuma falha |
| Throughput | ≥ 100 req/s | Capacidade mínima |

---

## Limitações do Teste

### O que ele TESTA:
- ✅ Capacidade de processamento do servidor
- ✅ Performance da IA (tempo de resposta)
- ✅ Escalabilidade do banco de dados
- ✅ Comportamento sob carga (cold starts, timeouts)

### O que ele NÃO TESTA:
- ❌ Envio real de mensagens (Meta API)
- ❌ Recebimento de status (delivered, read)
- ❌ Rate limits da Meta (1 msg/6s por usuário)
- ❌ Fluxo completo ponta-a-ponta

---

## Segurança

### Por que webhooks são "abertos"?

A Meta precisa conseguir enviar dados para qualquer servidor. Não há como a Meta ter credenciais de todo mundo. Por isso:

1. **Você configura a URL** no painel da Meta
2. **Meta envia POST** sem autenticação
3. **Você valida** (opcional) via `X-Hub-Signature-256`

### Implicações

- Qualquer um pode enviar POST para seu webhook
- Em produção, considere validar o signature
- O stress test explora essa "abertura" para testes

### Header de assinatura (opcional)

```typescript
// Validação do signature (se implementado)
const signature = req.headers['x-hub-signature-256']
const expectedSignature = crypto
  .createHmac('sha256', APP_SECRET)
  .update(rawBody)
  .digest('hex')

if (signature !== `sha256=${expectedSignature}`) {
  return res.status(401).json({ error: 'Invalid signature' })
}
```

---

## Resumo

| Conceito | Explicação |
|----------|------------|
| **Webhook** | Endpoint que recebe POST da Meta quando chegam mensagens |
| **Payload** | JSON padronizado que a Meta envia |
| **Stress Test** | Envia o mesmo JSON, fingindo ser a Meta |
| **Virtual User** | Um "usuário fake" com telefone único conversando |
| **Por que funciona** | Servidor não valida origem, só formato do JSON |
| **Limitação** | Resposta não é enviada (phone_number_id fake) |

---

## Referências

- [WhatsApp Cloud API - Webhooks](https://developers.facebook.com/docs/whatsapp/cloud-api/webhooks)
- [Webhook Payload Reference](https://developers.facebook.com/docs/whatsapp/cloud-api/webhooks/payload-examples)
- [Signature Validation](https://developers.facebook.com/docs/whatsapp/cloud-api/webhooks/signature-validation)
