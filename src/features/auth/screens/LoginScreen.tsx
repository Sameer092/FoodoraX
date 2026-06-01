import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  KeyboardAvoidingView, Platform, ScrollView, Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { authService } from '@services/auth.service';
import { Button } from '@components/common/Button';
import { Input } from '@components/common/Input';
import { Colors } from '@constants/colors';
import type { AuthStackNavigationProp } from '@types/navigation.types';

const schema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});
type LoginForm = z.infer<typeof schema>;

export function LoginScreen() {
  const navigation = useNavigation<AuthStackNavigationProp>();
  const [loading, setLoading] = useState(false);

  const { control, handleSubmit, formState: { errors } } = useForm<LoginForm>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: LoginForm) => {
    setLoading(true);
    try {
      await authService.signIn(data);
    } catch (e: any) {
      Alert.alert('Login Failed', e.message ?? 'Please check your credentials and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

          {/* Header */}
          <View style={styles.header}>
            <LinearGradient
              colors={[Colors.primary[400], Colors.primary[600]]}
              style={styles.logoWrapper}
            >
              <Text style={styles.logoText}>FX</Text>
            </LinearGradient>
            <Text style={styles.appName}>FoodoraX</Text>
            <Text style={styles.tagline}>Order food you love</Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            <Text style={styles.title}>Welcome back</Text>
            <Text style={styles.subtitle}>Sign in to your account</Text>

            <Controller
              control={control}
              name="email"
              render={({ field }) => (
                <Input
                  label="Email"
                  placeholder="Enter your email"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  value={field.value}
                  onChangeText={field.onChange}
                  error={errors.email?.message}
                  leftIcon={<Ionicons name="mail-outline" size={18} color={Colors.light.textTertiary} />}
                />
              )}
            />

            <Controller
              control={control}
              name="password"
              render={({ field }) => (
                <Input
                  label="Password"
                  placeholder="Enter your password"
                  isPassword
                  autoComplete="password"
                  value={field.value}
                  onChangeText={field.onChange}
                  error={errors.password?.message}
                  leftIcon={<Ionicons name="lock-closed-outline" size={18} color={Colors.light.textTertiary} />}
                />
              )}
            />

            <TouchableOpacity
              onPress={() => navigation.navigate('ForgotPassword')}
              style={styles.forgotBtn}
            >
              <Text style={styles.forgotText}>Forgot password?</Text>
            </TouchableOpacity>

            <Button
              title="Sign In"
              onPress={handleSubmit(onSubmit)}
              loading={loading}
              fullWidth
              style={styles.signInBtn}
            />

            {/* Divider */}
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or continue with</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Social Login */}
            <View style={styles.socialRow}>
              <TouchableOpacity style={styles.socialBtn} onPress={() => authService.signInWithGoogle()}>
                <Ionicons name="logo-google" size={20} color="#DB4437" />
                <Text style={styles.socialText}>Google</Text>
              </TouchableOpacity>
              {Platform.OS === 'ios' && (
                <TouchableOpacity style={styles.socialBtn} onPress={() => authService.signInWithApple()}>
                  <Ionicons name="logo-apple" size={20} color={Colors.dark[900]} />
                  <Text style={styles.socialText}>Apple</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Sign Up Link */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Don't have an account?</Text>
            <TouchableOpacity onPress={() => navigation.navigate('SignUp')}>
              <Text style={styles.signUpLink}> Sign up</Text>
            </TouchableOpacity>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.white },
  flex: { flex: 1 },
  scroll: { flexGrow: 1, padding: 24 },
  header: { alignItems: 'center', paddingTop: 20, paddingBottom: 36 },
  logoWrapper: {
    width: 72, height: 72, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 12,
    shadowColor: Colors.primary[500],
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4, shadowRadius: 16, elevation: 8,
  },
  logoText: { color: Colors.white, fontSize: 28, fontWeight: '900', letterSpacing: -1 },
  appName: { fontSize: 26, fontWeight: '900', color: Colors.dark[900], letterSpacing: -0.5 },
  tagline: { fontSize: 14, color: Colors.light.textSecondary, marginTop: 4 },
  form: { marginBottom: 24 },
  title: { fontSize: 26, fontWeight: '800', color: Colors.dark[900], marginBottom: 6 },
  subtitle: { fontSize: 14, color: Colors.light.textSecondary, marginBottom: 28 },
  forgotBtn: { alignSelf: 'flex-end', marginBottom: 24, marginTop: -8 },
  forgotText: { fontSize: 13, color: Colors.primary[600], fontWeight: '600' },
  signInBtn: { marginTop: 4 },
  divider: { flexDirection: 'row', alignItems: 'center', marginVertical: 24 },
  dividerLine: { flex: 1, height: 1, backgroundColor: Colors.light.border },
  dividerText: { marginHorizontal: 12, fontSize: 13, color: Colors.light.textSecondary },
  socialRow: { flexDirection: 'row', gap: 12, justifyContent: 'center' },
  socialBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: Colors.light.border,
    borderRadius: 12, paddingVertical: 13, gap: 8,
  },
  socialText: { fontSize: 14, fontWeight: '600', color: Colors.dark[800] },
  footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingBottom: 12 },
  footerText: { fontSize: 14, color: Colors.light.textSecondary },
  signUpLink: { fontSize: 14, color: Colors.primary[600], fontWeight: '700' },
});
