package com.example.microplan.dto;


import java.math.BigDecimal;

public class GeneratePlanRequest {
    private Long usuarioId;
    private BigDecimal valorDisponivelMensal;
    private String estrategia; // "AVALANCHE" ou "SNOWBALL"

    public Long getUsuarioId() {
        return usuarioId;
    }

    public void setUsuarioId(Long usuarioId) {
        this.usuarioId = usuarioId;
    }

    public BigDecimal getValorDisponivelMensal() {
        return valorDisponivelMensal;
    }

    public void setValorDisponivelMensal(BigDecimal valorDisponivelMensal) {
        this.valorDisponivelMensal = valorDisponivelMensal;
    }

    public String getEstrategia() {
        return estrategia;
    }

    public void setEstrategia(String estrategia) {
        this.estrategia = estrategia;
    }
}
