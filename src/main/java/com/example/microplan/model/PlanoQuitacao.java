package com.example.microplan.model;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "planos")
public class PlanoQuitacao {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    private Usuario usuario;

    private String estrategia;

    @Column(precision = 19, scale = 2)
    private BigDecimal valorDisponivelMensal;

    private LocalDateTime dataCriacao;

    private Integer duracaoEstimadaMeses;

    @Column(precision = 19, scale = 2)
    private BigDecimal totalPagoEstimado;

    @Column(precision = 19, scale = 2)
    private BigDecimal custoTotalJuros;

    @Column(columnDefinition = "LONGTEXT")
    private String detalhes;

    // Getters e Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Usuario getUsuario() { return usuario; }
    public void setUsuario(Usuario usuario) { this.usuario = usuario; }

    public String getEstrategia() { return estrategia; }
    public void setEstrategia(String estrategia) { this.estrategia = estrategia; }

    public BigDecimal getValorDisponivelMensal() { return valorDisponivelMensal; }
    public void setValorDisponivelMensal(BigDecimal valorDisponivelMensal) { this.valorDisponivelMensal = valorDisponivelMensal; }

    public LocalDateTime getDataCriacao() { return dataCriacao; }
    public void setDataCriacao(LocalDateTime dataCriacao) { this.dataCriacao = dataCriacao; }

    public Integer getDuracaoEstimadaMeses() { return duracaoEstimadaMeses; }
    public void setDuracaoEstimadaMeses(Integer duracaoEstimadaMeses) { this.duracaoEstimadaMeses = duracaoEstimadaMeses; }

    public BigDecimal getTotalPagoEstimado() { return totalPagoEstimado; }
    public void setTotalPagoEstimado(BigDecimal totalPagoEstimado) { this.totalPagoEstimado = totalPagoEstimado; }

    public BigDecimal getCustoTotalJuros() { return custoTotalJuros; }
    public void setCustoTotalJuros(BigDecimal custoTotalJuros) { this.custoTotalJuros = custoTotalJuros; }

    public String getDetalhes() { return detalhes; }
    public void setDetalhes(String detalhes) { this.detalhes = detalhes; }
}
