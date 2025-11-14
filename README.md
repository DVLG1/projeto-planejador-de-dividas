MicroPlan — quick dev README

This project is a simple debt planner (Spring Boot, Java 17, MySQL).

Quick commands

- Build:

```powershell
.\mvnw.cmd -DskipTests=true package
```

- Run web server (default port 8080) with Maven wrapper:

```powershell
.\mvnw.cmd -DskipTests=true spring-boot:run
```

- Run web server on a different port (example 9090):

```powershell
$env:SPRING_APPLICATION_JSON='{"server":{"port":9090}}'
.\mvnw.cmd -DskipTests=true spring-boot:run
```

- Run CLI (headless) interactive mode (no web server):

```powershell
$env:SPRING_APPLICATION_JSON='{"spring":{"main":{"web-application-type":"none"}},"app":{"cli":{"enabled":true}}}'
.\mvnw.cmd -DskipTests=true spring-boot:run
```

- Alternative: run packaged jar with CLI enabled:

```powershell
java -jar .\target\microplan-0.0.1-SNAPSHOT.jar --spring.main.web-application-type=none --app.cli.enabled=true
```

Using the interactive CLI

- Menu options are printed on startup. Type the option number (e.g. `5`) or copy/paste the menu text like `5) Listar Usuarios` — the runner extracts the leading number.
- There is a destructive "Reset test data" menu option (8). It will ask for confirmation `Deseja confirmar (S/N)?` before deleting test user/credor/dividas.

Seed script

- `scripts/seed-data.ps1` posts sample data and generates a plan. It targets `http://localhost:9090` by default (update if you run on a different port).

Notes

- The app uses Flyway migrations; ensure the `microplan` database exists and credentials in `src/main/resources/application.properties` are correct.
- Monetary values use `BigDecimal` with scale 2.

If you want, I can add more CLI commands, safer reset (with regex), or an integration test that runs the CLI automatically.