package com.example.microplan;

import com.example.microplan.dto.GeneratePlanRequest;
import com.example.microplan.model.Credor;
import com.example.microplan.model.Divida;
import com.example.microplan.model.Usuario;
import com.example.microplan.repository.CredorRepository;
import com.example.microplan.repository.DividaRepository;
import com.example.microplan.repository.UsuarioRepository;
import com.example.microplan.service.DividaService;
import com.example.microplan.service.PlanoService;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.Scanner;

/**
 * Conditional interactive CLI for manual testing. Enable with `--app.cli.enabled=true`.
 *
 * Run example (PowerShell):
 * .\mvnw.cmd -Dspring-boot.run.arguments="--app.cli.enabled=true" spring-boot:run
 */
@Component
@ConditionalOnProperty(name = "app.cli.enabled", havingValue = "true")
public class ConsoleCliRunner implements CommandLineRunner {

    private final UsuarioRepository usuarioRepo;
    private final CredorRepository credorRepo;
    private final DividaRepository dividaRepo;
    private final DividaService dividaService;
    private final PlanoService planoService;

    public ConsoleCliRunner(UsuarioRepository usuarioRepo,
                            CredorRepository credorRepo,
                            DividaRepository dividaRepo,
                            DividaService dividaService,
                            PlanoService planoService) {
        this.usuarioRepo = usuarioRepo;
        this.credorRepo = credorRepo;
        this.dividaRepo = dividaRepo;
        this.dividaService = dividaService;
        this.planoService = planoService;
    }

    @Override
    public void run(String... args) throws Exception {
        Scanner sc = new Scanner(System.in);
        System.out.println("MicroPlan interactive CLI enabled. Type number and press Enter.");

        while (true) {
            System.out.println();
            System.out.println("1) Criar Usuario");
            System.out.println("2) Criar Credor");
            System.out.println("3) Criar Divida");
            System.out.println("4) Gerar Plano (AVALANCHE/SNOWBALL)");
            System.out.println("5) Listar Usuarios");
            System.out.println("6) Listar Credores");
            System.out.println("7) Listar Dividas");
            System.out.println("0) Sair CLI");
            System.out.println("8) Resetar dados de teste (DESTRUTIVO)");
            System.out.print("Escolha: ");
            String raw = sc.nextLine().trim();
            String opt = null;
            java.util.regex.Matcher m = java.util.regex.Pattern.compile("^(\\d+)").matcher(raw);
            if (m.find()) opt = m.group(1);

            try {
                if (opt == null) {
                    System.out.println("Opção inválida. Digite apenas o número da opção (ex: 5)");
                    continue;
                }
                switch (opt) {
                    case "1": createUsuario(sc); break;
                    case "2": createCredor(sc); break;
                    case "3": createDivida(sc); break;
                    case "4": gerarPlano(sc); break;
                    case "5": listarUsuarios(); break;
                    case "6": listarCredores(); break;
                    case "7": listarDividas(); break;
                    case "8": resetarTestData(sc); break;
                    case "0": System.out.println("Saindo CLI"); return;
                    default: System.out.println("Opção inválida. Digite um número entre 0 e 8.");
                }
            } catch (Exception e) {
                System.out.println("Erro: " + e.getMessage());
            }
        }
    }

    private void createUsuario(Scanner sc) {
        System.out.print("Nome: ");
        String nome = sc.nextLine().trim();
        System.out.print("Email: ");
        String email = sc.nextLine().trim();
        System.out.print("Renda mensal (ex: 3000.00): ");
        String rendaStr = sc.nextLine().trim();
        BigDecimal renda = new BigDecimal(rendaStr);

        Usuario u = new Usuario();
        u.setNome(nome);
        u.setEmail(email);
        u.setRendaMensal(renda);
        Usuario salvo = usuarioRepo.save(u);
        System.out.println(">>> Usuário criado: id=" + salvo.getId() + ", nome=" + salvo.getNome() + ", email=" + salvo.getEmail());
    }

    private void createCredor(Scanner sc) {
        System.out.print("Nome do credor: ");
        String nome = sc.nextLine().trim();
        System.out.print("Contato: ");
        String contato = sc.nextLine().trim();
        Credor c = new Credor();
        c.setNome(nome);
        c.setContato(contato);
        Credor salvo = credorRepo.save(c);
        System.out.println(">>> Credor criado: id=" + salvo.getId() + ", nome=" + salvo.getNome());
    }

    private void createDivida(Scanner sc) throws Exception {
        listarUsuarios();
        System.out.print("Usuario id: ");
        Long uid = Long.parseLong(sc.nextLine().trim());
        Optional<Usuario> uOpt = usuarioRepo.findById(uid);
        if (uOpt.isEmpty()) { System.out.println("Usuario não encontrado"); return; }

        listarCredores();
        System.out.print("Credor id: ");
        Long cid = Long.parseLong(sc.nextLine().trim());
        Optional<Credor> cOpt = credorRepo.findById(cid);
        if (cOpt.isEmpty()) { System.out.println("Credor não encontrado"); return; }

        System.out.print("Descricao: ");
        String desc = sc.nextLine().trim();
        System.out.print("Saldo atual (ex: 1500.00): ");
        BigDecimal saldo = new BigDecimal(sc.nextLine().trim());
        System.out.print("Taxa juros anual (ex: 12.5): ");
        BigDecimal taxa = new BigDecimal(sc.nextLine().trim());
        System.out.print("Parcela minima (ex: 50.00): ");
        BigDecimal parcela = new BigDecimal(sc.nextLine().trim());
        System.out.print("Vencimento dia do mes (ex: 10): ");
        Integer venc = Integer.parseInt(sc.nextLine().trim());

        Divida d = new Divida();
        d.setUsuario(uOpt.get());
        d.setCredor(cOpt.get());
        d.setDescricao(desc);
        d.setSaldoAtual(saldo);
        d.setTaxaJurosAnual(taxa);
        d.setParcelaMinima(parcela);
        d.setVencimentoMensal(venc);

        Divida salvo = dividaService.salvar(d);
        System.out.println(">>> Dívida criada: id=" + salvo.getId() + ", descricao=" + salvo.getDescricao() + ", saldo=" + salvo.getSaldoAtual());
    }

    private void gerarPlano(Scanner sc) throws Exception {
        listarUsuarios();
        System.out.print("Usuario id para gerar plano: ");
        Long uid = Long.parseLong(sc.nextLine().trim());
        System.out.print("Valor disponivel mensal (ex: 600.00): ");
        BigDecimal valor = new BigDecimal(sc.nextLine().trim());
        System.out.print("Estrategia (AVALANCHE or SNOWBALL): ");
        String estrategia = sc.nextLine().trim();

        GeneratePlanRequest req = new GeneratePlanRequest();
        req.setUsuarioId(uid);
        req.setValorDisponivelMensal(valor);
        req.setEstrategia(estrategia);

        var plano = planoService.gerarPlano(req);
        System.out.println(">>> Plano gerado: id=" + plano.getId() + ", estrategia=" + plano.getEstrategia() + ", duracaoMeses=" + plano.getDuracaoEstimadaMeses());
    }

    private void listarUsuarios() {
        List<Usuario> list = usuarioRepo.findAll();
        System.out.println(">>> Usuários:");
        for (Usuario u : list) System.out.println(" - id=" + u.getId() + ", " + u.getNome() + " <" + u.getEmail() + ">");
    }

    private void listarCredores() {
        List<Credor> list = credorRepo.findAll();
        System.out.println(">>> Credores:");
        for (Credor c : list) System.out.println(" - id=" + c.getId() + ", " + c.getNome());
    }

    private void listarDividas() {
        List<Divida> list = dividaRepo.findAll();
        System.out.println(">>> Dívidas:");
        for (Divida d : list) System.out.println(" - id=" + d.getId() + ", " + d.getDescricao() + ", saldo=" + d.getSaldoAtual());
    }

    private boolean confirmar(Scanner sc, String mensagem) {
        System.out.print(mensagem + " (S/N): ");
        String r = sc.nextLine().trim().toUpperCase();
        return "S".equals(r) || "Y".equals(r);
    }

    private void resetarTestData(Scanner sc) {
        System.out.println("A operação irá apagar usuários, credores, dívidas e planos de teste.");
        if (!confirmar(sc, "Deseja confirmar")) {
            System.out.println("Operação cancelada pelo usuário.");
            return;
        }

        // Remove planos, pagamentos and dividas linked to test user(s)
        // Use simple heuristics: email = testuser@example.local, credor nome = Banco Exemplo
        usuarioRepo.findByEmail("testuser@example.local").ifPresent(u -> {
            // delete debts for user
            List<Divida> divs = dividaRepo.findByUsuarioId(u.getId());
            for (Divida d : divs) dividaRepo.deleteById(d.getId());
            // delete user
            usuarioRepo.deleteById(u.getId());
            System.out.println(">>> Usuário de teste removido: id=" + u.getId());
        });

        // remove test credor
        List<Credor> credores = credorRepo.findAll();
        for (Credor c : credores) {
            if ("Banco Exemplo".equalsIgnoreCase(c.getNome())) {
                credorRepo.deleteById(c.getId());
                System.out.println(">>> Credor de teste removido: id=" + c.getId());
            }
        }

        System.out.println("Reset concluído (pode haver outras entidades criadas manualmente).");
    }
}
