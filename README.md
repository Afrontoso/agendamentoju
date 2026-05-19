# Agendamento de Sala de Reunião

App web para reservar uma sala de reunião por data e horário. Mostra a agenda do dia com blocos **ocupados** (vermelho) e **livres** (verde).

- **Stack**: Next.js 15 (App Router) + TypeScript + Tailwind + Prisma + PostgreSQL
- **Sem login** — basta informar nome e assunto da reunião
- **Sala única** (MVP)
- **Horário livre** com validação de sobreposição (start/end)

Veja o desenho completo em [`PLANO.md`](./PLANO.md).

## Como rodar

### 1. Instalar dependências

```bash
npm install
npm install @prisma/client zod date-fns
npm install -D prisma
```

### 2. Configurar o banco

Crie um Postgres em [Neon](https://neon.tech) ou [Supabase](https://supabase.com) (free tier).

Copie o `.env.example` para `.env` e cole sua connection string:

```bash
cp .env.example .env
# edite .env e coloque DATABASE_URL="postgresql://..."
```

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

## Visão geral do uso

- Clique em um dia no calendário (à esquerda) para ver a agenda dele.
- Dias com agendamentos ficam marcados com um ponto vermelho.
- Cada bloco verde é um slot livre — clique para abrir o modal já preenchido com aquele horário.
- "Novo agendamento" abre o modal vazio para escolher tudo do zero.
- Excluir um agendamento libera o slot na hora.

Expediente padrão: **08:00 – 18:00** (configurável em [`src/lib/bookings.ts`](./src/lib/bookings.ts)).

## Estrutura

```
src/
├── app/
│   ├── layout.tsx        # layout + toaster global
│   ├── page.tsx          # calendário + agenda do dia
│   └── globals.css
├── components/
│   ├── booking-calendar.tsx     # calendário mensal
│   ├── day-agenda.tsx           # timeline ocupado/livre
│   ├── new-booking-dialog.tsx   # modal + formulário
│   ├── booking-item.tsx         # card de agendamento
│   └── toaster.tsx              # notificações
├── lib/
│   ├── prisma.ts                # singleton do Prisma
│   ├── bookings.ts              # queries + cálculo de slots livres
│   └── utils.ts
├── schemas/
│   └── booking.ts               # zod schema do formulário
└── server/
    └── actions.ts               # createBooking, deleteBooking
prisma/
└── schema.prisma                # model Booking
```

## Próximos passos (fora do MVP)

- Múltiplas salas
- Autenticação (NextAuth)
- Edição de agendamento existente
- Recorrência (semanal/mensal)
- Notificações por email
- Visão semanal em grid
