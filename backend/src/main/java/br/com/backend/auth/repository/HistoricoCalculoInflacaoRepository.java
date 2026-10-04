package br.com.backend.auth.repository;

import br.com.backend.auth.entity.HistoricoCalculoInflacaoEntity;
import br.com.backend.auth.entity.UsuarioEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface HistoricoCalculoInflacaoRepository extends JpaRepository<HistoricoCalculoInflacaoEntity, Long> {

    // Opção 1: Passando o ID do usuário (navega pela relação usuario.id)
    List<HistoricoCalculoInflacaoEntity> findTop10ByUsuario_IdOrderByDataConsultaDesc(Long usuarioId);

    // Opção 2 (Opcional): Passando a própria entidade UsuarioEntity
    List<HistoricoCalculoInflacaoEntity> findTop10ByUsuarioOrderByDataConsultaDesc(UsuarioEntity usuario);
}