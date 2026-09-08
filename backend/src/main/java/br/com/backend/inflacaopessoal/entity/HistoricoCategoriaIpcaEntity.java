package br.com.backend.inflacaopessoal.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "historico_categoria_ipca", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"categoria_id", "data_referencia"})
})
public class HistoricoCategoriaIpcaEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "categoria_id", nullable = false)
    private CategoriaIpcaEntity categoria;

    @Column(name = "data_referencia", nullable = false)
    private LocalDate dataReferencia;

    @Column(name = "valor_percentual", nullable = false, precision = 10, scale = 4)
    private BigDecimal valorPercentual;

    public HistoricoCategoriaIpcaEntity() {}

    public HistoricoCategoriaIpcaEntity(CategoriaIpcaEntity categoria, LocalDate dataReferencia, BigDecimal valorPercentual) {
        this.categoria = categoria;
        this.dataReferencia = dataReferencia;
        this.valorPercentual = valorPercentual;
    }

    // Getters e Setters
    public Long getId() { return id; }
    public CategoriaIpcaEntity getCategoria() { return categoria; }
    public void setCategoria(CategoriaIpcaEntity categoria) { this.categoria = categoria; }
    public LocalDate getDataReferencia() { return dataReferencia; }
    public void setDataReferencia(LocalDate dataReferencia) { this.dataReferencia = dataReferencia; }
    public BigDecimal getValorPercentual() { return valorPercentual; }
    public void setValorPercentual(BigDecimal valorPercentual) { this.valorPercentual = valorPercentual; }
}