import React, { useMemo, useState } from 'react';
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
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, useTheme } from '../theme';
import { useIsDesktop } from '../hooks/useLayout';
import { BrandMark } from '../components/Brand';
import { redefinirSenha } from '../services/auth';

const semContorno = (Platform.OS === 'web' ? { outlineStyle: 'none' } : {}) as object;

export default function PasswordResetScreen({ token, onDone }: { token: string; onDone: () => void }) {
  const { colors } = useTheme();
  const desktop = useIsDesktop();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [senha, setSenha] = useState('');
  const [confirmacao, setConfirmacao] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const [concluido, setConcluido] = useState(false);
  const [carregando, setCarregando] = useState(false);

  async function salvar() {
    if (carregando || concluido) return;
    if (senha.length < 8 || senha.length > 72) {
      setErro('A senha deve ter de 8 a 72 caracteres.');
      return;
    }
    if (senha !== confirmacao) {
      setErro('As senhas não conferem.');
      return;
    }

    setErro(null);
    setCarregando(true);
    try {
      await redefinirSenha(token, senha);
      setConcluido(true);
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Não foi possível alterar a senha. Solicite um novo link.');
    } finally {
      setCarregando(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={[styles.card, desktop && styles.cardDesktop]}>
            <View style={styles.brand}>
              <BrandMark size={42} />
              <Text style={styles.brandName}>InflateIQ</Text>
            </View>

            <Text style={styles.title}>{concluido ? 'Senha alterada' : 'Crie uma nova senha'}</Text>
            <Text style={styles.subtitle}>
              {concluido
                ? 'Sua senha foi atualizada. Agora você já pode entrar na sua conta.'
                : 'Escolha uma senha nova com pelo menos 8 caracteres.'}
            </Text>

            {erro && <Text style={styles.error} accessibilityRole="alert">{erro}</Text>}

            {!concluido && (
              <>
                <Text style={styles.label}>Nova senha</Text>
                <TextInput
                  style={[styles.input, semContorno]}
                  value={senha}
                  onChangeText={setSenha}
                  placeholder="Mínimo de 8 caracteres"
                  placeholderTextColor={colors.textMuted}
                  secureTextEntry
                  autoCapitalize="none"
                  autoComplete="new-password"
                  textContentType="newPassword"
                  accessibilityLabel="Nova senha"
                />

                <Text style={styles.label}>Confirmar nova senha</Text>
                <TextInput
                  style={[styles.input, semContorno]}
                  value={confirmacao}
                  onChangeText={setConfirmacao}
                  placeholder="Digite a senha novamente"
                  placeholderTextColor={colors.textMuted}
                  secureTextEntry
                  autoCapitalize="none"
                  autoComplete="new-password"
                  textContentType="newPassword"
                  accessibilityLabel="Confirmar nova senha"
                  onSubmitEditing={salvar}
                />
              </>
            )}

            <TouchableOpacity
              style={[styles.button, carregando && styles.disabled]}
              onPress={concluido ? onDone : salvar}
              disabled={carregando}
              accessibilityRole="button"
            >
              {carregando
                ? <ActivityIndicator color={colors.onPrimary} />
                : <Text style={styles.buttonText}>{concluido ? 'Voltar ao login' : 'Salvar nova senha'}</Text>}
            </TouchableOpacity>
            {!concluido && (
              <TouchableOpacity style={styles.backButton} onPress={onDone} accessibilityRole="button">
                <Text style={styles.backText}>Voltar para o login</Text>
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const createStyles = (c: Colors) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: c.bg },
  flex: { flex: 1 },
  scroll: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  card: { width: '100%', maxWidth: 440, padding: 28, borderRadius: 24, backgroundColor: c.surface, borderWidth: 1, borderColor: c.border, boxShadow: c.cardShadow },
  cardDesktop: { maxWidth: 480 },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 26 },
  brandName: { color: c.text, fontSize: 20, fontWeight: '800' },
  title: { color: c.text, fontSize: 26, fontWeight: '800' },
  subtitle: { color: c.textSecondary, fontSize: 14, lineHeight: 21, marginTop: 8 },
  label: { color: c.textSecondary, fontSize: 13, fontWeight: '600', marginTop: 18, marginBottom: 8 },
  input: { height: 54, paddingHorizontal: 16, borderRadius: 14, backgroundColor: c.surfaceAlt, borderWidth: 1, borderColor: c.border, color: c.text, fontSize: 15 },
  error: { marginTop: 16, padding: 12, borderRadius: 12, color: c.danger, backgroundColor: c.dangerSoft, lineHeight: 20 },
  button: { minHeight: 54, justifyContent: 'center', alignItems: 'center', marginTop: 24, paddingHorizontal: 18, borderRadius: 14, backgroundColor: c.primary, boxShadow: c.buttonShadow },
  buttonText: { color: c.onPrimary, fontSize: 15, fontWeight: '800' },
  backButton: { alignItems: 'center', padding: 14, marginTop: 8 },
  backText: { color: c.accent, fontSize: 14, fontWeight: '700' },
  disabled: { opacity: 0.7 },
});
