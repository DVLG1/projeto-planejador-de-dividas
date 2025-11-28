package com.example.microplan.dto.response;

import com.example.microplan.model.Pagamento;
import java.math.BigDecimal;
import java.time.LocalDateTime;

public class PagamentoResponse {
    private Long id;
    private Long usuarioId;
    private Long dividaId;
    private LocalDateTime data;
    private BigDecimal valor;
    private String tipo;
    private String observacao;

    public static PagamentoResponse from(Pagamento p) {
        PagamentoResponse r = new PagamentoResponse();
        r.id = p.getId();
        if (p.getUsuario() != null) r.usuarioId = p.getUsuario().getId();
        if (p.getDivida() != null) r.dividaId = p.getDivida().getId();
        r.data = p.getData();
        r.valor = p.getValor();
        r.tipo = p.getTipo();
        r.observacao = p.getObservacao();
        return r;
    }

    public Long getId() { return id; }
    public Long getUsuarioId() { return usuarioId; }
    public Long getDividaId() { return dividaId; }
    public LocalDateTime getData() { return data; }
    public BigDecimal getValor() { return valor; }
    public String getTipo() { return tipo; }
    public String getObservacao() { return observacao; }
}
