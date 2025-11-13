package com.example.microplan.service;

import com.example.microplan.dto.GeneratePlanRequest;
import com.example.microplan.model.Divida;
import com.example.microplan.model.PlanoQuitacao;
import com.example.microplan.model.Usuario;
import com.example.microplan.repository.DividaRepository;
import com.example.microplan.repository.PlanoQuitacaoRepository;
import com.example.microplan.repository.UsuarioRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class PlanoService {

    private final DividaRepository dividaRepo;
    private final UsuarioRepository usuarioRepo;
    private final PlanoQuitacaoRepository planoRepo;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public PlanoService(DividaRepository dividaRepo,
                        UsuarioRepository usuarioRepo,
                        PlanoQuitacaoRepository planoRepo) {
        this.dividaRepo = dividaRepo;
        this.usuarioRepo = usuarioRepo;
        this.planoRepo = planoRepo;
    }

    @Transactional
    public PlanoQuitacao gerarPlano(GeneratePlanRequest req) throws Exception {
        Optional<Usuario> uOpt = usuarioRepo.findById(req.getUsuarioId());
        if (uOpt.isEmpty()) throw new Exception("Usuário não encontrado");

        List<Divida> dividas = dividaRepo.findByUsuarioId(req.getUsuarioId())
                .stream()
                .filter(d -> d.getSaldoAtual() != null && d.getSaldoAtual().compareTo(BigDecimal.ZERO) > 0)
                .collect(Collectors.toList());

        if (dividas.isEmpty()) throw new Exception("Usuário não tem dívidas ativas");

        BigDecimal disponivel = req.getValorDisponivelMensal();
        if (disponivel == null || disponivel.compareTo(BigDecimal.ZERO) <= 0)
            throw new Exception("valorDisponivelMensal deve ser positivo");

        BigDecimal somaMinimas = dividas.stream()
                .map(d -> d.getParcelaMinima() == null ? BigDecimal.ZERO : d.getParcelaMinima())
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        if (somaMinimas.compareTo(disponivel) > 0)
            throw new Exception("Valor disponível mensal é menor que a soma das parcelas mínimas");

        // --- CLASSE INTERNA QUE FALTAVA ---
        class DividaSim {
            Long id;
            String descricao;
            BigDecimal saldo;
            BigDecimal taxaAnual;
            BigDecimal parcelaMinima;

            DividaSim(Divida d) {
                this.id = d.getId();
                this.descricao = d.getDescricao();
                this.saldo = d.getSaldoAtual().setScale(2, RoundingMode.HALF_UP);
                this.taxaAnual = d.getTaxaJurosAnual() == null ? BigDecimal.ZERO : d.getTaxaJurosAnual();
                this.parcelaMinima = d.getParcelaMinima() == null
                        ? BigDecimal.ZERO
                        : d.getParcelaMinima().setScale(2, RoundingMode.HALF_UP);
            }
        }
        // --- FIM DA CLASSE ---

        List<DividaSim> sims = dividas.stream().map(DividaSim::new).toList();

        Comparator<DividaSim> comparator =
                "SNOWBALL".equalsIgnoreCase(req.getEstrategia())
                        ? Comparator.comparing(d -> d.saldo)
                        : (d1, d2) -> d2.taxaAnual.compareTo(d1.taxaAnual);

        List<ObjectNode> cronograma = new ArrayList<>();

        BigDecimal totalPago = BigDecimal.ZERO;
        BigDecimal totalJuros = BigDecimal.ZERO;

        int mes = 0;

        while (sims.stream().anyMatch(s -> s.saldo.compareTo(BigDecimal.ZERO) > 0) && mes < 360) {
            mes++;

            ObjectNode mesNode = objectMapper.createObjectNode();
            mesNode.put("mes", mes);

            BigDecimal jurosMes = BigDecimal.ZERO;

            for (DividaSim s : sims) {
                if (s.saldo.compareTo(BigDecimal.ZERO) <= 0) continue;

                BigDecimal juros = s.saldo
                        .multiply(s.taxaAnual.divide(BigDecimal.valueOf(12), 12, RoundingMode.HALF_UP))
                        .divide(BigDecimal.valueOf(100), 12, RoundingMode.HALF_UP)
                        .setScale(2, RoundingMode.HALF_UP);

                jurosMes = jurosMes.add(juros);
                s.saldo = s.saldo.add(juros);
            }

            totalJuros = totalJuros.add(jurosMes);

            BigDecimal restante = disponivel;

            for (DividaSim s : sims) {
                if (s.saldo.compareTo(BigDecimal.ZERO) <= 0) continue;

                BigDecimal minimo = s.parcelaMinima.min(s.saldo);
                s.saldo = s.saldo.subtract(minimo);
                totalPago = totalPago.add(minimo);
                restante = restante.subtract(minimo);
            }

            List<DividaSim> ordenadas = sims.stream()
                    .filter(s -> s.saldo.compareTo(BigDecimal.ZERO) > 0)
                    .sorted(comparator)
                    .toList();

            for (DividaSim s : ordenadas) {
                if (restante.compareTo(BigDecimal.ZERO) <= 0) break;

                BigDecimal extra = s.saldo.min(restante);
                s.saldo = s.saldo.subtract(extra);
                totalPago = totalPago.add(extra);
                restante = restante.subtract(extra);
            }

            ObjectNode resumo = objectMapper.createObjectNode();
            resumo.put("jurosDoMes", jurosMes.doubleValue());
            resumo.put("saldoRestanteTotal", sims.stream().map(s -> s.saldo).reduce(BigDecimal.ZERO, BigDecimal::add).doubleValue());

            mesNode.set("resumo", resumo);
            cronograma.add(mesNode);
        }

        PlanoQuitacao plano = new PlanoQuitacao();
        plano.setUsuario(uOpt.get());
        plano.setEstrategia(req.getEstrategia());
        plano.setValorDisponivelMensal(disponivel);
        plano.setDataCriacao(LocalDateTime.now());
        plano.setDuracaoEstimadaMeses(mes);
        plano.setTotalPagoEstimado(totalPago);
        plano.setCustoTotalJuros(totalJuros);
        plano.setDetalhes(objectMapper.writerWithDefaultPrettyPrinter().writeValueAsString(cronograma));

        planoRepo.save(plano);
        return plano;
    }

    public Optional<PlanoQuitacao> buscarPorId(Long id) {
        return planoRepo.findById(id);
    }

    public List<PlanoQuitacao> buscarPorUsuario(Long uid) {
        return planoRepo.findByUsuarioId(uid);
    }
}
