package com.example.microplan.dto.response;

import com.example.microplan.model.PlanoQuitacao;
import java.math.BigDecimal;
import java.time.LocalDateTime;

public class PlanoQuitacaoResponse {
    private Long id;
    private Long usuarioId;
    private String estrategia;
    private BigDecimal valorDisponivelMensal;
    private LocalDateTime dataCriacao;
    private Integer duracaoEstimadaMeses;
    private BigDecimal totalPagoEstimado;
    private BigDecimal custoTotalJuros;
    private String detalhes;

    public static PlanoQuitacaoResponse from(PlanoQuitacao p) {
        PlanoQuitacaoResponse r = new PlanoQuitacaoResponse();
        r.id = p.getId();
        if (p.getUsuario() != null) r.usuarioId = p.getUsuario().getId();
        r.estrategia = p.getEstrategia();
        r.valorDisponivelMensal = p.getValorDisponivelMensal();
        r.dataCriacao = p.getDataCriacao();
        r.duracaoEstimadaMeses = p.getDuracaoEstimadaMeses();
        r.totalPagoEstimado = p.getTotalPagoEstimado();
        r.custoTotalJuros = p.getCustoTotalJuros();
        r.detalhes = p.getDetalhes();
        return r;
    }

    public Long getId() { return id; }
    public Long getUsuarioId() { return usuarioId; }
    public String getEstrategia() { return estrategia; }
    public BigDecimal getValorDisponivelMensal() { return valorDisponivelMensal; }
    public LocalDateTime getDataCriacao() { return dataCriacao; }
    public Integer getDuracaoEstimadaMeses() { return duracaoEstimadaMeses; }
    public BigDecimal getTotalPagoEstimado() { return totalPagoEstimado; }
    public BigDecimal getCustoTotalJuros() { return custoTotalJuros; }
    public String getDetalhes() { return detalhes; }
}
