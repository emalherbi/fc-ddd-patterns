# fc-ddd-patterns

> Implementação de referência dos principais padrões de Domain-Driven Design (DDD) em TypeScript, desenvolvida como material de estudo do curso Full Cycle.

---

## Sumário

- [Visão Geral](#visão-geral)
- [Arquitetura e Estrutura](#arquitetura-e-estrutura)
- [Tecnologias Utilizadas](#tecnologias-utilizadas)
- [Metodologia e Boas Práticas](#metodologia-e-boas-práticas)
- [Domínio do Negócio](#domínio-do-negócio)
- [Como Executar](#como-executar)
- [Dependências Relevantes](#dependências-relevantes)
- [Cobertura de Testes](#cobertura-de-testes)
- [Observações Técnicas](#observações-técnicas)

---

## Visão Geral

Este repositório é uma implementação prática e didática dos padrões táticos de **Domain-Driven Design (DDD)** usando TypeScript. O projeto simula um sistema de e-commerce simplificado — com clientes, produtos e pedidos — e serve como laboratório para estudo e aplicação de:

- Entidades e Value Objects
- Agregados e Raízes de Agregado
- Repositórios e seu contrato com a infraestrutura
- Serviços de Domínio
- Eventos de Domínio e Handlers
- Factories
- Event Dispatcher

**Problema que resolve:** demonstra como organizar e isolar a lógica de negócio de forma que ela não dependa de frameworks, bancos de dados ou bibliotecas externas, seguindo os princípios do DDD tático.

---

## Arquitetura e Estrutura

O projeto segue uma **Arquitetura em Camadas** com separação explícita entre domínio e infraestrutura:

```
src/
├── domain/                     ← Camada de Domínio (regras de negócio puras)
│   ├── @shared/                ← Contratos e abstrações compartilhados
│   │   ├── event/              ← Interfaces do sistema de eventos
│   │   └── repository/         ← Interface genérica de repositório
│   │
│   ├── customer/               ← Agregado: Customer
│   │   ├── entity/             ← Entidade raiz do agregado
│   │   ├── value-object/       ← Address (Value Object)
│   │   ├── repository/         ← Contrato do repositório
│   │   └── factory/            ← Factory de Customer
│   │
│   ├── product/                ← Agregado: Product
│   │   ├── entity/             ← Entidade raiz (Product, ProductB)
│   │   ├── event/              ← ProductCreatedEvent + handler
│   │   ├── service/            ← ProductService (serviço de domínio)
│   │   ├── repository/         ← Contrato do repositório
│   │   └── factory/            ← Factory de Product
│   │
│   └── checkout/               ← Agregado: Order
│       ├── entity/             ← Order e OrderItem
│       ├── service/            ← OrderService (serviço de domínio)
│       ├── repository/         ← Contrato do repositório
│       └── factory/            ← Factory de Order
│
└── infrastructure/             ← Camada de Infraestrutura (detalhes técnicos)
    ├── customer/repository/sequelize/   ← Modelo + repositório concreto
    ├── product/repository/sequelize/    ← Modelo + repositório concreto
    └── order/repository/sequilize/      ← Modelos + repositório concreto
```

### Padrão Arquitetural

O projeto aplica o conceito de **Onion Architecture** (variação da Clean Architecture):

- O domínio é o núcleo — não importa nada de infraestrutura
- A infraestrutura depende do domínio (via interfaces), nunca o contrário
- As interfaces de repositório ficam no domínio; as implementações ficam na infraestrutura

---

## Tecnologias Utilizadas

| Categoria      | Tecnologia                       | Versão       | Uso                            |
| -------------- | -------------------------------- | ------------ | ------------------------------ |
| Linguagem      | TypeScript                       | 4.5.5        | Linguagem principal            |
| Runtime        | Node.js                          | —            | Execução                       |
| ORM            | Sequelize + sequelize-typescript | 6.17 / 2.1.3 | Persistência                   |
| Banco de Dados | SQLite3                          | 5.0          | Banco em memória para testes   |
| Testes         | Jest                             | 30.4         | Framework de testes            |
| Compilador     | SWC (`@swc/jest`)                | 0.2          | Transpilação rápida nos testes |
| IDs            | uuid                             | 8.3          | Geração de identificadores     |
| Metadados      | reflect-metadata                 | 0.1          | Suporte a decoradores          |
| Lint           | TSLint                           | 6.1          | Análise estática de código     |

---

## Metodologia e Boas Práticas

### Domain-Driven Design (DDD) — Padrões Táticos

Todos os building blocks do DDD tático estão representados no projeto:

#### Entities
Objetos com identidade única que encapsulam estado e comportamento. Validam suas invariantes no construtor e em cada mutação de estado.

```typescript
// src/domain/product/entity/product.ts
export default class Product implements ProductInterface {
  private _id: string;
  private _name: string;
  private _price: number;

  constructor(id: string, name: string, price: number) {
    this._id = id;
    this._name = name;
    this._price = price;
    this.validate(); // invariante verificada na construção
  }

  validate(): boolean {
    if (this._id.length === 0) throw new Error("Id is required");
    if (this._name.length === 0) throw new Error("Name is required");
    if (this._price < 0) throw new Error("Price must be greater than zero");
    return true;
  }
}
```

#### Value Objects
Objetos imutáveis definidos pelo seu valor, sem identidade própria. Validam sua consistência interna.

```typescript
// src/domain/customer/value-object/address.ts
export default class Address {
  constructor(
    street: string, number: number,
    zip: string,    city: string
  ) { /* ... */ this.validate(); }

  toString() {
    return `${this._street}, ${this._number}, ${this._zip} ${this._city}`;
  }
}
```

#### Aggregates
Clusters de entidades e value objects tratados como uma unidade transacional.

| Agregado | Raiz     | Value Objects | Itens Internos     |
| -------- | -------- | ------------- | ------------------ |
| Customer | Customer | Address       | —                  |
| Product  | Product  | —             | —                  |
| Order    | Order    | OrderItem     | items: OrderItem[] |

#### Repositories
Contratos definidos no domínio; implementados na infraestrutura.

```typescript
// src/domain/@shared/repository/repository-interface.ts
export default interface RepositoryInterface<T> {
  create(entity: T): Promise<void>;
  update(entity: T): Promise<void>;
  find(id: string): Promise<T>;
  findAll(): Promise<T[]>;
}
```

#### Domain Services
Lógica de negócio que envolve múltiplas entidades ou não pertence naturalmente a uma só.

```typescript
// src/domain/checkout/service/order.service.ts
static placeOrder(customer: Customer, items: OrderItem[]): Order {
  if (items.length === 0) throw new Error("Order must have at least one item");
  const order = new Order(uuid(), customer.id, items);
  customer.addRewardPoints(order.total() / 2); // side-effect no cliente
  return order;
}
```

#### Domain Events
Notificam o sistema sobre fatos importantes ocorridos no domínio.

```
ProductCreatedEvent
  └── dispatchado pelo EventDispatcher
       └── recebido por SendEmailWhenProductIsCreatedHandler
```

#### Factories
Encapsulam a lógica de criação de agregados complexos.

```typescript
// src/domain/product/factory/product.factory.ts
public static create(type: string, name: string, price: number): ProductInterface {
  switch (type) {
    case "a": return new Product(uuid(), name, price);
    case "b": return new ProductB(uuid(), name, price);
    default:  throw new Error("Product type not supported");
  }
}
```

### Princípios SOLID

| Princípio                     | Aplicação no Projeto                                                                                 |
| ----------------------------- | ---------------------------------------------------------------------------------------------------- |
| **S** — Single Responsibility | Cada classe tem uma única responsabilidade: entidade valida, repositório persiste, serviço orquestra |
| **O** — Open/Closed           | `ProductInterface` permite introduzir `ProductB` sem alterar código existente                        |
| **L** — Liskov Substitution   | `ProductB` substitui `Product` em qualquer lugar que aceite `ProductInterface`                       |
| **I** — Interface Segregation | Interfaces pequenas e coesas: `EventInterface`, `EventHandlerInterface`, `EventDispatcherInterface`  |
| **D** — Dependency Inversion  | Domínio depende de abstrações (`RepositoryInterface`); infraestrutura implementa os contratos        |

### Convenções de Código

- **Nomenclatura de arquivos**: `kebab-case` (ex: `order-item.ts`, `product-created.event.ts`)
- **Classes**: `PascalCase`
- **Propriedades privadas**: prefixo `_` (ex: `_id`, `_name`)
- **Testes**: arquivo adjacente ao código com sufixo `.spec.ts`
- **Imports**: sem extensão, caminhos relativos explícitos

---

## Domínio do Negócio

### Agregado: Customer

Representa um cliente do sistema. Pode ser ativado/desativado, possui endereço e acumula pontos de recompensa.

**Regras de negócio:**
- `id` e `name` são obrigatórios
- Um cliente só pode ser **ativado** se possuir um endereço cadastrado
- Pontos de recompensa são acumulativos e nunca decrementados diretamente

### Agregado: Product

Representa um produto disponível para venda. Existe em duas variantes (`Product` e `ProductB`) que diferem apenas no cálculo de preço, demonstrando polimorfismo via interface.

**Regras de negócio:**
- `id`, `name` são obrigatórios
- `price` deve ser maior ou igual a zero
- O preço pode ser reajustado em percentual via `ProductService`

### Agregado: Order (Checkout)

Representa um pedido composto por um ou mais itens. É o contexto central do sistema.

**Regras de negócio:**
- Um pedido precisa de ao menos um item
- Todos os itens devem ter quantidade maior que zero
- O total do pedido é calculado como soma de `price * quantity` de todos os itens
- Ao criar um pedido via `OrderService.placeOrder`, o cliente recebe `total / 2` em reward points

---

## Como Executar

### Pré-requisitos

- **Node.js** >= 16
- **npm** >= 8

### Instalação

```bash
# 1. Clone o repositório
git clone <url-do-repositorio>
cd fc-ddd-patterns

# 2. Instale as dependências
npm install
```

### Scripts

| Comando       | Descrição                                    |
| ------------- | -------------------------------------------- |
| `npm test`    | Executa type-checking + todos os testes Jest |
| `npm run tsc` | Compila TypeScript para `./dist`             |

### Executando os testes

```bash
npm test
```

Os testes de repositório utilizam **SQLite em memória** — nenhuma configuração de banco de dados é necessária.

---

## Dependências Relevantes

### Produção

| Pacote                 | Versão  | Função                                          |
| ---------------------- | ------- | ----------------------------------------------- |
| `sequelize`            | ^6.17.0 | ORM para mapeamento objeto-relacional           |
| `sequelize-typescript` | ^2.1.3  | Decoradores TypeScript para o Sequelize         |
| `sqlite3`              | ^5.0.2  | Driver SQLite (banco em memória para testes)    |
| `uuid`                 | ^8.3.2  | Geração de UUIDs para identidade das entidades  |
| `reflect-metadata`     | ^0.1.13 | Polyfill necessário para decoradores TypeScript |
| `@types/uuid`          | ^8.3.4  | Tipagens para o pacote uuid                     |

### Desenvolvimento

| Pacote                   | Versão   | Função                                       |
| ------------------------ | -------- | -------------------------------------------- |
| `typescript`             | ^4.5.5   | Compilador TypeScript                        |
| `jest`                   | ^30.4.2  | Framework de testes                          |
| `@swc/jest`              | ^0.2.20  | Transpilador rápido para execução dos testes |
| `@swc/core` + `@swc/cli` | ^1.2     | Compilador SWC (alternativa ao tsc)          |
| `ts-node`                | ^10.6.0  | Execução direta de TypeScript                |
| `tslint`                 | ^6.1.3   | Análise estática de código                   |
| `@types/jest`            | ^29.5.14 | Tipagens Jest                                |

---

## Cobertura de Testes

O projeto possui testes em dois níveis:

### Testes de Domínio (unitários)

| Arquivo                    | Camada           | O que testa                                        |
| -------------------------- | ---------------- | -------------------------------------------------- |
| `event-dispatcher.spec.ts` | @shared          | Registro, remoção e notificação de handlers        |
| `product.spec.ts`          | product/entity   | Validações da entidade Product                     |
| `product.factory.spec.ts`  | product/factory  | Criação de variantes a e b                         |
| `product.service.spec.ts`  | product/service  | Reajuste percentual de preços                      |
| `customer.spec.ts`         | customer/entity  | Validações, ativação e reward points               |
| `customer.factory.spec.ts` | customer/factory | Criação com e sem endereço                         |
| `order.spec.ts`            | checkout/entity  | Validações e cálculo de total                      |
| `order.factory.spec.ts`    | checkout/factory | Construção de Order com itens                      |
| `order.service.spec.ts`    | checkout/service | placeOrder e cálculo de total de múltiplos pedidos |

### Testes de Infraestrutura (integração)

Utilizam SQLite em memória, criando e destruindo as tabelas a cada teste via `sync({ force: true })`:

| Arquivo                       | O que testa                                                    |
| ----------------------------- | -------------------------------------------------------------- |
| `customer.repository.spec.ts` | CRUD completo de Customer com Sequelize                        |
| `product.repository.spec.ts`  | CRUD completo de Product com Sequelize                         |
| `order.repository.spec.ts`    | Criação de Order com itens (relacionamentos HasMany/BelongsTo) |

---

## Observações Técnicas

### Pontos Fortes

- **Isolamento total do domínio**: nenhuma dependência de infraestrutura no código de negócio
- **Testes rápidos e confiáveis**: domínio testado sem banco de dados; infraestrutura testada com SQLite em memória
- **Código autoexplicativo**: nomes de classes, métodos e variáveis refletem a linguagem ubíqua do negócio
- **Polimorfismo bem aplicado**: `ProductInterface` permite múltiplas implementações sem impactar o restante do sistema
- **Event Dispatcher genérico**: funciona para qualquer evento, bastando registrar o handler correto

### Melhorias Implementadas

- **`strictNullChecks` ativado**: removida a linha `"strictNullChecks": false` do `tsconfig.json`; 11 erros de tipo corrigidos (principalmente `findOne()` sem null-check nos repositórios e specs)
- **Migração TSLint → ESLint**: `tslint` removido; instalado `eslint` + `@typescript-eslint`; criado `eslint.config.js` (flat config); scripts `lint` e `lint:fix` adicionados ao `package.json`; 17 erros de lint corrigidos no código (incluindo `any` → `unknown`, variáveis não usadas, catch sem binding)
- **Eventos de domínio para Customer**: implementados `CustomerCreatedEvent` e `CustomerActivatedEvent` com três handlers (`EnviaConsoleLog1`, `EnviaConsoleLog2` para criação; `EnviaConsoleLog` para ativação) e spec cobrindo registro, notificação e isolamento entre eventos
- **`EventInterface<T>` genérico**: `eventData` passou de `unknown` para `T` com default `unknown`; cada evento declara seu payload concreto (ex: `CustomerActivatedEvent implements EventInterface<{ id: string }>`), eliminando casts nos handlers
- **Bug `CustomerRepository.find()`**: `active` e `rewardPoints` não eram restaurados ao reconstruir a entidade — corrigido alinhando `find()` com a lógica já correta de `findAll()`; novo teste adicionado para cobrir o cenário de customer ativo com pontos de recompensa
- **`OrderRepository` completo**: `update`, `find` e `findAll` já implementados com testes de integração cobrindo todos os métodos

---

*Documentação gerada com base na análise estática do código-fonte. Versão do repositório: branch `main`.*
