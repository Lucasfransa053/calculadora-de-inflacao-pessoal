package br.com.backend.auth.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "historico_calculos_inflacao")
public class HistoricoCalculoInflacaoEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_id", nullable = false)
    private UsuarioEntity usuario;

    @Column(name = "data_inicio", nullable = false)
    private LocalDate dataInicio;

    @Column(name = "data_fim", nullable = false)
    private LocalDate dataFim;

    @Column(name = "inflacao_pessoal_percentual", precision = 10, scale = 2)
    private BigDecimal inflacaoPessoalPercentual;

    @Column(name = "inflacao_oficial_ipca_percentual", precision = 10, scale = 2)
    private BigDecimal inflacaoOficialIpcaPercentual;

    @Column(name = "custo_total_inicial", precision = 15, scale = 2)
    private BigDecimal custoTotalInicial;

    @Column(name = "custo_total_recomposto", precision = 15, scale = 2)
    private BigDecimal custoTotalRecomposto;

    @Column(name = "data_consulta", nullable = false)
    private LocalDateTime dataConsulta = LocalDateTime.now();

    // Mapeamento 1 -> N com os itens inseridos
    @OneToMany(mappedBy = "historicoCalculo", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<HistoricoCalculoItemEntity> itens = new ArrayList<>();

    public HistoricoCalculoInflacaoEntity() {}

    public HistoricoCalculoInflacaoEntity(UsuarioEntity usuario, LocalDate dataInicio, LocalDate dataFim, 
                                           BigDecimal inflacaoPessoalPercentual, BigDecimal custoTotalInicial, 
                                           BigDecimal custoTotalRecomposto) {
        this.usuario = usuario;
        this.dataInicio = dataInicio;
        this.dataFim = dataFim;
        this.inflacaoPessoalPercentual = inflacaoPessoalPercentual;
        this.custoTotalInicial = custoTotalInicial;
        this.custoTotalRecomposto = custoTotalRecomposto;
        this.dataConsulta = LocalDateTime.now();
    }

    public void adicionarItem(HistoricoCalculoItemEntity item) {
        itens.add(item);
        item.setHistoricoCalculo(this);
    }

    // Getters e Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public UsuarioEntity getUsuario() { return usuario; }
    public void setUsuario(UsuarioEntity usuario) { this.usuario = usuario; }

    public LocalDate getDataInicio() { return dataInicio; }
    public void setDataInicio(LocalDate dataInicio) { this.dataInicio = dataInicio; }

    public LocalDate getDataFim() { return dataFim; }
    public void setDataFim(LocalDate dataFim) { this.dataFim = dataFim; }

    public BigDecimal getInflacaoPessoalPercentual() { return inflacaoPessoalPercentual; }
    public void setInflacaoPessoalPercentual(BigDecimal inflacaoPessoalPercentual) { this.inflacaoPessoalPercentual = inflacaoPessoalPercentual; }

    public BigDecimal getInflacaoOficialIpcaPercentual() { return inflacaoOficialIpcaPercentual; }
public void setInflacaoOficialIpcaPercentual(BigDecimal inflacaoOficialIpcaPercentual) { this.inflacaoOficialIpcaPercentual = inflacaoOficialIpcaPercentual; }

    public BigDecimal getCustoTotalInicial() { return custoTotalInicial; }
    public void setCustoTotalInicial(BigDecimal custoTotalInicial) { this.custoTotalInicial = custoTotalInicial; }

    public BigDecimal getCustoTotalRecomposto() { return custoTotalRecomposto; }
    public void setCustoTotalRecomposto(BigDecimal custoTotalRecomposto) { this.custoTotalRecomposto = custoTotalRecomposto; }

    public LocalDateTime getDataConsulta() { return dataConsulta; }
    public void setDataConsulta(LocalDateTime dataConsulta) { this.dataConsulta = dataConsulta; }

    public List<HistoricoCalculoItemEntity> getItens() { return itens; }
    public void setItens(List<HistoricoCalculoItemEntity> itens) { this.itens = itens; }
}