package br.com.backend.inflacaopessoal.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "categoria_ipca")
public class CategoriaIpcaEntity {

    @Id
    private String id; // O próprio ID retornado pelo IBGE, ex: "7170"
    
    private String nome;

    public CategoriaIpcaEntity() {}

    public CategoriaIpcaEntity(String id, String nome) {
        this.id = id;
        this.nome = nome;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getNome() { return nome; }
    public void setNome(String nome) { this.nome = nome; }
}