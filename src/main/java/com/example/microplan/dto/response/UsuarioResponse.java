package com.example.microplan.dto.response;

import com.example.microplan.model.Usuario;
import java.math.BigDecimal;

public class UsuarioResponse {
    private Long id;
    private String nome;
    private String email;
    private String cpf;
    private BigDecimal rendaMensal;

    public static UsuarioResponse from(Usuario u) {
        UsuarioResponse r = new UsuarioResponse();
        r.id = u.getId();
        r.nome = u.getNome();
        r.email = u.getEmail();
        r.cpf = u.getCpf();
        r.rendaMensal = u.getRendaMensal();
        return r;
    }

    public Long getId() { return id; }
    public String getNome() { return nome; }
    public String getEmail() { return email; }
    public String getCpf() { return cpf; }
    public BigDecimal getRendaMensal() { return rendaMensal; }
}
