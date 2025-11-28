# Copilot / AI Agent instructions for MicroPlan

Purpose: help AI coding agents be productive quickly in this Spring Boot debt-planner project.

- **Project root:** `pom.xml` at repository root. Java 17, Spring Boot, Spring Data JPA, Flyway + MySQL.
- **Run:** `mvn spring-boot:run` from project root. Ensure MySQL `microplan` database exists and update `src/main/resources/application.properties` if needed.

Quick facts (files to inspect first):
- **API controllers:** `src/main/java/com/example/microplan/controller/*Controller.java` (exposes `/api/usuarios`, `/api/credores`, `/api/dividas`, `/api/pagamentos`, `/api/planos`).
- **Business logic:** `src/main/java/com/example/microplan/service/PlanoService.java` (plan generation simulation) and `DividaService.java` (payments and normalization).
- **Models:** `src/main/java/com/example/microplan/model/*.java` — `Divida`, `Usuario`, `Credor`, `Pagamento`, `PlanoQuitacao` show DB mappings and column choices (BigDecimal precision, `LONGTEXT` for plan details).
- **DTO used for generation:** `src/main/java/com/example/microplan/dto/GeneratePlanRequest.java` (fields: `usuarioId`, `valorDisponivelMensal`, `estrategia`).
- **DB migrations:** `src/main/resources/db/migration/V1__init.sql` (Flyway). `application.properties` enables Flyway and currently sets `spring.jpa.hibernate.ddl-auto=none`.

Key patterns and conventions (concrete, project-specific):
- **Monetary types:** always `BigDecimal` with scale 2. Code often uses `setScale(2, RoundingMode.HALF_UP)` in services (see `PlanoService`).
- **Validation style:** simple, done in services with thrown `Exception` messages; controllers catch exceptions and return `400` with `Map.of("error", e.getMessage())` (see `PlanoController`, `DividaController`, `PagamentoController`). Follow this pattern when adding endpoints to keep error shape uniform.
- **Transaction boundaries:** service methods that mutate multiple entities are annotated with `@Transactional` (see `PlanoService.gerarPlano` and `DividaService.aplicarPagamento`).
- **Persistence choices:** relationships use `@ManyToOne` on model classes. `PlanoQuitacao.detalhes` stores a JSON/text schedule (saved as pretty JSON string by `PlanoService`).
- **Plan strategies:** `PlanoService` supports `"SNOWBALL"` (lowest balance first) and otherwise treats as avalanche (highest annual interest first). The comparator logic is in `gerarPlano`.
- **Payments flow:** on `POST /api/pagamentos` controller saves `Pagamento` and calls `DividaService.aplicarPagamento` which subtracts the payment value from the debt (never negative). Note: there is no special-case handling of `tipo == "TOTAL"` in current code (it simply subtracts the provided `valor`).

Endpoints & example payloads (use these exact shapes):
- Generate plan: `POST /api/planos/generate`
  - Body (JSON):
    ```json
    { "usuarioId": 1, "valorDisponivelMensal": 500.00, "estrategia": "AVALANCHE" }
    ```
  - Response: `PlanoQuitacao` saved entity. The `detalhes` field contains a pretty-printed JSON array with month summaries.
- Create payment: `POST /api/pagamentos`
  - Body (JSON):
    ```json
    { "divida": { "id": 3 }, "valor": 200.00, "tipo": "PARCIAL" }
    ```
  - Controller will return saved `Pagamento` and `Divida` balance will be updated.

Notable config and developer workflows:
- Database: `src/main/resources/application.properties` points to `jdbc:mysql://localhost:3306/microplan` and includes username/password. Update before running or create the DB accordingly. Flyway will apply `V1__init.sql` migration.
- DDL strategy: the repo uses Flyway migrations and `spring.jpa.hibernate.ddl-auto=none`. Do not rely on `ddl-auto=update` in this repo unless you intentionally change the config.
- Tests: there are basic tests under `src/test`. Run `mvn test`.

Places to change for common tasks (examples):
- Add a new validation on `GeneratePlanRequest`: either add a controller-level check or update `PlanoService.gerarPlano` where inputs are validated and errors thrown.
- Improve `TOTAL` payment handling: implement logic in `PagamentoController` or `DividaService.aplicarPagamento` to zero the debt when `tipo.equals("TOTAL")` and record any overpayment if required.
- Export cronograma: `PlanoQuitacao.detalhes` already holds full schedule; add an endpoint to stream CSV by parsing that JSON.

Implementation notes for agents (do not change without tests):
- Keep existing error shape (`400` with `{"error": "..."}`) for compatibility with clients.
- Preserve `BigDecimal` scale conventions and use `RoundingMode.HALF_UP` where monetary rounding performed.
- When modifying DB schema, update `V1__init.sql` (or add a new Flyway migration) rather than changing `ddl-auto`.

If anything here is unclear or you'd like me to expand a specific section (examples, extra endpoints, or to implement the `TOTAL` payment behavior), tell me which part and I will update this file. 
