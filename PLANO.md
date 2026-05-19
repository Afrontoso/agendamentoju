# Plano — Sistema de Agendamento de Sala de Reunião

## Contexto

Projeto inicial (do zero) de um sistema web para agendar uma sala de reunião:

- Agendar informando **data**, **horário de início** e **horário de fim**.
- Visualizar a agenda do dia mostrando claramente o que está **ocupado** e o que está **livre**.
- Sem login — a pessoa só informa nome + assunto da reunião.

### Decisões alinhadas com o usuário

| Tema | Escolha |
|---|---|
| Quantidade de salas | **Uma única sala** (MVP enxuto) |
| Autenticação | **Sem login** — campo `nome` em cada agendamento |
| Banco de dados | **PostgreSQL** em serviço cloud (Neon/Supabase) |
| Granularidade | **Horário livre** (início e fim escolhidos pelo usuário, com validação de sobreposição) |
| UI | **Tailwind CSS + shadcn/ui** |
| Visualização | **Calendário mensal + lista do dia** |

---

## Stack

- **Next.js 15** (App Router) + **TypeScript**
- **Prisma ORM** + **PostgreSQL** (Neon ou Supabase)
- **Tailwind CSS** + **shadcn/ui** (componentes: `button`, `calendar`, `dialog`, `form`, `input`, `label`, `popover`, `sonner`, `card`, `badge`)
- **React Hook Form** + **Zod** (formulário e validação)
- **date-fns** (manipulação e formatação de datas em pt-BR)
- **Server Actions** do Next.js para criar/excluir agendamentos

---

## Estrutura do projeto

```
agendamentoju/
├── prisma/
│   └── schema.prisma            # Modelo Booking
├── src/
│   ├── app/
│   │   ├── layout.tsx           # Layout global + Toaster
│   │   ├── page.tsx             # Página principal (calendário + agenda do dia)
│   │   └── globals.css          # Tailwind
│   ├── components/
│   │   ├── ui/                  # Componentes shadcn/ui gerados
│   │   ├── booking-calendar.tsx # Calendário mensal (client component)
│   │   ├── day-agenda.tsx       # Lista de slots ocupados/livres do dia
│   │   ├── new-booking-dialog.tsx # Modal + form pra criar agendamento
│   │   └── booking-item.tsx     # Card de cada agendamento (com botão excluir)
│   ├── lib/
│   │   ├── prisma.ts            # Singleton do PrismaClient
│   │   ├── bookings.ts          # Funções: getBookingsByDay, computeFreeSlots
│   │   └── utils.ts             # cn() do shadcn
│   ├── server/
│   │   └── actions.ts           # Server Actions: createBooking, deleteBooking
│   └── schemas/
│       └── booking.ts           # Zod schema compartilhado
├── .env                         # DATABASE_URL (não commitar)
├── .env.example                 # template
└── README.md                    # como rodar
```

---

## Modelo de dados (`prisma/schema.prisma`)

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Booking {
  id        String   @id @default(cuid())
  name      String   // nome de quem agendou
  title     String   // assunto/título da reunião
  startsAt  DateTime
  endsAt    DateTime
  createdAt DateTime @default(now())

  @@index([startsAt, endsAt])
}
```

Sala única → sem `roomId`. Se um dia virar multi-sala basta adicionar a relação.

---

## Lógica chave

### 1. `getBookingsByDay(date)`
`src/lib/bookings.ts` — busca todos os bookings cujo intervalo intersecta o dia (`startsAt < endOfDay AND endsAt > startOfDay`), ordenados por `startsAt`.

### 2. `computeFreeSlots(bookings, day)`
Expediente default **08:00–18:00** (constantes em `src/lib/bookings.ts`). Retorna os intervalos livres do dia (antes da primeira reunião, gaps entre reuniões, depois da última).

### 3. Validação de sobreposição (server action `createBooking`)
Zod valida `endsAt > startsAt`, mesmo dia, dentro do expediente. Antes do insert:

```ts
const conflict = await prisma.booking.findFirst({
  where: {
    startsAt: { lt: input.endsAt },
    endsAt:   { gt: input.startsAt },
  },
});
if (conflict) throw new Error("Horário já ocupado");
```

Depois, `revalidatePath("/")`.

### 4. `deleteBooking(id)` — server action open (sem login no MVP).

---

## UI / Página principal (`app/page.tsx`)

Layout em duas colunas (empilha no mobile):

- **Esquerda**: `<BookingCalendar />` — `Calendar` do shadcn, destaca dias com agendamentos. Clicar troca `?date=YYYY-MM-DD` na URL.
- **Direita**: `<DayAgenda />` — server component:
  - Lê `searchParams.date` (ou hoje).
  - Busca via `getBookingsByDay`.
  - Renderiza timeline:
    - 🟥 **Ocupado** → título, nome, horário, botão excluir.
    - 🟩 **Livre** → intervalo + botão "Agendar este horário" (abre dialog pré-preenchido).
  - Botão geral "+ Novo agendamento" no topo.

`<NewBookingDialog />` — `Dialog` + `<Form>` (RHF + Zod):
- Nome, título, data (vem da seleção), hora início, hora fim.
- Submit → `createBooking` → toast (`sonner`).

---

## Setup e comandos

```bash
# 1. Dependências (já existem do scaffold; instalar extras)
npm i @prisma/client zod react-hook-form @hookform/resolvers date-fns
npm i -D prisma

# 2. Inicializar Prisma
npx prisma init --datasource-provider postgresql

# 3. shadcn/ui
npx shadcn@latest init
npx shadcn@latest add button calendar dialog form input label popover sonner card badge

# 4. .env com DATABASE_URL apontando pra Neon/Supabase
# 5. Migrar
npx prisma migrate dev --name init

# 6. Rodar
npm run dev
```

---

## Arquivos críticos

| Arquivo | Função |
|---|---|
| `prisma/schema.prisma` | Modelo `Booking` |
| `src/lib/prisma.ts` | Singleton do PrismaClient |
| `src/lib/bookings.ts` | `getBookingsByDay`, `computeFreeSlots`, constantes de expediente |
| `src/schemas/booking.ts` | Zod schema |
| `src/server/actions.ts` | `createBooking`, `deleteBooking` |
| `src/app/page.tsx` | Página principal |
| `src/components/booking-calendar.tsx` | Calendário client |
| `src/components/day-agenda.tsx` | Timeline do dia |
| `src/components/new-booking-dialog.tsx` | Modal + form |
| `src/components/booking-item.tsx` | Card de booking |
| `src/app/layout.tsx` | `<Toaster />` global |
| `.env.example` | template |
| `README.md` | instruções |

---

## Verificação end-to-end

1. **Setup**: `npm install && npx prisma migrate dev` rodam sem erro.
2. **Conexão**: `npx prisma studio` lista `Booking` vazia.
3. **Criar**: abre `/`, clica hoje, "+ Novo agendamento", preenche → toast sucesso.
4. **Conflito**: criar 14:30–15:30 em cima de 14:00–15:00 → toast "Horário já ocupado".
5. **Limite**: 15:00–16:00 cria sem conflito (limites tocando).
6. **Excluir**: card vira slot livre.
7. **Navegação por data**: trocar dia no calendário recarrega agenda; dias com bookings ficam destacados.
8. **Validações**: `endsAt <= startsAt` e fora do expediente → erro no form.
9. **Persistência**: refresh mantém dados.

---

## Fora de escopo (futuro)

- Múltiplas salas
- Autenticação real (NextAuth)
- Edição de agendamento
- Recorrência (semanal/mensal)
- Notificações por email
- PIN/senha por agendamento
- Visão semanal em grid
