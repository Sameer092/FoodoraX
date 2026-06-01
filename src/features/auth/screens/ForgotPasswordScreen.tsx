import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { authService } from '@services/auth.service';
import { Button } from '@components/common/Button';
import { Input } from '@components/common/Input';
import { Colors } from '@constants/colors';

const schema = z.object({ email: z.string().email('Enter a valid email') });
type Form = z.infer<typeof schema>;

export function ForgotPasswordScreen() {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const { control, handleSubmit, formState: { errors } } = useForm<Form>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: Form) => {
    setLoading(true);
    try {
      await authService.forgotPassword(data.email);
      setSent(true);
    } catch (e: any) {
      Alert.alert('Error', e.message ?? 'Failed to send reset email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
          <Ionicons name="arrow-back" size={24} color={Colors.dark[900]} />
        </TouchableOpacity>

        <View style={styles.iconWrapper}>
          <Ionicons name="lock-open-outline" size={48} color={Colors.primary[500]} />
        </View>

        <Text style={styles.title}>Forgot Password?</Text>
        <Text style={styles.subtitle}>
          Enter your email and we'll send you a link to reset your password.
        </Text>

        {sent ? (
          <View style={styles.sentWrapper}>
            <Ionicons name="checkmark-circle" size={64} color={Colors.status.success} />
            <Text style={styles.sentTitle}>Email Sent!</Text>
            <Text style={styles.sentDesc}>
              Check your inbox for the password reset link.
            </Text>
            <Button title="Back to Login" onPress={() => navigation.goBack()} fullWidth style={styles.btn} />
          </View>
        ) : (
          <>
            <Controller control={control} name="email" render={({ field }) => (
              <Input
                label="Email Address"
                placeholder="your@email.com"
                keyboardType="email-address"
                autoCapitalize="none"
                value={field.value}
                onChangeText={field.onChange}
                error={errors.email?.message}
                leftIcon={<Ionicons name="mail-outline" size={18} color={Colors.light.textTertiary} />}
              />
            )} />
            <Button title="Send Reset Link" onPress={handleSubmit(onSubmit)} loading={loading} fullWidth style={styles.btn} />
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.white },
  container: { flex: 1, padding: 24 },
  back: { marginBottom: 32, alignSelf: 'flex-start' },
  iconWrapper: {
    width: 96, height: 96, borderRadius: 48,
    backgroundColor: Colors.primary[50],
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 24, alignSelf: 'center',
  },
  title: { fontSize: 26, fontWeight: '800', color: Colors.dark[900], textAlign: 'center', marginBottom: 10 },
  subtitle: { fontSize: 14, color: Colors.light.textSecondary, textAlign: 'center', lineHeight: 20, marginBottom: 32 },
  btn: { marginTop: 16 },
  sentWrapper: { alignItems: 'center', paddingTop: 16 },
  sentTitle: { fontSize: 22, fontWeight: '800', color: Colors.dark[900], marginTop: 16, marginBottom: 8 },
  sentDesc: { fontSize: 14, color: Colors.light.textSecondary, textAlign: 'center', lineHeight: 20, marginBottom: 32 },
});
