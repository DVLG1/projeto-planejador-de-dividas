package com.example.microplan.dto.response;

import com.example.microplan.model.Divida;
import java.math.BigDecimal;

public class DividaResponse {
    private Long id;
    private Long usuarioId;
    private String usuarioNome;
    private Long credorId;
    private String credorNome;
    private String descricao;
    private BigDecimal saldoAtual;
    private BigDecimal taxaJurosAnual;
    private BigDecimal parcelaMinima;
    private Integer vencimentoMensal;
    private java.time.LocalDate vencimento;

    public static DividaResponse from(Divida d) {
        DividaResponse r = new DividaResponse();
        r.id = d.getId();
        if (d.getUsuario() != null) {
            r.usuarioId = d.getUsuario().getId();
            r.usuarioNome = d.getUsuario().getNome();
        }
        if (d.getCredor() != null) {
            r.credorId = d.getCredor().getId();
            r.credorNome = d.getCredor().getNome();
        }
        r.descricao = d.getDescricao();
        r.saldoAtual = d.getSaldoAtual();
        r.taxaJurosAnual = d.getTaxaJurosAnual();
        r.parcelaMinima = d.getParcelaMinima();
        r.vencimentoMensal = d.getVencimentoMensal();
        r.vencimento = d.getVencimento();
        return r;
    }

    public Long getId() { return id; }
    public Long getUsuarioId() { return usuarioId; }
    public String getUsuarioNome() { return usuarioNome; }
    public Long getCredorId() { return credorId; }
    public String getCredorNome() { return credorNome; }
    public String getDescricao() { return descricao; }
    public BigDecimal getSaldoAtual() { return saldoAtual; }
    public BigDecimal getTaxaJurosAnual() { return taxaJurosAnual; }
    public BigDecimal getParcelaMinima() { return parcelaMinima; }
    public Integer getVencimentoMensal() { return vencimentoMensal; }
    public java.time.LocalDate getVencimento() { return vencimento; }
}
