package com.example.microplan.service;

import com.example.microplan.model.Credor;
import com.example.microplan.model.Divida;
import com.example.microplan.model.Usuario;
import com.example.microplan.repository.CredorRepository;
import com.example.microplan.repository.UsuarioRepository;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class SerasaImportService {

    private final CredorRepository credorRepo;
    private final UsuarioRepository usuarioRepo;
    private final DividaService dividaService;
    private final JdbcTemplate jdbc;

    public SerasaImportService(CredorRepository credorRepo, UsuarioRepository usuarioRepo, DividaService dividaService, JdbcTemplate jdbc) {
        this.credorRepo = credorRepo;
        this.usuarioRepo = usuarioRepo;
        this.dividaService = dividaService;
        this.jdbc = jdbc;
    }

    /**
     * Gera uma lista de dívidas mock determinísticas a partir do CPF.
     * Cada CPF produzirá sempre a mesma lista (mesma ordem/valores).
     */
    public List<Map<String, Object>> generateMockDividas(String cpf) {
        String clean = cpf == null ? "" : cpf.replaceAll("\\D", "");
        if (clean.isEmpty()) clean = "0";

        // Primeiro tente buscar no banco de mock Serasa (tabelas serasa_persons / serasa_dividas)
        try {
            String sql = "SELECT p.cpf as cpf, d.credor as credor, d.valor as valor, DATE_FORMAT(d.vencimento, '%Y-%m-%d') as vencimento, d.descricao as descricao, d.juros as juros " +
                    "FROM serasa_persons p JOIN serasa_dividas d ON d.person_id = p.id WHERE p.cpf = ?";
            List<Map<String, Object>> rows = jdbc.queryForList(sql, clean);
            if (rows != null && !rows.isEmpty()) {
                List<Map<String, Object>> result = new ArrayList<>();
                int idx = 1;
                for (Map<String, Object> r : rows) {
                    Map<String, Object> m = new HashMap<>();
                    m.put("id", idx++);
                    m.put("credor", r.get("credor"));
                    m.put("valor", r.get("valor"));
                    m.put("vencimento", r.get("vencimento"));
                    m.put("descricao", r.get("descricao"));
                    m.put("juros", r.get("juros"));
                    result.add(m);
                }
                return result;
            }
        } catch (Exception e) {
            // Se a tabela não existir ou houver erro, cai para gerador determinístico
        }

        // Fallback: gerador determinístico baseado no CPF (como antes)
        int seed = 0;
        for (char ch : clean.toCharArray()) {
            seed = (seed * 31 + (ch - '0')) & 0x7fffffff;
        }

        String[] credores = new String[]{"Nubank", "Bradesco", "Santander", "C6 Bank", "Banco do Brasil"};
        String[] tipos = new String[]{"Cartão de Crédito", "Empréstimo Pessoal", "Financiamento", "Cheque Especial", "Consignado"};
        // juros anuais típicos (em percentuais) usados como fallback realista
        java.math.BigDecimal[] jurosPadrao = new java.math.BigDecimal[]{
            java.math.BigDecimal.valueOf(120.0).setScale(2, java.math.RoundingMode.HALF_UP), // cartão de crédito
            java.math.BigDecimal.valueOf(35.0).setScale(2, java.math.RoundingMode.HALF_UP),  // empréstimo pessoal
            java.math.BigDecimal.valueOf(8.5).setScale(2, java.math.RoundingMode.HALF_UP),   // financiamento
            java.math.BigDecimal.valueOf(240.0).setScale(2, java.math.RoundingMode.HALF_UP), // cheque especial (muito alto)
            java.math.BigDecimal.valueOf(6.0).setScale(2, java.math.RoundingMode.HALF_UP)    // consignado (mais baixo)
        };

        int count = 1 + (Math.abs(seed) % 4); // entre 1 e 4 dívidas
        List<Map<String, Object>> list = new ArrayList<>();

        for (int i = 0; i < count; i++) {
            int idx = Math.abs(seed + i) % credores.length;
            String nome = credores[idx];
            // Escolher tipo/descricao e juros padrão baseado no idx
            String tipo = tipos[idx % tipos.length];
            java.math.BigDecimal jurosTipo = jurosPadrao[idx % jurosPadrao.length];

            // Definir ranges plausíveis por tipo
            double min = 200.0, max = 5000.0;
            switch (tipo) {
                case "Cartão de Crédito": min = 500.0; max = 15000.0; break;
                case "Empréstimo Pessoal": min = 2000.0; max = 50000.0; break;
                case "Financiamento": min = 5000.0; max = 200000.0; break;
                case "Cheque Especial": min = 100.0; max = 10000.0; break;
                case "Consignado": min = 1000.0; max = 100000.0; break;
                default: min = 200.0; max = 5000.0; break;
            }

            // Gerar valor determinístico dentro do range usando seed + posição
            long span = Math.max(1, (long)Math.round(max - min));
            long vSeed = Math.abs((seed + i) & 0x7fffffff);
            double valor = min + (vSeed % span) + ((vSeed / (i + 1)) % 100) / 100.0;

            int month = 1 + (int)((Math.abs(seed) / (i + 3)) % 12);
            int day = 1 + (int)((Math.abs(seed) + i) % 28);
            String venc = String.format("2025-%02d-%02d", month, day);

            Map<String, Object> m = new HashMap<>();
            m.put("id", i + 1);
            m.put("credor", nome);
            m.put("valor", Math.round(valor * 100.0) / 100.0);
            m.put("vencimento", venc);
            m.put("descricao", tipo);
            m.put("juros", jurosTipo);
            list.add(m);
        }

        return list;
    }

    @Transactional
    public List<Divida> importarPorCpf(String cpf, Long usuarioId) throws Exception {
        Usuario usuario = usuarioRepo.findById(usuarioId).orElseThrow(() -> new Exception("Usuário não encontrado"));

        List<Map<String, Object>> mockDividas = generateMockDividas(cpf);

        List<Divida> created = new ArrayList<>();

        for (Map<String, Object> m : mockDividas) {
            String nomeCredor = (String) m.get("credor");
            Double valor = ((Number) m.get("valor")).doubleValue();
            String venc = (String) m.get("vencimento");
            String descricao = m.get("descricao") != null ? String.valueOf(m.get("descricao")) : "Dívida importada";
            Object jurosObj = m.get("juros");
            java.math.BigDecimal juros = null;
            if (jurosObj != null) {
                if (jurosObj instanceof Number) {
                    juros = java.math.BigDecimal.valueOf(((Number) jurosObj).doubleValue()).setScale(2, java.math.RoundingMode.HALF_UP);
                } else {
                    try { juros = new java.math.BigDecimal(String.valueOf(jurosObj)).setScale(2, java.math.RoundingMode.HALF_UP); } catch (Exception ex) { juros = java.math.BigDecimal.valueOf(12).setScale(2, java.math.RoundingMode.HALF_UP); }
                }
            }
            Credor credor = credorRepo.findFirstByNome(nomeCredor).orElseGet(() -> {
                Credor c = new Credor();
                c.setNome(nomeCredor);
                c.setContato(null);
                return credorRepo.save(c);
            });

            Divida d = new Divida();
            d.setUsuario(usuario);
            d.setCredor(credor);
            d.setDescricao(descricao);
            d.setSaldoAtual(BigDecimal.valueOf(valor).setScale(2, RoundingMode.HALF_UP));
            if (juros != null) d.setTaxaJurosAnual(juros); else d.setTaxaJurosAnual(BigDecimal.valueOf(12).setScale(2, RoundingMode.HALF_UP));
            // parcela mínima 5% do saldo
            d.setParcelaMinima(d.getSaldoAtual().multiply(BigDecimal.valueOf(0.05)).setScale(2, RoundingMode.HALF_UP));
            try {
                LocalDate dt = LocalDate.parse(venc);
                d.setVencimentoMensal(dt.getDayOfMonth());
                d.setVencimento(dt);
            } catch (Exception ex) {
                d.setVencimentoMensal(1);
                d.setVencimento(null);
            }

            Divida salvo = dividaService.salvar(d);
            created.add(salvo);
        }

        return created;
    }

    /**
     * Obtém o score do Serasa (mock) para um CPF.
     */
    public int getScore(String cpf) {
        String clean = cpf == null ? "" : cpf.replaceAll("\\D", "");
        if (clean.isEmpty()) clean = "0";

        try {
            String sql = "SELECT score FROM serasa_persons WHERE cpf = ?";
            Integer score = jdbc.queryForObject(sql, Integer.class, clean);
            if (score != null) {
                return score;
            }
        } catch (Exception e) {
            // Fallback se não encontrar
        }

        // Fallback determinístico
        return 600 + (clean.hashCode() & 0x3F) % 200;
    }
}
