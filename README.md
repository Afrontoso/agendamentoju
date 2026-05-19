# Agendamento de Sala de Reunião

App web para reservar uma sala de reunião por data e horário. Mostra a agenda do dia com blocos **ocupados** (vermelho) e **livres** (verde).

- **Stack**: Next.js 16 (App Router) + TypeScript + Tailwind v4 + Prisma 6 + PostgreSQL
- **Sem login** — informa nome, assunto e cria um PIN de 4 dígitos para futuras edições
- **Sala única** (MVP)
- **Horário livre** com validação de sobreposição
- **Editar** agendamento existente (protegido por PIN)
- **Recorrência** semanal ou mensal com data fim
- **PIN de 4 dígitos** protege edição e exclusão
- **Visão diária e semanal** (toggle no topo da agenda)

Veja o desenho completo em [`PLANO.md`](./PLANO.md).

## Como rodar

### 1. Instalar dependências

```bash
npm install
```

### 2. Configurar o banco

Crie um Postgres em [Neon](https://neon.tech) ou [Supabase](https://supabase.com) (free tier).

Copie o `.env.example` para `.env` e cole as connection strings:

```bash
cp .env.example .env
# preencha DATABASE_URL (pooled) e DIRECT_URL (direct) no .env
```

Se sua rede bloqueia a porta 5432 (comum em empresa/universidade), use hotspot do celular para rodar o migrate. O runtime depois funciona normal.

### 3. Aplicar o schema

```bash
npx prisma migrate dev --name init
npx prisma generate
```

### 4. Subir o servidor de desenvolvimento

```bash
npm run dev
```

Abra <http://localhost:3000>.

## Funcionalidades

### Criar agendamento
- Botão "+ Novo agendamento" abre o modal.
- Campos: nome, assunto, data, hora início, hora fim, **PIN de 4 dígitos**, recorrência opcional.
- Recorrência: nenhuma, semanal ou mensal, com data fim (máx 52 ocorrências).
- Se houver conflito em qualquer ocorrência, **nada é criado** (atomicidade).

### Editar / Excluir
- Cada agendamento tem botões "Editar" e "Excluir".
- Ambos pedem o **PIN** definido na criação.
- Excluindo um item de uma série recorrente, o modal pergunta: "apenas este" ou "toda a série".

### Visualização
- **Calendário mensal** à esquerda — clica em um dia para selecioná-lo, ponto vermelho indica dias com agendamentos.
- **Toggle** Diária ↔ Semanal no canto superior direito da agenda.
- **Diária**: timeline ordenada com slots livres verdes (clicáveis para criar) e ocupados vermelhos.
- **Semanal**: grade 7 dias × horas, blocos vermelhos com título e nome, células vazias clicáveis para criar.

Expediente padrão: **08:00 – 18:00** (configurável em [`src/lib/bookings.ts`](./src/lib/bookings.ts)).

## Estrutura

```
src/
├── app/
│   ├── layout.tsx        # layout + toaster global
│   ├── page.tsx          # calendário + agenda (suporta ?date e ?view)
│   └── globals.css
├── components/
│   ├── booking-calendar.tsx    # calendário mensal
│   ├── day-agenda.tsx          # timeline ocupado/livre (vista diária)
│   ├── week-grid.tsx           # grade semanal
│   ├── view-toggle.tsx         # toggle dia/semana
│   ├── booking-dialog.tsx      # modal create/edit + recorrência
│   ├── booking-item.tsx        # card com edit/delete + PIN
│   ├── pin-prompt.tsx          # modal de PIN (delete + escopo série)
│   └── toaster.tsx             # notificações
├── lib/
│   ├── prisma.ts               # singleton do Prisma
│   ├── bookings.ts             # queries + cálculo de slots + ocorrências
│   ├── pin.ts                  # hash/verify com scrypt
│   └── utils.ts
├── schemas/
│   └── booking.ts              # zod schemas
└── server/
    └── actions.ts              # createBooking, updateBooking, deleteBooking
prisma/
└── schema.prisma               # model Booking (pinHash, seriesId)
```

## Próximos passos

- **Notificações por email** (ver [`PLANO.md`](./PLANO.md))
- Múltiplas salas
- Autenticação real (NextAuth) — substituiria o PIN
