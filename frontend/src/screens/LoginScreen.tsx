import React, { useMemo, useRef, useState } from 'react';

import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors, useTheme } from '../theme';
import { useAuth } from '../context/AuthContext';
import { useIsDesktop } from '../hooks/useLayout';
import { useKeyboardHeight } from '../hooks/useKeyboardHeight';
import { BrandMark } from '../components/Brand';
import { solicitarRedefinicaoSenha } from '../services/auth';

// Remove o contorno padrão do navegador nos campos
const semContorno = (
  Platform.OS === 'web' ? { outlineStyle: 'none' } : {}
) as object;

export default function LoginScreen() {
  const { colors, isDark, toggleTheme } = useTheme();
  const { entrar, cadastrar } = useAuth();
  const desktop = useIsDesktop();
  const insets = useSafeAreaInsets();
  const tecladoAltura = useKeyboardHeight();

  const styles = useMemo(() => createStyles(colors), [colors]);

  const [modo, setModo] = useState<'entrar' | 'cadastrar' | 'recuperar'>('entrar');
  const cadastro = modo === 'cadastrar';
  const recuperar = modo === 'recuperar';

  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [foco, setFoco] = useState<'nome' | 'email' | 'senha' | 'confirmar' | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);

  const emailRef = useRef<TextInput>(null);
  const senhaRef = useRef<TextInput>(null);
  const confirmarRef = useRef<TextInput>(null);

  function alternarModo() {
    if (carregando) return;
    setModo(cadastro ? 'entrar' : 'cadastrar');
    setErro(null);
    setSucesso(null);
    setSenha('');
    setConfirmar('');
    setMostrarSenha(false);
  }

  function abrirRecuperacao() {
    if (carregando) return;
    setModo('recuperar');
    setErro(null);
    setSucesso(null);
    setSenha('');
  }

  function voltarAoLogin() {
    if (carregando) return;
    setModo('entrar');
    setErro(null);
    setSucesso(null);
  }

  async function handleEnviar() {
    if (carregando) return;

    if (cadastro) {
      if (nome.trim().length < 2) {
        setErro('Informe seu nome.');
        return;
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())) {
        setErro('Informe um e-mail válido.');
        return;
      }
      if (senha.length < 8) {
        setErro('A senha deve ter pelo menos 8 caracteres.');
        return;
      }
      if (senha !== confirmar) {
        setErro('As senhas não conferem.');
        return;
      }
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())) {
      setErro('Informe um e-mail válido.');
      return;
    } else if (!recuperar && !senha) {
      setErro('Informe sua senha.');
      return;
    }

    setErro(null);
    setSucesso(null);
    setCarregando(true);

    try {
      if (recuperar) {
        await solicitarRedefinicaoSenha(email.trim());
        setSucesso('Se esse e-mail estiver cadastrado, você receberá uma mensagem com as instruções para redefinir a senha.');
        setCarregando(false);
        return;
      } else if (cadastro) {
        await cadastrar(nome.trim(), email.trim(), senha);
      } else {
        await entrar(email.trim(), senha);
      }
    } catch (e) {
      setErro(
        e instanceof Error
          ? e.message
          : cadastro
            ? 'Não foi possível criar a conta. Tente novamente.'
            : 'Não foi possível entrar. Tente novamente.'
      );

      setCarregando(false);
    }
  }

  const bordaCampo = (campo: 'nome' | 'email' | 'senha' | 'confirmar') =>
    erro
      ? styles.campoErro
      : foco === campo
        ? styles.campoFoco
        : null;

  const formulario = (
    <View style={styles.card}>
      <Text style={styles.cardTitulo}>
        {cadastro ? 'Criar conta' : recuperar ? 'Esqueci minha senha' : 'Entrar'}
      </Text>

      <Text style={styles.cardSubtitulo}>
        {cadastro
          ? 'Cadastre-se para usar a calculadora.'
          : recuperar
            ? 'Informe seu e-mail e enviaremos as instruções de recuperação.'
            : 'Acesse sua conta para continuar.'}
      </Text>

      {erro && (
        <View style={styles.erroBox} accessibilityRole="alert">
          <Text style={styles.erroIcone}>!</Text>

          <View style={{ flex: 1 }}>
            <Text style={styles.erroTitulo}>
              {cadastro ? 'Não foi possível criar a conta' : recuperar ? 'Não foi possível enviar o link' : 'Não foi possível entrar'}
            </Text>

            <Text style={styles.erroTexto}>{erro}</Text>
          </View>
        </View>
      )}

      {sucesso && (
        <View style={styles.sucessoBox} accessibilityRole="alert">
          <Text style={styles.sucessoTexto}>{sucesso}</Text>
        </View>
      )}

      {cadastro && (
        <>
          <Text style={styles.label}>Nome</Text>

          <View style={[styles.campo, bordaCampo('nome')]}>
            <TextInput
              style={[styles.input, semContorno]}
              placeholder="Como devemos te chamar"
              placeholderTextColor={colors.textMuted}
              value={nome}
              onChangeText={setNome}
              autoCapitalize="words"
              textContentType="name"
              returnKeyType="next"
              onFocus={() => setFoco('nome')}
              onBlur={() => setFoco(null)}
              onSubmitEditing={() => emailRef.current?.focus()}
              accessibilityLabel="Nome"
            />
          </View>
        </>
      )}

      <Text style={styles.label}>E-mail</Text>

      <View style={[styles.campo, bordaCampo('email')]}>
        <TextInput
          ref={emailRef}
          style={[styles.input, semContorno]}
          placeholder="seuemail@exemplo.com"
          placeholderTextColor={colors.textMuted}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="email"
          textContentType="emailAddress"
          returnKeyType="next"
          onFocus={() => setFoco('email')}
          onBlur={() => setFoco(null)}
          onSubmitEditing={() => senhaRef.current?.focus()}
          accessibilityLabel="E-mail"
        />
      </View>

      {!recuperar && <Text style={styles.label}>Senha</Text>}

      {!recuperar && <View style={[styles.campo, bordaCampo('senha')]}>
        <TextInput
          ref={senhaRef}
          style={[styles.input, semContorno]}
          placeholder={cadastro ? 'Mínimo de 8 caracteres' : 'Digite sua senha'}
          placeholderTextColor={colors.textMuted}
          value={senha}
          onChangeText={setSenha}
          secureTextEntry={!mostrarSenha}
          autoCapitalize="none"
          autoCorrect={false}
          textContentType={cadastro ? 'newPassword' : 'password'}
          returnKeyType={cadastro ? 'next' : 'go'}
          onFocus={() => setFoco('senha')}
          onBlur={() => setFoco(null)}
          onSubmitEditing={cadastro ? () => confirmarRef.current?.focus() : handleEnviar}
          accessibilityLabel="Senha"
        />

        <TouchableOpacity
          onPress={() => setMostrarSenha((v) => !v)}
          hitSlop={8}
          accessibilityRole="button"
        >
          <Text style={styles.mostrar}>
            {mostrarSenha ? 'Ocultar' : 'Mostrar'}
          </Text>
        </TouchableOpacity>
      </View>}

      {!cadastro && !recuperar && (
        <TouchableOpacity
          style={styles.esqueciLinha}
          onPress={abrirRecuperacao}
          disabled={carregando}
          accessibilityRole="button"
        >
          <Text style={styles.trocaLink}>Esqueci minha senha</Text>
        </TouchableOpacity>
      )}

      {cadastro && (
        <>
          <Text style={styles.label}>Confirmar senha</Text>

          <View style={[styles.campo, bordaCampo('confirmar')]}>
            <TextInput
              ref={confirmarRef}
              style={[styles.input, semContorno]}
              placeholder="Repita a senha"
              placeholderTextColor={colors.textMuted}
              value={confirmar}
              onChangeText={setConfirmar}
              secureTextEntry={!mostrarSenha}
              autoCapitalize="none"
              autoCorrect={false}
              textContentType="newPassword"
              returnKeyType="go"
              onFocus={() => setFoco('confirmar')}
              onBlur={() => setFoco(null)}
              onSubmitEditing={handleEnviar}
              accessibilityLabel="Confirmar senha"
            />
          </View>
        </>
      )}

      <TouchableOpacity
        style={[
          styles.botao,
          carregando && styles.botaoDesabilitado,
        ]}
        onPress={handleEnviar}
        disabled={carregando}
        activeOpacity={0.85}
        accessibilityRole="button"
      >
        {carregando ? (
          <ActivityIndicator color={colors.onPrimary} />
        ) : (
          <Text style={styles.botaoTexto}>
            {cadastro ? 'Criar conta' : recuperar ? 'Enviar instruções' : 'Entrar'}
          </Text>
        )}
      </TouchableOpacity>

      <View style={styles.trocaLinha}>
        <Text style={styles.trocaTexto}>
          {recuperar ? 'Lembrou sua senha?' : cadastro ? 'Já tem uma conta?' : 'Ainda não tem conta?'}
        </Text>

        <TouchableOpacity
          onPress={recuperar ? voltarAoLogin : alternarModo}
          disabled={carregando}
          hitSlop={8}
          accessibilityRole="button"
        >
          <Text style={styles.trocaLink}>
            {recuperar ? 'Entrar' : cadastro ? 'Entrar' : 'Criar conta'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const botaoTema = (
    <TouchableOpacity
      style={styles.botaoTema}
      onPress={toggleTheme}
      activeOpacity={0.7}
    >
      <Text style={styles.temaIcone}>
        {isDark ? '☀️' : '🌙'}
      </Text>
    </TouchableOpacity>
  );

  // DESKTOP
  if (desktop) {
    return (
      <SafeAreaView
        style={styles.safe}
        edges={['top', 'left', 'right']}
      >
        <View style={styles.split}>
          <View style={styles.painelMarca}>
            <View style={styles.marcaLinha}>
              <BrandMark size={48} />

              <Text style={styles.marcaNome}>
                InflateIQ
              </Text>
            </View>

            <View style={styles.hero}>
              <Text style={styles.heroTitulo}>
                Descubra quanto a inflação pesa no seu bolso.
              </Text>

              <Text style={styles.heroTexto}>
                Compare a sua inflação pessoal com o IPCA oficial e
                entenda o impacto real nos seus gastos.
              </Text>

              <View style={styles.chips}>
                <Text style={styles.chip}>
                  IPCA oficial · IBGE
                </Text>

                <Text style={styles.chip}>
                  Sua cesta, sua inflação
                </Text>
              </View>
            </View>

            <Text style={styles.rodape}>
              Dados oficiais do IPCA · IBGE
            </Text>
          </View>

          <View style={styles.painelForm}>
            <View style={styles.temaCanto}>
              {botaoTema}
            </View>

            <ScrollView
              contentContainerStyle={styles.formScroll}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {formulario}
            </ScrollView>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // MOBILE
  return (
    <SafeAreaView
      style={styles.safe}
      edges={['top', 'left', 'right']}
    >
      <View
        pointerEvents="none"
        style={styles.brilho}
      />

      <View style={[styles.temaCanto, { top: insets.top + 20 }]}>
        {botaoTema}
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'web' ? undefined : 'padding'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={[styles.mobileScroll, { paddingBottom: 24 + tecladoAltura }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.marcaMobile}>
            <BrandMark size={64} />

            <Text style={styles.marcaMobileNome}>
              InflateIQ
            </Text>

            <Text style={styles.marcaMobileTexto}>
              Descubra quanto a inflação pesa no seu bolso.
            </Text>
          </View>

          {formulario}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const PRETO = '#0A0A0A';

const createStyles = (c: Colors) =>
  StyleSheet.create({
    safe: {
      flex: 1,
      backgroundColor: c.bg,
      overflow: 'hidden',
    },

    brilho: {
      position: 'absolute',
      top: -40,
      right: -40,
      width: 200,
      height: 200,
      borderRadius: 100,
      boxShadow:
        '0px 0px 140px 70px rgba(255, 225, 0, 0.16)',
    },

    mobileScroll: {
      flexGrow: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 24,
      gap: 32,
    },

    marcaMobile: {
      alignItems: 'center',
      gap: 14,
      maxWidth: 320,
    },

    marcaMobileNome: {
      color: c.text,
      fontSize: 32,
      fontWeight: '800',
      letterSpacing: -0.8,
    },

    marcaMobileTexto: {
      color: c.textSecondary,
      fontSize: 15,
      lineHeight: 22,
      textAlign: 'center',
    },

    split: {
      flex: 1,
      flexDirection: 'row',
    },

    painelMarca: {
      flex: 1,
      backgroundColor: c.primary,
      padding: 72,
      justifyContent: 'space-between',
    },

    marcaLinha: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 14,
    },

    marcaNome: {
      color: PRETO,
      fontSize: 26,
      fontWeight: '800',
      letterSpacing: -0.6,
    },

    hero: {
      maxWidth: 576,
      gap: 24,
    },

    heroTitulo: {
      color: PRETO,
      fontSize: 56,
      lineHeight: 62,
      fontWeight: '800',
      letterSpacing: -1.5,
    },

    heroTexto: {
      color: 'rgba(10, 10, 10, 0.75)',
      fontSize: 18,
      lineHeight: 28,
    },

    chips: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
    },

    chip: {
      color: '#FFE100',
      backgroundColor: PRETO,
      fontSize: 13,
      fontWeight: '700',
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 999,
      overflow: 'hidden',
    },

    rodape: {
      color: 'rgba(10, 10, 10, 0.6)',
      fontSize: 13,
      fontWeight: '500',
    },

    painelForm: {
      flex: 1,
      backgroundColor: c.bg,
    },

    formScroll: {
      flexGrow: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 48,
    },

    temaCanto: {
      position: 'absolute',
      top: 20,
      right: 20,
      zIndex: 5,
    },

    botaoTema: {
      width: 40,
      height: 40,
      borderRadius: 12,
      backgroundColor: c.surfaceAlt,
      borderWidth: 1,
      borderColor: c.border,
      alignItems: 'center',
      justifyContent: 'center',
    },

    temaIcone: {
      fontSize: 16,
    },

    card: {
      width: '100%',
      maxWidth: 440,
      backgroundColor: c.surface,
      borderRadius: 28,
      padding: 28,
      borderWidth: 1,
      borderColor: c.border,
      boxShadow: c.cardShadow,
    },

    cardTitulo: {
      color: c.text,
      fontSize: 28,
      fontWeight: '800',
      letterSpacing: -0.6,
    },

    cardSubtitulo: {
      color: c.textSecondary,
      fontSize: 14,
      marginTop: 6,
      marginBottom: 8,
    },

    label: {
      color: c.textSecondary,
      fontSize: 13,
      fontWeight: '600',
      marginTop: 16,
      marginBottom: 8,
    },

    campo: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      height: 54,
      paddingHorizontal: 16,
      borderRadius: 14,
      backgroundColor: c.surfaceAlt,
      borderWidth: 1,
      borderColor: c.border,
    },

    campoFoco: {
      borderColor: c.primary,
      borderWidth: 1.5,
    },

    campoErro: {
      borderColor: c.danger,
      borderWidth: 1.5,
    },

    input: {
      flex: 1,
      color: c.text,
      fontSize: 15,
      height: '100%',
    },

    mostrar: {
      color: c.accent,
      fontSize: 13,
      fontWeight: '700',
    },

    botao: {
      backgroundColor: c.primary,
      borderRadius: 16,
      paddingVertical: 17,
      alignItems: 'center',
      marginTop: 24,
      boxShadow: c.buttonShadow,
    },

    trocaLinha: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      gap: 6,
      marginTop: 20,
    },

    esqueciLinha: {
      alignSelf: 'flex-end',
      marginTop: 12,
    },

    trocaTexto: {
      color: c.textSecondary,
      fontSize: 14,
    },

    trocaLink: {
      color: c.accent,
      fontSize: 14,
      fontWeight: '700',
    },

    botaoDesabilitado: {
      opacity: 0.7,
    },

    botaoTexto: {
      color: c.onPrimary,
      fontWeight: '800',
      fontSize: 16,
      letterSpacing: 0.2,
    },

    erroBox: {
      flexDirection: 'row',
      gap: 12,
      alignItems: 'flex-start',
      backgroundColor: c.dangerSoft,
      borderWidth: 1,
      borderColor: c.danger,
      borderRadius: 14,
      padding: 14,
      marginTop: 12,
    },

    erroIcone: {
      width: 20,
      height: 20,
      lineHeight: 20,
      borderRadius: 10,
      textAlign: 'center',
      overflow: 'hidden',
      backgroundColor: c.danger,
      color: '#FFFFFF',
      fontSize: 13,
      fontWeight: '800',
    },

    erroTitulo: {
      color: c.danger,
      fontSize: 14,
      fontWeight: '700',
    },

    erroTexto: {
      color: c.textSecondary,
      fontSize: 13,
      lineHeight: 19,
      marginTop: 2,
    },

    sucessoBox: {
      backgroundColor: c.success + '18',
      borderWidth: 1,
      borderColor: c.success,
      borderRadius: 14,
      padding: 14,
      marginTop: 12,
    },

    sucessoTexto: {
      color: c.success,
      fontSize: 13,
      lineHeight: 19,
    },
  });
