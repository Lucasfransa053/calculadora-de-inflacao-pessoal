package br.com.backend.ipca.service;

import br.com.backend.ipca.client.BancoCentralClient;
import br.com.backend.ipca.dto.CorrecaoRequestDTO;
import br.com.backend.ipca.dto.CorrecaoResponseDTO;
import br.com.backend.ipca.dto.IpcaDTO;
import br.com.backend.ipca.entity.HistoricoIpcaEntity;
import br.com.backend.ipca.repository.HistoricoIpcaRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;

@Service
public class IpcaService {

    private final BancoCentralClient bancoCentralClient;
    private final HistoricoIpcaRepository ipcaRepository;

    public IpcaService(BancoCentralClient bancoCentralClient, HistoricoIpcaRepository ipcaRepository) {
        this.bancoCentralClient = bancoCentralClient;
        this.ipcaRepository = ipcaRepository;
    }

    @Transactional(readOnly = true)
    public IpcaDTO[] buscarHistoricoIpca() {
        return bancoCentralClient.buscarHistoricoIpca();
    }

    @Transactional(readOnly = true)
    public CorrecaoResponseDTO calcularCorrecao(CorrecaoRequestDTO request) {
        LocalDate inicio = request.dataInicio().atDay(1);
        LocalDate fim = request.dataFim().atDay(1);

        List<HistoricoIpcaEntity> taxas = ipcaRepository.findByDataReferenciaBetweenOrderByDataReferenciaAsc(inicio, fim);

        BigDecimal fatorAcumulado = BigDecimal.ONE;

        for (HistoricoIpcaEntity taxa : taxas) {
            BigDecimal taxaDecimal = taxa.getValorPercentual()
                    .divide(new BigDecimal("100"), 8, RoundingMode.HALF_UP)
                    .add(BigDecimal.ONE);

            fatorAcumulado = fatorAcumulado.multiply(taxaDecimal);
        }

        BigDecimal valorCorrigido = request.valorInicial()
                .multiply(fatorAcumulado)
                .setScale(2, RoundingMode.HALF_UP);

        BigDecimal variacaoTotal = fatorAcumulado.subtract(BigDecimal.ONE)
                .multiply(new BigDecimal("100"))
                .setScale(2, RoundingMode.HALF_UP);

        return new CorrecaoResponseDTO(
                request.valorInicial(),
                valorCorrigido,
                variacaoTotal,
                taxas.size()
        );
    }

    @Transactional
    public String sincronizarHistoricoComBancocentral() {
        IpcaDTO[] dadosBacen = bancoCentralClient.buscarHistoricoIpca();

        if (dadosBacen == null || dadosBacen.length == 0) {
            return "Nenhum dado retornado da API do Banco Central.";
        }

        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd/MM/yyyy");
        List<HistoricoIpcaEntity> novosRegistros = new ArrayList<>();

        for (IpcaDTO dto : dadosBacen) {
            try {
                LocalDate data = LocalDate.parse(dto.data(), formatter);
                BigDecimal valor = new BigDecimal(dto.valor());

                if (!ipcaRepository.existsByDataReferencia(data)) {
                    novosRegistros.add(new HistoricoIpcaEntity(data, valor));
                }
            } catch (Exception e) {
                // Ignora falhas de parse de linhas malformatadas
            }
        }

        if (!novosRegistros.isEmpty()) {
            ipcaRepository.saveAll(novosRegistros);
        }

        return "Sincronização concluída! " + novosRegistros.size() + " novos registros inseridos no banco.";
    }
}