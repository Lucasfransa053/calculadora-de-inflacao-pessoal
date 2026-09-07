package br.com.backend.ipca.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "historico_ipca")
public class HistoricoIpcaEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "data_referencia", nullable = false, unique = true)
    private LocalDate dataReferencia;

    @Column(name = "valor_percentual", nullable = false, precision = 5, scale = 2)
    private BigDecimal valorPercentual;

    public HistoricoIpcaEntity() {}

    public HistoricoIpcaEntity(LocalDate dataReferencia, BigDecimal valorPercentual) {
        this.dataReferencia = dataReferencia;
        this.valorPercentual = valorPercentual;
    }

    public Long getId() { return id; }
    public LocalDate getDataReferencia() { return dataReferencia; }
    public void setDataReferencia(LocalDate dataReferencia) { this.dataReferencia = dataReferencia; }
    public BigDecimal getValorPercentual() { return valorPercentual; }
    public void setValorPercentual(BigDecimal valorPercentual) { this.valorPercentual = valorPercentual; }
}