package br.com.backend.auth.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;

@Entity
@Table(name = "historico_calculo_itens")
public class HistoricoCalculoItemEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "historico_calculo_id", nullable = false)
    private HistoricoCalculoInflacaoEntity historicoCalculo;

    @Column(name = "categoria_id", nullable = false)
    private String categoriaId;

    @Column(name = "nome_categoria")
    private String nomeCategoria;

    @Column(name = "valor_gasto", nullable = false, precision = 15, scale = 2)
    private BigDecimal valorGasto;

    public HistoricoCalculoItemEntity() {}

    public HistoricoCalculoItemEntity(String categoriaId, BigDecimal valorGasto) {
        this.categoriaId = categoriaId;
        this.valorGasto = valorGasto;
    }

    // Getters e Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public HistoricoCalculoInflacaoEntity getHistoricoCalculo() { return historicoCalculo; }
    public void setHistoricoCalculo(HistoricoCalculoInflacaoEntity historicoCalculo) { this.historicoCalculo = historicoCalculo; }

    public String getCategoriaId() { return categoriaId; }
    public void setCategoriaId(String categoriaId) { this.categoriaId = categoriaId; }

    public String getNomeCategoria() { return nomeCategoria; }
    public void setNomeCategoria(String nomeCategoria) { this.nomeCategoria = nomeCategoria; }

    public BigDecimal getValorGasto() { return valorGasto; }
    public void setValorGasto(BigDecimal valorGasto) { this.valorGasto = valorGasto; }
}