package com.example.microplan.model;

import jakarta.persistence.*;
import java.math.BigDecimal;

@Entity
@Table(name = "dividas")
public class Divida {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    private Usuario usuario;

    @ManyToOne
    private Credor credor;

    private String descricao;

    @Column(precision = 40, scale = 2)
    private BigDecimal saldoAtual;

    @Column(precision = 5, scale = 2)
    private BigDecimal taxaJurosAnual;

    @Column(precision = 40, scale = 2)
    private BigDecimal parcelaMinima;

    private Integer vencimentoMensal;

    // Getters e Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Usuario getUsuario() { return usuario; }
    public void setUsuario(Usuario usuario) { this.usuario = usuario; }

    public Credor getCredor() { return credor; }
    public void setCredor(Credor credor) { this.credor = credor; }

    public String getDescricao() { return descricao; }
    public void setDescricao(String descricao) { this.descricao = descricao; }

    public BigDecimal getSaldoAtual() { return saldoAtual; }
    public void setSaldoAtual(BigDecimal saldoAtual) { this.saldoAtual = saldoAtual; }

    public BigDecimal getTaxaJurosAnual() { return taxaJurosAnual; }
    public void setTaxaJurosAnual(BigDecimal taxaJurosAnual) { this.taxaJurosAnual = taxaJurosAnual; }

    public BigDecimal getParcelaMinima() { return parcelaMinima; }
    public void setParcelaMinima(BigDecimal parcelaMinima) { this.parcelaMinima = parcelaMinima; }

    public Integer getVencimentoMensal() { return vencimentoMensal; }
    public void setVencimentoMensal(Integer vencimentoMensal) { this.vencimentoMensal = vencimentoMensal; }
}
