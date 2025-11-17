package com.example.microplan.service;

import com.example.microplan.model.Divida;
import com.example.microplan.model.Usuario;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.List;

@Service
public class FinancialHealthService {

    private final UsuarioService usuarioService;
    private final DividaService dividaService;

    public FinancialHealthService(UsuarioService usuarioService, DividaService dividaService) {
        this.usuarioService = usuarioService;
        this.dividaService = dividaService;
    }

    public int calcularScoreSaudeFinanceira(Long usuarioId) {
        Usuario usuario = usuarioService.buscarPorId(usuarioId)
                .orElseThrow(() -> new RuntimeException("Usuário não encontrado"));

        List<Divida> dividas = dividaService.listarPorUsuario(usuarioId)
                .stream()
                .filter(d -> d.getSaldoAtual().compareTo(BigDecimal.ZERO) > 0)
                .toList();

        BigDecimal rendaMensal = usuario.getRendaMensal();
        if (rendaMensal == null || rendaMensal.compareTo(BigDecimal.ZERO) <= 0) {
            return 0; // Sem renda, score zero
        }

        int quantidadeDividas = dividas.size();
        BigDecimal totalDividas = dividas.stream()
                .map(Divida::getSaldoAtual)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal mediaTaxaJuros = BigDecimal.ZERO;
        if (!dividas.isEmpty()) {
            mediaTaxaJuros = dividas.stream()
                    .map(Divida::getTaxaJurosAnual)
                    .reduce(BigDecimal.ZERO, BigDecimal::add)
                    .divide(BigDecimal.valueOf(dividas.size()), 2, RoundingMode.HALF_UP);
        }

        // Fator atraso simulado: conta dívidas vencidas hoje (simulado como se fosse dia atual >= vencimento)
        int dividasAtrasadas = (int) dividas.stream()
                .filter(d -> d.getVencimentoMensal() != null && LocalDate.now().getDayOfMonth() > d.getVencimentoMensal())
                .count();

        // Cálculo do score
        double score = 100.0;

        // Penalidade por porcentagem da renda comprometida com dívidas (ideally no more than 30% of income)
        BigDecimal parcelaMinimasTotal = dividas.stream()
                .map(d -> d.getParcelaMinima() != null ? d.getParcelaMinima() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        double percentualComprometido = parcelaMinimasTotal.divide(rendaMensal, 4, RoundingMode.HALF_UP).doubleValue() * 100;
        if (percentualComprometido > 30) {
            score -= (percentualComprometido - 30) * 0.5; // Penaliza excesso
        }

        // Penalidade por quantidade de dívidas
        score -= quantidadeDividas * 5;

        // Penalidade por taxa média de juros (mínima 5% ideal)
        double taxaMedia = mediaTaxaJuros.doubleValue();
        if (taxaMedia > 5) {
            score -= (taxaMedia - 5) * 2;
        }

        // Penalidade por dívidas atrasadas
        score -= dividasAtrasadas * 10;

        // Limita entre 0 e 100
        return Math.max(0, Math.min(100, (int) score));
    }
}
