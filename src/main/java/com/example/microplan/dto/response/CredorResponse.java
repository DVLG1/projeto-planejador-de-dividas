package com.example.microplan.dto.response;

import com.example.microplan.model.Credor;

public class CredorResponse {
    private Long id;
    private String nome;
    private String contato;

    public static CredorResponse from(Credor c) {
        CredorResponse r = new CredorResponse();
        r.id = c.getId();
        r.nome = c.getNome();
        r.contato = c.getContato();
        return r;
    }

    public Long getId() { return id; }
    public String getNome() { return nome; }
    public String getContato() { return contato; }
}
