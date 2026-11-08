import React, { useState, useEffect, useMemo } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Pressable,
  ActivityIndicator,
  Modal,
  FlatList,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, useTheme } from '../theme';
import { PageHeader } from '../components/PageHeader';
import { useIsDesktop } from '../hooks/useLayout';
import { useKeyboardHeight } from '../hooks/useKeyboardHeight';
import {
  buscarCategoriasIpca,
  calcularInflacaoPessoal,
  buscarHistoricoCalculos,
  CategoriaIpca,
  CalculoInflacaoResponseDTO,
  HistoricoCalculoDTO,
} from '../services/api';

interface GrupoUI {
  id: string;
  nome: string;
  icone: string;
  match: (nomeLimpo: string, id: string) => boolean;
}

interface SubgrupoUI {
  id: string;
  nome: string;
  icone: string;
  match: (nome: string) => boolean;
}

const removerAcentos = (texto: string) => {
  return texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
};

// Compara palavras/frases completas. Evita falsos positivos como "cama" dentro de "camarao".
const temTermo = (texto: string, termo: string) => {
  const textoNormalizado = removerAcentos(texto).replace(/[^a-z0-9]+/g, ' ').trim();
  const termoNormalizado = removerAcentos(termo).replace(/[^a-z0-9]+/g, ' ').trim();
  if (!termoNormalizado) return false;
  const textoComLimites = ` ${textoNormalizado} `;
  return textoComLimites.includes(` ${termoNormalizado} `) ||
    textoComLimites.includes(` ${termoNormalizado}s `);
};

const formatarNomeCategoria = (nome: string) => {
  const nomeFormatado = String(nome ?? '')
    .replace(/^[0-9]+\.\s*/, '')
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/\s*-\s*/g, '-')
    .replace(/\s*([’'])\s*/g, '$1');

  // Corrige a nomenclatura apenas na apresentação; IDs e nomes enviados à API não mudam.
  return nomeFormatado.replace(/\btelevisor(?:es)?\b/gi, (termo) => {
    const plural = /^televisores$/i.test(termo);
    const inicialMaiuscula = termo[0] === termo[0].toUpperCase();
    const substituto = plural ? 'televisões' : 'televisão';
    return inicialMaiuscula
      ? substituto.charAt(0).toUpperCase() + substituto.slice(1)
      : substituto;
  });
};

const chaveNomeCategoriaSemFormatar = (nome: string) =>
  removerAcentos(String(nome ?? '')).replace(/[^a-z0-9]+/g, ' ').trim();

// Chave usada apenas para comparar nomes na interface; os IDs oficiais são preservados.
const chaveNomeCategoria = (nome: string) =>
  removerAcentos(formatarNomeCategoria(nome)).replace(/[^a-z0-9]+/g, ' ').trim();

// Remove apenas IDs repetidos na resposta da API. A deduplicação por nome é feita
// na lista exibida, para não descartar IDs oficiais diferentes que possam ser usados nos cálculos.
const normalizarCategorias = (lista: CategoriaIpca[]) => {
  const idsVistos = new Set<string>();
  return lista.filter((categoria) => {
    const id = String(categoria.id ?? '').trim();
    const nome = chaveNomeCategoria(categoria.nome ?? '');
    if (!id || !nome || idsVistos.has(id)) return false;
    idsVistos.add(id);
    return true;
  });
};

const GRUPOS_PRINCIPAIS: GrupoUI[] = [
  {
    id: '1', nome: 'Alimentação e Bebidas', icone: '🍔',
    match: (n) =>
      temTermo(n, 'alimentacao e bebidas') || temTermo(n, 'tuberculos') ||
      temTermo(n, 'raizes e legumes') || temTermo(n, 'camarao') ||
      ['arroz','feijao','carne','peixe','leite','biscoito','fruta','maca','banana','morango',
       'acucar','refrigerante','suco','macarrao','pao','cerveja','queijo','oleo','cafe',
       'legumes','verduras','hortalicas','ovos','farinha','massa','frango','porco','bovino']
        .some((termo) => temTermo(n, termo)) && !temTermo(n, 'combustivel'),
  },
  {
    id: '2', nome: 'Habitação e Limpeza', icone: '🏠',
    match: (n) =>
      temTermo(n, 'habitacao') || temTermo(n, 'aluguel residencial') ||
      temTermo(n, 'energia eletrica') || temTermo(n, 'taxa de agua') ||
      temTermo(n, 'gas encanado') || temTermo(n, 'gas de botijao') ||
      temTermo(n, 'limpeza') || temTermo(n, 'sabao') || temTermo(n, 'detergente') ||
      temTermo(n, 'condominio') || temTermo(n, 'agua e esgoto') || temTermo(n, 'reparos'),
  },
  {
    id: '3', nome: 'Artigos de Residência', icone: '🛋',
    match: (n) =>
      ['artigos de residencia','tapete','roupa de cama','cama','colchao','eletrodomestico',
       'maquina de lavar roupa','conserto de maquina de lavar roupa','geladeira','fogao',
       'moveis','movel','utensilio domestico','televisor','televisao','conserto de televisor','conserto de televisao','ar condicionado','ventilador',
       'sofa','mesa','cadeira','cortina','louca','cama mesa e banho']
        .some((termo) => temTermo(n, termo)),
  },
  {
    id: '4', nome: 'Vestuário', icone: '👕',
    match: (n) =>
      ['vestuario','roupa','calca','camisa','sapato','tenis','calcado','saia','cinto',
       'meia','tecido','confeccao','bolsa','joia','relogio de pulso','oculos de sol']
        .some((termo) => temTermo(n, termo)) &&
      !['roupa de cama'].some((termo) => temTermo(n, termo)),
  },
  {
    id: '5', nome: 'Transportes', icone: '🚗',
    match: (n) =>
      ['transportes','transporte','aluguel de veiculo','veiculo','gasolina','etanol',
       'combustivel','passagem','onibus','metro','uber','pneu','estacionamento','pedagio',
       'automovel','motocicleta','taxi','conserto de veiculo','manutencao de veiculo']
        .some((termo) => temTermo(n, termo)),
  },
  {
    id: '6', nome: 'Saúde e Cuidados', icone: '🏥',
    match: (n) =>
      ['saude','remedio','medicamento','medico','plano de saude','hospital','farmacia',
       'higiene','perfume','shampoo','dentista','armacao de oculos','lentes de oculos',
       'lentes de contato','oculos de grau','produto para higiene bucal',
       'higiene pessoal','aparelho ortodontico','consulta','exame','dentifricio','protetor solar']
        .some((termo) => temTermo(n, termo)),
  },
  {
    id: '7', nome: 'Despesas Pessoais', icone: '🪒',
    match: (n) =>
      ['despesas pessoais','barbeiro','cabeleireiro','recreacao','cinema','viagem','hotel',
       'cigarro','pet','veterinario','servico pessoal','manicure','pedicure','academia']
        .some((termo) => temTermo(n, termo)),
  },
  {
    id: '8', nome: 'Educação', icone: '🎓',
    match: (n) =>
      ['educacao','escola','faculdade','curso','mensalidade','livro','material escolar','idiomas',
       'ensino','creche','uniforme escolar']
        .some((termo) => temTermo(n, termo)),
  },
  {
    id: '9', nome: 'Comunicação', icone: '📱',
    match: (n) =>
      ['comunicacao','internet','telefone','celular','tv por assinatura','streaming','correio',
       'conserto de aparelho celular','aparelho celular','servico de telefonia','acesso a internet']
        .some((termo) => temTermo(n, termo)),
  },
];

// Subgrupos organizam visualmente as categorias reais retornadas pela API.
// Não criam categorias de cálculo nem alteram os IDs oficiais.
const SUBGRUPOS_POR_GRUPO: Record<string, SubgrupoUI[]> = {
  '1': [
    { id: 'carnes', nome: 'Carnes e aves', icone: '🥩', match: n => ['carne', 'frango', 'aves', 'miudos', 'embutidos', 'linguica', 'presunto', 'salsicha'].some(t => temTermo(n, t)) },
    { id: 'peixes', nome: 'Peixes e frutos do mar', icone: '🐟', match: n => ['peixe', 'pescado', 'camarao', 'frutos do mar', 'bacalhau', 'sardinha', 'atum', 'merluza'].some(t => temTermo(n, t)) },
    { id: 'frutas', nome: 'Frutas', icone: '🍎', match: n => ['fruta', 'maca', 'banana', 'laranja', 'mamao', 'manga', 'uva', 'pera', 'abacaxi', 'melancia', 'morango', 'limao'].some(t => temTermo(n, t)) },
    { id: 'legumes', nome: 'Legumes, raízes e tubérculos', icone: '🥕', match: n => ['legume', 'verdura', 'hortalica', 'tuberculos', 'raizes', 'batata', 'cenoura', 'cebola', 'tomate', 'alface', 'mandioca'].some(t => temTermo(n, t)) },
    { id: 'laticinios', nome: 'Leite e derivados', icone: '🥛', match: n => ['leite', 'queijo', 'iogurte', 'manteiga', 'creme de leite', 'requeijao'].some(t => temTermo(n, t)) },
    { id: 'cereais', nome: 'Cereais, massas e panificados', icone: '🍞', match: n => ['arroz', 'feijao', 'farinha', 'macarrao', 'massa', 'pao', 'biscoito', 'bolo', 'cereal', 'aveia', 'milho'].some(t => temTermo(n, t)) },
    { id: 'bebidas', nome: 'Bebidas', icone: '🥤', match: n => ['bebida', 'agua mineral', 'refrigerante', 'suco', 'cafe', 'cha', 'cerveja', 'vinho'].some(t => temTermo(n, t)) },
  ],
  '2': [
    { id: 'moradia', nome: 'Moradia e serviços', icone: '🏠', match: n => ['aluguel', 'condominio', 'energia eletrica', 'agua e esgoto', 'taxa de agua', 'gas encanado', 'gas de botijao', 'iptu', 'servico domestico'].some(t => temTermo(n, t)) },
    { id: 'limpeza', nome: 'Limpeza e produtos domésticos', icone: '🧹', match: n => ['limpeza', 'sabao', 'detergente', 'desinfetante', 'amaciante', 'esponja', 'vassoura', 'inseticida'].some(t => temTermo(n, t)) },
    { id: 'reparos', nome: 'Reparos e manutenção', icone: '🛠️', match: n => ['reparo', 'conserto', 'manutencao', 'material de construcao', 'pintura', 'eletricista', 'encanador'].some(t => temTermo(n, t)) },
  ],
  '3': [
    { id: 'eletrodomesticos', nome: 'Eletrodomésticos', icone: '🧺', match: n => ['eletrodomestico', 'maquina de lavar', 'geladeira', 'fogao', 'microondas', 'liquidificador', 'ventilador', 'ar condicionado', 'televisor', 'televisao', 'conserto de televisor', 'conserto de televisao'].some(t => temTermo(n, t)) },
    { id: 'moveis', nome: 'Móveis e decoração', icone: '🛋️', match: n => ['movel', 'sofa', 'mesa', 'cadeira', 'cama', 'colchao', 'tapete', 'cortina', 'persiana', 'roupa de cama'].some(t => temTermo(n, t)) },
    { id: 'utensilios', nome: 'Utensílios e artigos domésticos', icone: '🍽️', match: n => ['utensilio', 'louca', 'talher', 'panela', 'copo', 'prato', 'cama mesa e banho', 'conserto'].some(t => temTermo(n, t)) },
  ],
  '4': [
    { id: 'roupas', nome: 'Roupas e tecidos', icone: '👕', match: n => ['roupa', 'vestuario', 'calca', 'camisa', 'saia', 'vestido', 'meia', 'tecido', 'confeccao', 'uniforme'].some(t => temTermo(n, t)) },
    { id: 'calcados', nome: 'Calçados', icone: '👟', match: n => ['sapato', 'tenis', 'calcado', 'sandalia', 'chinelo', 'bota'].some(t => temTermo(n, t)) },
    { id: 'acessorios', nome: 'Acessórios', icone: '👜', match: n => ['bolsa', 'joia', 'relogio de pulso', 'oculos de sol', 'cinto', 'chapeu'].some(t => temTermo(n, t)) },
  ],
  '5': [
    { id: 'veiculos', nome: 'Veículos e manutenção', icone: '🚗', match: n => ['veiculo', 'automovel', 'motocicleta', 'pneu', 'conserto de veiculo', 'manutencao de veiculo', 'aluguel de veiculo', 'estacionamento', 'pedagio'].some(t => temTermo(n, t)) },
    { id: 'combustiveis', nome: 'Combustíveis', icone: '⛽', match: n => ['gasolina', 'etanol', 'combustivel', 'oleo diesel', 'diesel', 'gnv'].some(t => temTermo(n, t)) },
    { id: 'lubrificantes', nome: 'Manutenção e lubrificantes', icone: '🛠️', match: n => ['oleo lubrificante', 'lubrificante', 'troca de oleo', 'graxa'].some(t => temTermo(n, t)) },
    { id: 'transporte-publico', nome: 'Transporte público e passagens', icone: '🚌', match: n => ['passagem', 'onibus', 'metro', 'trem', 'taxi', 'uber', 'transporte'].some(t => temTermo(n, t)) },
  ],
  '6': [
    { id: 'medicamentos', nome: 'Medicamentos e farmácia', icone: '💊', match: n => ['remedio', 'medicamento', 'farmacia', 'antibiotico', 'analgesico'].some(t => temTermo(n, t)) },
    { id: 'servicos-medicos', nome: 'Serviços médicos', icone: '🩺', match: n => ['medico', 'consulta medica', 'clinica medica', 'exame'].some(t => temTermo(n, t)) },
    { id: 'servicos-dentarios', nome: 'Serviços dentários', icone: '🦷', match: n => ['dentista', 'dentario', 'odontologico', 'ortodontico', 'consulta odontologica'].some(t => temTermo(n, t)) },
    { id: 'planos-e-hospitais', nome: 'Planos de saúde e hospitais', icone: '🏥', match: n => ['plano de saude', 'hospital', 'terapia'].some(t => temTermo(n, t)) },
    { id: 'oculos', nome: 'Óculos e lentes', icone: '👓', match: n => ['armacao de oculos', 'oculos de grau', 'lentes de oculos', 'lentes de contato'].some(t => temTermo(n, t)) },
    { id: 'higiene', nome: 'Higiene e cuidados pessoais', icone: '🧴', match: n => ['higiene', 'perfume', 'shampoo', 'dentifricio', 'protetor solar', 'sabonete', 'desodorante'].some(t => temTermo(n, t)) },
  ],
  '7': [
    { id: 'cuidados-pessoais', nome: 'Serviços e cuidados pessoais', icone: '💈', match: n => ['barbeiro', 'cabeleireiro', 'manicure', 'pedicure', 'servico pessoal', 'academia'].some(t => temTermo(n, t)) },
    { id: 'lazer', nome: 'Lazer, cultura e viagens', icone: '🎟️', match: n => ['recreacao', 'cinema', 'teatro', 'viagem', 'hotel', 'hospedagem', 'brinquedo', 'animal', 'veterinario', 'pet'].some(t => temTermo(n, t)) },
  ],
  '8': [
    { id: 'ensino', nome: 'Ensino e mensalidades', icone: '🎓', match: n => ['escola', 'faculdade', 'curso', 'mensalidade', 'ensino', 'creche', 'idiomas'].some(t => temTermo(n, t)) },
    { id: 'materiais', nome: 'Livros e material escolar', icone: '📚', match: n => ['livro', 'material escolar', 'caderno', 'papelaria', 'artigo escolar', 'uniforme escolar'].some(t => temTermo(n, t)) },
  ],
  '9': [
    { id: 'telefonia', nome: 'Telefonia e celular', icone: '📱', match: n => ['telefone', 'celular', 'telefonia', 'aparelho celular', 'conserto de aparelho celular'].some(t => temTermo(n, t)) },
    { id: 'internet-tv', nome: 'Internet e TV por assinatura', icone: '📡', match: n => ['internet', 'acesso a internet', 'tv por assinatura', 'streaming', 'servico de dados'].some(t => temTermo(n, t)) },
    { id: 'correios', nome: 'Correios e comunicação', icone: '✉️', match: n => ['correio', 'telegrama', 'comunicacao'].some(t => temTermo(n, t)) },
  ],
};

const subgruposDoGrupo = (grupoId: string): SubgrupoUI[] => [
  ...(SUBGRUPOS_POR_GRUPO[grupoId] ?? []),
  { id: `outros-${grupoId}`, nome: 'Outros itens', icone: '📂', match: () => true },
];

const nomeGenericoDeGrupo = (nome: string) => {
  const chave = chaveNomeCategoria(nome);
  return GRUPOS_PRINCIPAIS.some((grupo) => chave === chaveNomeCategoria(grupo.nome)) ||
    chave === 'comunicacao' || chave === 'alimentacao e bebidas';
};

const grupoDaCategoria = (categoria: CategoriaIpca): GrupoUI | undefined => {
  const nome = chaveNomeCategoria(categoria.nome ?? '');
  // Regras específicas primeiro: corrigem casos conhecidos antes das palavras genéricas.
  const regrasEspecificas: Array<{ termos: string[]; grupoId: string }> = [
    { termos: ['camarao', 'tuberculos', 'raizes e legumes'], grupoId: '1' },
    // Combustíveis e lubrificantes de veículos pertencem a Transportes,
    // evitando que termos genéricos como "óleo" os classifiquem em Alimentação.
    { termos: ['oleo diesel', 'diesel', 'oleo lubrificante', 'lubrificante'], grupoId: '5' },
    { termos: ['tapete', 'roupa de cama', 'maquina de lavar roupa', 'conserto de maquina de lavar roupa'], grupoId: '3' },
    { termos: ['aluguel de veiculo'], grupoId: '5' },
    { termos: ['oculos de sol'], grupoId: '4' },
    { termos: ['armacao de oculos', 'oculos de grau', 'lentes de oculos', 'lentes de contato', 'perfume', 'produto para higiene bucal', 'higiene pessoal'], grupoId: '6' },
    { termos: ['conserto de aparelho celular'], grupoId: '9' },
  ];
  for (const regra of regrasEspecificas) {
    if (regra.termos.some((termo) => temTermo(nome, termo))) {
      return GRUPOS_PRINCIPAIS.find((grupo) => grupo.id === regra.grupoId);
    }
  }
  return GRUPOS_PRINCIPAIS.find((grupo) => grupo.match(nome, categoria.id));
};

export default function InflacaoPessoalScreen() {
  const { colors } = useTheme();
  const desktop = useIsDesktop();
  const tecladoAltura = useKeyboardHeight();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [categorias, setCategorias] = useState<CategoriaIpca[]>([]);
  const [cestaGasto, setCestaGasto] = useState<{ categoriaId: string; nome: string; valor: string }[]>([]);

  const [grupoAtivoModal, setGrupoAtivoModal] = useState<GrupoUI | null>(null);
  const [subgrupoAtivo, setSubgrupoAtivo] = useState<SubgrupoUI | null>(null);
  const [buscaCategoria, setBuscaCategoria] = useState('');
  const [categoriaSelecionada, setCategoriaSelecionada] = useState<CategoriaIpca | null>(null);
  const [valorInput, setValorInput] = useState('');

  const [mesInicio, setMesInicio] = useState('01');
  const [anoInicio, setAnoInicio] = useState('2025');
  const [mesFim, setMesFim] = useState('07');
  const [anoFim, setAnoFim] = useState('2026');

  const [loading, setLoading] = useState(true);
  const [calculando, setCalculando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [resultado, setResultado] = useState<CalculoInflacaoResponseDTO | null>(null);

  // Estados do Histórico
  const [historico, setHistorico] = useState<HistoricoCalculoDTO[]>([]);
  const [carregandoHistorico, setCarregandoHistorico] = useState(false);

  useEffect(() => {
    carregarCategoriasEHistorico();
  }, []);

  const carregarCategoriasEHistorico = async () => {
    setLoading(true);
    setErro(null);
    try {
      const [listaCats, historicoRes] = await Promise.allSettled([
        buscarCategoriasIpca(),
        buscarHistoricoCalculos(),
      ]);

      if (listaCats.status === 'fulfilled' && listaCats.value?.length > 0) {
        setCategorias(normalizarCategorias(listaCats.value.filter((c) =>
          c.id !== '7169' &&
          !['servicos medicos e dentarios', 'so joia', 'so joias', 'joia', 'joias'].includes(chaveNomeCategoria(c.nome ?? ''))
        )));
      }

      if (historicoRes.status === 'fulfilled' && Array.isArray(historicoRes.value)) {
        setHistorico(historicoRes.value);
      }
    } catch (e: any) {
      console.warn('Erro ao buscar dados do backend:', e);
    } finally {
      setLoading(false);
    }
  };

  const carregarHistorico = async () => {
    setCarregandoHistorico(true);
    try {
      const dados = await buscarHistoricoCalculos();
      if (Array.isArray(dados)) {
        setHistorico(dados);
      }
    } catch (e) {
      console.warn('Erro ao carregar histórico:', e);
    } finally {
      setCarregandoHistorico(false);
    }
  };

  const totalCesta = useMemo(() => {
    return cestaGasto.reduce((acc, item) => {
      const val = parseFloat(item.valor.replace(',', '.')) || 0;
      return acc + val;
    }, 0);
  }, [cestaGasto]);

  const categoriasDoGrupo = useMemo(() => {
    if (!grupoAtivoModal) return [];
    const nomesExibidos = new Set<string>();
    return categorias.filter((cat) => {
      const chaveNome = chaveNomeCategoria(cat.nome);
      if (nomeGenericoDeGrupo(cat.nome)) return false;
      // Oculta categorias genéricas redundantes no filtro de vestuário.
      // As categorias específicas (roupa masculina/feminina/infantil e tecidos e armarinho) permanecem.
      if (/^(?:roupa|roupas|tecido|tecidos|roupa e tecido|roupa e tecidos|roupas e tecido|roupas e tecidos|joia|joias|so joia|so joias)$/.test(chaveNome)) return false;
      const pertenceAoGrupo = grupoDaCategoria(cat)?.id === grupoAtivoModal.id;
      if (!pertenceAoGrupo || nomesExibidos.has(chaveNome)) return false;
      nomesExibidos.add(chaveNome);
      return true;
    });
  }, [grupoAtivoModal, categorias]);

  const subgruposDoGrupoAtivo = useMemo(
    () => grupoAtivoModal ? subgruposDoGrupo(grupoAtivoModal.id) : [],
    [grupoAtivoModal]
  );

  const categoriasDoGrupoFiltradas = useMemo(() => {
    const termoBusca = removerAcentos(buscaCategoria.trim()).replace(/\s+/g, ' ');
    if (termoBusca) {
      return categoriasDoGrupo.filter((cat) =>
        removerAcentos(formatarNomeCategoria(cat.nome)).replace(/\s+/g, ' ').includes(termoBusca)
      );
    }
    if (subgrupoAtivo) {
      const gruposSemOutros = subgruposDoGrupoAtivo.slice(0, -1);
      if (subgrupoAtivo.id.startsWith('outros-')) {
        return categoriasDoGrupo.filter(cat =>
          !gruposSemOutros.some(sg => sg.match(formatarNomeCategoria(cat.nome)))
        );
      }
      const indexAtivo = gruposSemOutros.findIndex(sg => sg.id === subgrupoAtivo.id);
      const anteriores = gruposSemOutros.slice(0, Math.max(indexAtivo, 0));
      return categoriasDoGrupo.filter(cat => {
        const nome = formatarNomeCategoria(cat.nome);
        return subgrupoAtivo.match(nome) && !anteriores.some(sg => sg.match(nome));
      });
    }
    return categoriasDoGrupo;
  }, [buscaCategoria, subgrupoAtivo, subgruposDoGrupoAtivo, categoriasDoGrupo]);

  const subgruposDisponiveis = useMemo(() => {
    if (!grupoAtivoModal || buscaCategoria.trim()) return [];
    const subgrupos = subgruposDoGrupoAtivo;
    const especificos = subgrupos.slice(0, -1);
    const disponiveis = especificos.filter((subgrupo, index) => {
      const anteriores = especificos.slice(0, index);
      return categoriasDoGrupo.some(cat => {
        const nome = formatarNomeCategoria(cat.nome);
        return subgrupo.match(nome) && !anteriores.some(sg => sg.match(nome));
      });
    });
    const temOutros = categoriasDoGrupo.some(cat =>
      !especificos.some(sg => sg.match(formatarNomeCategoria(cat.nome)))
    );
    if (temOutros) disponiveis.push(subgrupos[subgrupos.length - 1]);
    // Se nenhuma regra específica casar com os nomes da API, todos continuam acessíveis.
    return disponiveis.length ? disponiveis : [subgrupos[subgrupos.length - 1]];
  }, [grupoAtivoModal, buscaCategoria, categoriasDoGrupo, subgruposDoGrupoAtivo]);

  const handleAdicionarItemCesta = () => {
    setErro(null);
    if (!categoriaSelecionada) return;

    const valorNumerico = parseFloat(valorInput.replace(',', '.'));
    if (!valorInput || isNaN(valorNumerico) || valorNumerico <= 0) {
      setErro('Informe um valor de gasto válido.');
      return;
    }

    if (cestaGasto.some((item) => item.categoriaId === categoriaSelecionada.id)) {
      setErro('Item já adicionado na sua cesta.');
      return;
    }

    setCestaGasto([
      ...cestaGasto,
      {
        categoriaId: categoriaSelecionada.id,
        nome: formatarNomeCategoria(categoriaSelecionada.nome),
        valor: valorInput,
      },
    ]);

    setCategoriaSelecionada(null);
    setValorInput('');
  };

  const handleRemoverItemCesta = (id: string) => {
    setCestaGasto(cestaGasto.filter((item) => item.categoriaId !== id));
  };

  const handleCalcular = async () => {
    setErro(null);
    setResultado(null);

    if (cestaGasto.length === 0) {
      setErro('Adicione pelo menos um item à sua cesta de consumo.');
      return;
    }

    setCalculando(true);

    try {
      const dataInicioFormatted = `${anoInicio}-${mesInicio.padStart(2, '0')}-01`;
      const dataFimFormatted = `${anoFim}-${mesFim.padStart(2, '0')}-01`;

      const itensGasto = cestaGasto.map((item) => ({
        categoriaId: item.categoriaId,
        valorGasto: parseFloat(item.valor.replace(',', '.')) || 0,
      }));

      const res = await calcularInflacaoPessoal({
        dataInicio: dataInicioFormatted,
        dataFim: dataFimFormatted,
        itensGasto,
      });

      setResultado(res);
      carregarHistorico();
    } catch (e: any) {
      setErro(e.message || 'Erro ao calcular inflação pessoal.');
    } finally {
      setCalculando(false);
    }
  };

  const handleRestaurarConsulta = (itemHistorico: HistoricoCalculoDTO) => {
    if (itemHistorico.dataInicio) {
      const partes = itemHistorico.dataInicio.split('-');
      if (partes.length >= 2) {
        setAnoInicio(partes[0]);
        setMesInicio(partes[1]);
      }
    }

    if (itemHistorico.dataFim) {
      const partes = itemHistorico.dataFim.split('-');
      if (partes.length >= 2) {
        setAnoFim(partes[0]);
        setMesFim(partes[1]);
      }
    }

    if (itemHistorico.itens && itemHistorico.itens.length > 0) {
      const novaCesta = itemHistorico.itens.map((i) => {
        const catEncontrada = categorias.find((c) => c.id === i.categoriaId);
        const nomeFinal = i.nomeCategoria
          ? formatarNomeCategoria(i.nomeCategoria)
          : catEncontrada
          ? formatarNomeCategoria(catEncontrada.nome)
          : `Categoria ${i.categoriaId}`;

        return {
          categoriaId: i.categoriaId,
          nome: nomeFinal,
          valor: i.valorGasto.toString().replace('.', ','),
        };
      });
      setCestaGasto(novaCesta);
    }

    setResultado(null);
    setErro(null);
  };

  const fmt = (v: number) => v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const montagem = (
    <View style={[styles.card, desktop && styles.cardMontagem]}>
      <View style={styles.periodoContainer}>
        <Text style={styles.labelPeriodo}>Período de Análise</Text>
        <View style={styles.datasRow}>
          <View style={styles.dataInputGroup}>
            <TextInput
              style={styles.inputData}
              value={mesInicio}
              onChangeText={setMesInicio}
              keyboardType="numeric"
              maxLength={2}
            />
            <Text style={styles.barraData}>/</Text>
            <TextInput
              style={styles.inputDataAno}
              value={anoInicio}
              onChangeText={setAnoInicio}
              keyboardType="numeric"
              maxLength={4}
            />
          </View>
          <Text style={styles.ateTexto}>até</Text>
          <View style={styles.dataInputGroup}>
            <TextInput
              style={styles.inputData}
              value={mesFim}
              onChangeText={setMesFim}
              keyboardType="numeric"
              maxLength={2}
            />
            <Text style={styles.barraData}>/</Text>
            <TextInput
              style={styles.inputDataAno}
              value={anoFim}
              onChangeText={setAnoFim}
              keyboardType="numeric"
              maxLength={4}
            />
          </View>
        </View>
      </View>

      <View style={styles.divisor} />

      <Text style={styles.cardTitulo}>1. Escolha um Grupo de Gastos</Text>
      <View style={styles.gridGrupos}>
        {GRUPOS_PRINCIPAIS.map((grupo) => (
          <TouchableOpacity
            key={grupo.id}
            style={styles.botaoGrupoGrid}
            activeOpacity={0.8}
            onPress={() => {
              setGrupoAtivoModal(grupo);
              setSubgrupoAtivo(null);
              setBuscaCategoria('');
            }}
          >
            <Text style={styles.iconeGrupoGrid}>{grupo.icone}</Text>
            <Text style={styles.nomeGrupoGrid} numberOfLines={2}>
              {grupo.nome}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {categoriaSelecionada && (
        <View style={styles.boxInsercaoValor}>
          <Text style={styles.itemSelecionadoLabel}>Item Escolhido:</Text>
          <Text style={styles.itemSelecionadoNome}>
            {formatarNomeCategoria(categoriaSelecionada.nome)}
          </Text>

          <View style={styles.rowAdicionarValor}>
            <View style={styles.inputGastoWrapper}>
              <Text style={styles.prefixoMoeda}>R$</Text>
              <TextInput
                style={styles.inputGasto}
                keyboardType="numeric"
                placeholder="0,00"
                placeholderTextColor={colors.textMuted}
                value={valorInput}
                onChangeText={setValorInput}
                autoFocus
              />
            </View>
            <TouchableOpacity style={styles.btnAdicionar} onPress={handleAdicionarItemCesta}>
              <Text style={styles.btnAdicionarTexto}>+ Confirmar Item</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );

  const cesta = (
    <View style={styles.card}>
      <View style={styles.headerCestaRow}>
        <Text style={[styles.cardTitulo, styles.semMargemInferior]}>2. Sua Cesta de Consumo</Text>
        <View style={styles.badgeTotalCesta}>
          <Text style={styles.badgeTotalLabel}>Total na Cesta:</Text>
          <Text style={styles.badgeTotalValor}>R$ {fmt(totalCesta)}</Text>
        </View>
      </View>

      {cestaGasto.length === 0 ? (
        <Text style={styles.cestaVaziaTexto}>
          Nenhum item adicionado ainda. Escolha um grupo acima.
        </Text>
      ) : (
        <View style={styles.listaCesta}>
          {cestaGasto.map((item) => (
            <View key={item.categoriaId} style={styles.cestaItem}>
              <Text style={styles.cestaItemNome}>📦 {item.nome}</Text>
              <Text style={styles.cestaItemValor}>
                R$ {fmt(parseFloat(item.valor.replace(',', '.')))}
              </Text>
              <TouchableOpacity
                style={styles.btnRemover}
                onPress={() => handleRemoverItemCesta(item.categoriaId)}
              >
                <Text style={styles.btnRemoverTexto}>✕</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      {erro && <Text style={styles.textoErro}>{erro}</Text>}

      <TouchableOpacity
        style={[styles.botaoAcao, cestaGasto.length === 0 && { opacity: 0.5 }]}
        onPress={handleCalcular}
        disabled={calculando || cestaGasto.length === 0}
      >
        {calculando ? (
          <ActivityIndicator color={colors.onPrimary} />
        ) : (
          <Text style={styles.botaoTextoAcao}>Calcular Inflação Pessoal</Text>
        )}
      </TouchableOpacity>
    </View>
  );

  // Bloco 3: resultado
  const blocoResultado = resultado ? (
    <View style={styles.cardResultado}>
      <Text style={styles.cardTituloResultado}>Resultado da Sua Inflação</Text>

      {resultado.mensagemAviso && (
        <View style={styles.warningCard}>
          <Text style={styles.warningIcon}>⚠️</Text>
          <View style={styles.warningContent}>
            <Text style={styles.warningTextPrefix}>
              {resultado.mensagemAviso}
            </Text>
          </View>
        </View>
      )}

      <View style={styles.metricasGrid}>
        <View style={styles.metricaBox}>
          <Text style={styles.metricaLabel}>Sua Inflação</Text>
          <Text style={[styles.metricaValor, { color: colors.accent }]}>
            {resultado.inflacaoPessoalPercentual.toFixed(2)}%
          </Text>
        </View>
        <View style={styles.metricaBox}>
          <Text style={styles.metricaLabel}>IPCA Oficial</Text>
          <Text style={[styles.metricaValor, { color: colors.textSecondary }]}>
            {resultado.inflacaoOficialIpcaPercentual.toFixed(2)}%
          </Text>
        </View>
        <View style={styles.metricaBox}>
          <Text style={styles.metricaLabel}>Diferença</Text>
          <Text
            style={[
              styles.metricaValor,
              { color: resultado.diferencaParaIpcaOficialPercentual > 0 ? colors.danger : colors.success },
            ]}
          >
            {resultado.diferencaParaIpcaOficialPercentual > 0 ? '+' : ''}
            {resultado.diferencaParaIpcaOficialPercentual.toFixed(2)}%
          </Text>
        </View>
      </View>

      <View style={styles.divisorResumo} />

      <View style={styles.linhaResumo}>
        <Text style={styles.textoResumoLabel}>Custo Inicial Total:</Text>
        <Text style={styles.textoResumoValor}>
          R$ {resultado.custoTotalInicial.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
        </Text>
      </View>
      <View style={styles.linhaResumo}>
        <Text style={styles.textoResumoLabel}>Custo Recomposto:</Text>
        <Text style={styles.textoResumoValorDestaque}>
          R$ {resultado.custoTotalRecomposto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
        </Text>
      </View>
      <View style={styles.linhaResumo}>
        <Text style={styles.textoResumoLabel}>Aumento Real de Custo:</Text>
        <Text style={[styles.textoResumoValorDestaque, { color: colors.danger }]}>
          + R$ {resultado.perdaPoderCompraReais.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
        </Text>
      </View>

      {resultado.detalhamento && resultado.detalhamento.length > 0 && (
        <View style={{ marginTop: 20 }}>
          <Text style={styles.subtituloDetalhamento}>Detalhamento da Cesta:</Text>
          {resultado.detalhamento.map((item) => (
            <Pressable
              key={item.categoriaId}
              style={(state) => [
                styles.linhaDetalhamento,
                (state as { hovered?: boolean }).hovered && styles.linhaDetalhamentoHover,
              ]}
            >
              <Text style={styles.nomeDetalhamento} numberOfLines={1}>
                📦 {formatarNomeCategoria(item.nomeCategoria)}
              </Text>
              <Text style={styles.valorDetalhamento}>
                {item.inflacaoAcumuladaCategoriaPercentual.toFixed(2)}%
              </Text>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  ) : null;

  const blocoHistorico = (
    <View style={styles.card}>
      <View style={styles.headerCestaRow}>
        <Text style={[styles.cardTitulo, styles.semMargemInferior]}>📜 Consultas Anteriores</Text>
        {carregandoHistorico && <ActivityIndicator size="small" color={colors.primary} />}
      </View>

      {historico.length === 0 ? (
        <Text style={styles.cestaVaziaTexto}>Nenhuma consulta salva anteriormente.</Text>
      ) : (
        <View style={styles.listaCesta}>
          {historico.map((item) => (
            <TouchableOpacity
              key={item.id.toString()}
              style={styles.historicoCardItem}
              activeOpacity={0.7}
              onPress={() => handleRestaurarConsulta(item)}
            >
              <View style={styles.historicoInfoLeft}>
                <Text style={styles.historicoPeriodoText}>
                  📅 {item.dataInicio} até {item.dataFim}
                </Text>
                <Text style={styles.historicoDetalhesText}>
                  {item.itens?.length || 0} itens na cesta
                </Text>
              </View>

              <View style={styles.historicoBadgeResultado}>
                <Text style={styles.historicoBadgeText}>
                  {item.inflacaoPessoalPercentual?.toFixed(2) ?? '0.00'}%
                </Text>
              </View>
              <Text style={styles.historicoSetaText}>➡️</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView behavior={Platform.OS === 'web' ? undefined : 'padding'} style={{ flex: 1 }}>
      <ScrollView
        contentContainerStyle={[styles.container, desktop && styles.containerDesktop, tecladoAltura > 0 && { paddingBottom: 24 + tecladoAltura }]}
        keyboardShouldPersistTaps="handled"
      >
        <PageHeader
          titulo="Minha Inflação Pessoal"
          subtitulo="Monte sua cesta de consumo navegando pelos grupos abaixo e acompanhe o total acumulado."
        />

        {loading ? (
          <ActivityIndicator size="large" color={colors.primary} style={{ marginVertical: 40 }} />
        ) : desktop ? (
          <View style={styles.colunas}>
            {montagem}
            <View style={styles.colunaDireita}>
              {cesta}
              {blocoResultado}
              {blocoHistorico}
            </View>
          </View>
        ) : (
          <View style={styles.pilha}>
            {montagem}
            {cesta}
            {blocoResultado}
            {blocoHistorico}
          </View>
        )}
      </ScrollView>
      </KeyboardAvoidingView>

      <Modal visible={!!grupoAtivoModal} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>
              {grupoAtivoModal?.icone} {grupoAtivoModal?.nome}
            </Text>

            {subgrupoAtivo && !buscaCategoria.trim() && grupoAtivoModal && (
              <TouchableOpacity style={styles.subgrupoVoltar} onPress={() => setSubgrupoAtivo(null)}>
                <Text style={styles.subgrupoVoltarTexto}>‹ Todas as categorias de {grupoAtivoModal.nome}</Text>
              </TouchableOpacity>
            )}

            <TextInput
              style={styles.inputBuscaModal}
              placeholder={`Buscar em ${grupoAtivoModal?.nome}...`}
              placeholderTextColor={colors.textMuted}
              value={buscaCategoria}
              onChangeText={(valor) => {
                setBuscaCategoria(valor);
                if (valor.trim()) setSubgrupoAtivo(null);
              }}
            />

            {!buscaCategoria.trim() && !subgrupoAtivo && subgruposDisponiveis.length > 0 ? (
              <FlatList
                data={subgruposDisponiveis}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <TouchableOpacity style={styles.modalItem} onPress={() => setSubgrupoAtivo(item)}>
                    <Text style={styles.modalItemText}>{item.icone}  {item.nome}</Text>
                    <Text style={styles.subgrupoSeta}>›</Text>
                  </TouchableOpacity>
                )}
              />
            ) : (
              <FlatList
                data={categoriasDoGrupoFiltradas}
                keyExtractor={(item) => item.id}
                ListEmptyComponent={<Text style={styles.modalItemText}>Nenhuma categoria encontrada.</Text>}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.modalItem}
                    onPress={() => {
                      setCategoriaSelecionada(item);
                      setGrupoAtivoModal(null);
                      setSubgrupoAtivo(null);
                      setBuscaCategoria('');
                    }}
                  >
                    <Text style={styles.modalItemText}>{formatarNomeCategoria(item.nome)}</Text>
                  </TouchableOpacity>
                )}
              />
            )}

            <TouchableOpacity
              style={styles.modalCloseBtn}
              onPress={() => {
                setGrupoAtivoModal(null);
                setSubgrupoAtivo(null);
                setBuscaCategoria('');
              }}
            >
              <Text style={styles.modalCloseText}>Fechar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const createStyles = (c: Colors) =>
  StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: c.bg, paddingTop: 10 },
    container: { padding: 20, width: '100%', maxWidth: 720, alignSelf: 'center' },
    containerDesktop: { maxWidth: 1200, paddingHorizontal: 48, paddingVertical: 40 },
    colunas: { flexDirection: 'row', alignItems: 'flex-start', gap: 24 },
    colunaDireita: { flex: 1, gap: 20 },
    pilha: { gap: 20 },

    card: {
      backgroundColor: c.surface,
      borderRadius: 24,
      padding: 20,
      borderWidth: 1,
      borderColor: c.border,
    },
    cardMontagem: { width: 600, padding: 28 },
    cardTitulo: { fontSize: 17, fontWeight: '800', color: c.text, marginBottom: 14 },
    semMargemInferior: { marginBottom: 0 },

    periodoContainer: { marginBottom: 4 },
    labelPeriodo: { color: c.textSecondary, fontSize: 13, fontWeight: '600', marginBottom: 8 },
    datasRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    dataInputGroup: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: c.surfaceAlt,
      paddingHorizontal: 14,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: c.border,
    },
    inputData: { color: c.text, paddingVertical: 12, width: 32, textAlign: 'center', fontWeight: '700' },
    inputDataAno: { color: c.text, paddingVertical: 12, width: 52, textAlign: 'center', fontWeight: '700' },
    barraData: { color: c.textMuted },
    ateTexto: { color: c.textMuted, fontSize: 13 },
    divisor: { height: 1, backgroundColor: c.border, marginVertical: 20 },

    gridGrupos: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    botaoGrupoGrid: {
      flexGrow: 1,
      flexBasis: '30%',
      backgroundColor: c.surfaceAlt,
      borderRadius: 16,
      paddingVertical: 14,
      paddingHorizontal: 8,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: c.border,
    },
    iconeGrupoGrid: { fontSize: 26, marginBottom: 8 },
    nomeGrupoGrid: { color: c.text, fontSize: 12, textAlign: 'center', fontWeight: '600' },

    boxInsercaoValor: {
      marginTop: 20,
      backgroundColor: c.surfaceAlt,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: c.border, // Removemos qualquer destaque indesejado daqui
      padding: 18,
    },
    itemSelecionadoLabel: {
      color: c.textSecondary,
      fontSize: 13,
      fontWeight: '600',
    },
    itemSelecionadoNome: {
      color: c.accent,
      fontSize: 18,
      fontWeight: '800',
      marginTop: 2,
      marginBottom: 14,
    },
    rowAdicionarValor: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    inputGastoWrapper: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: c.surface,
      borderRadius: 14,
      borderWidth: 1.5,
      borderColor: c.primary, // A borda amarela agora envolve perfeitamente apenas o input de valor!
      paddingHorizontal: 14,
      height: 52,
    },
    prefixoMoeda: {
      color: c.textSecondary,
      fontSize: 15,
      fontWeight: '600',
      marginRight: 6,
    },
    inputGasto: {
      flex: 1,
      color: c.text,
      fontSize: 16,
      fontWeight: '700',
      padding: 0,
      outlineStyle: 'none', // Remove o outline nativo feio do navegador na web
    } as any,
    btnAdicionar: {
      backgroundColor: c.primary,
      paddingHorizontal: 18,
      paddingVertical: 13,
      justifyContent: 'center',
      borderRadius: 14,
    },
    btnAdicionarTexto: { color: c.onPrimary, fontSize: 14, fontWeight: '800' },

    headerCestaRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
    },
    badgeTotalCesta: {
      backgroundColor: c.primarySoft,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 999,
      flexDirection: 'row',
      gap: 6,
    },
    badgeTotalLabel: { color: c.textSecondary, fontSize: 12 },
    badgeTotalValor: { color: c.accent, fontSize: 13, fontWeight: '800' },
    cestaVaziaTexto: { color: c.textMuted, fontSize: 13, fontStyle: 'italic', marginBottom: 16 },
    listaCesta: { gap: 10, marginBottom: 16 },
    cestaItem: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: c.surfaceAlt,
      paddingVertical: 12,
      paddingHorizontal: 14,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: c.border,
    },
    cestaItemNome: { flex: 1, color: c.text, fontSize: 14, fontWeight: '600' },
    cestaItemValor: { color: c.text, fontSize: 14, fontWeight: '800', marginHorizontal: 12 },
    btnRemover: {
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: c.dangerSoft,
      alignItems: 'center',
      justifyContent: 'center',
    },
    btnRemoverTexto: { color: c.danger, fontWeight: 'bold' },
    textoErro: { color: c.danger, fontSize: 13, marginBottom: 12, textAlign: 'center' },
    botaoAcao: {
      backgroundColor: c.primary,
      borderRadius: 16,
      paddingVertical: 17,
      alignItems: 'center',
    },
    botaoTextoAcao: { color: c.onPrimary, fontWeight: '800', fontSize: 16 },

    cardResultado: {
      backgroundColor: c.surface,
      borderRadius: 24,
      padding: 24,
      borderWidth: 1,
      borderColor: c.border,
    },
    cardTituloResultado: { fontSize: 18, fontWeight: '800', color: c.text, marginBottom: 16 },
    warningCard: {
      flexDirection: 'row',
      backgroundColor: 'rgba(255, 193, 7, 0.1)',
      borderRadius: 12,
      padding: 12,
      marginBottom: 16,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: 'rgba(255, 193, 7, 0.3)',
    },
    warningIcon: { fontSize: 18, marginRight: 8 },
    warningContent: { flex: 1 },
    warningTextPrefix: { color: '#FFC107', fontSize: 12, fontWeight: '600' },
    warningBadgesRow: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 6, gap: 6 },
    warningBadgeItem: {
      backgroundColor: 'rgba(255, 193, 7, 0.2)',
      borderRadius: 6,
      paddingHorizontal: 8,
      paddingVertical: 2,
    },
    warningBadgeText: { color: '#FFC107', fontSize: 11, fontWeight: '700' },

    metricasGrid: { flexDirection: 'row', gap: 10, marginBottom: 12 },
    metricaBox: {
      flex: 1,
      backgroundColor: c.surfaceAlt,
      paddingVertical: 14,
      borderRadius: 16,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: c.border,
    },
    metricaLabel: { color: c.textSecondary, fontSize: 12, marginBottom: 4 },
    metricaValor: { fontSize: 20, fontWeight: '800' },

    divisorResumo: { height: 1, backgroundColor: c.border, marginVertical: 16 },
    linhaResumo: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 10,
    },
    textoResumoLabel: { color: c.textSecondary, fontSize: 14 },
    textoResumoValor: { color: c.text, fontSize: 15, fontWeight: '800' },
    textoResumoValorDestaque: { color: c.accent, fontSize: 15, fontWeight: '800' },

    subtituloDetalhamento: {
      fontSize: 15,
      fontWeight: '800',
      color: c.text,
      marginBottom: 12,
    },
    linhaDetalhamento: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 10,
      paddingHorizontal: 6,
      borderRadius: 8,
    },
    linhaDetalhamentoHover: {
      backgroundColor: c.surfaceAlt,
    },
    nomeDetalhamento: {
      color: c.textSecondary,
      fontSize: 14,
      flex: 1,
      marginRight: 12,
    },
    valorDetalhamento: {
      color: c.accent,
      fontSize: 14,
      fontWeight: '800',
    },

    historicoCardItem: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: c.surfaceAlt,
      paddingVertical: 12,
      paddingHorizontal: 14,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: c.border,
      gap: 10,
    },
    historicoInfoLeft: { flex: 1 },
    historicoPeriodoText: { color: c.text, fontSize: 14, fontWeight: '700' },
    historicoDetalhesText: { color: c.textMuted, fontSize: 12, marginTop: 2 },
    historicoBadgeResultado: {
      backgroundColor: c.primarySoft,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 8,
    },
    historicoBadgeText: { color: c.accent, fontWeight: '800', fontSize: 13 },
    historicoSetaText: { fontSize: 12 },

    modalBackdrop: { flex: 1, backgroundColor: c.overlay, justifyContent: 'center', padding: 20 },
    modalContainer: {
      backgroundColor: c.surface,
      borderRadius: 24,
      padding: 24,
      maxHeight: '80%',
      maxWidth: 560,
      alignSelf: 'center',
      width: '100%',
    },
    modalTitle: { color: c.text, fontSize: 19, fontWeight: '800', marginBottom: 14, textAlign: 'center' },
    inputBuscaModal: {
      backgroundColor: c.surfaceAlt,
      color: c.text,
      borderRadius: 14,
      paddingHorizontal: 16,
      paddingVertical: 13,
      borderWidth: 1,
      borderColor: c.primary,
      marginBottom: 12,
    },
    modalItem: { paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: c.border, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    modalItemText: { color: c.text, fontSize: 14, flex: 1 },
    subgrupoSeta: { color: c.textMuted, fontSize: 24, marginLeft: 10 },
    subgrupoVoltar: { marginBottom: 10, paddingVertical: 8 },
    subgrupoVoltarTexto: { color: c.accent, fontSize: 14, fontWeight: '700' },
    modalCloseBtn: {
      marginTop: 16,
      backgroundColor: c.surfaceAlt,
      paddingVertical: 12,
      borderRadius: 12,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: c.border,
    },
    modalCloseText: { color: c.text, fontWeight: '700', fontSize: 14 },
  });