import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { authService } from '@services/auth.service';
import { useAuthStore } from '@store/auth.store';
import { Button } from '@components/common/Button';
import { Input } from '@components/common/Input';
import { Colors } from '@constants/colors';

const schema = z.object({
  full_name: z.string().min(2, 'Name too short'),
  phone: z.string().optional(),
});
type Form = z.infer<typeof schema>;

export function EditProfileScreen() {
  const navigation = useNavigation<any>();
  const { user, setUser } = useAuthStore();
  const [loading, setLoading] = useState(false);

  const { control, handleSubmit, formState: { errors } } = useForm<Form>({
    resolver: zodResolver(schema),
    defaultValues: { full_name: user?.full_name ?? '', phone: user?.phone ?? '' },
  });

  const onSubmit = async (data: Form) => {
    setLoading(true);
    try {
      const updated = await authService.updateProfile(user!.id, data);
      setUser(updated);
      Alert.alert('Success', 'Profile updated!');
      navigation.goBack();
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={Colors.dark[900]} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <View style={{ width: 24 }} />
      </View>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.avatarSection}>
          <View style={styles.avatarWrapper}>
            {user?.avatar_url ? (
              <Image source={{ uri: user.avatar_url }} style={styles.avatar} contentFit="cover" />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarInitial}>{user?.full_name?.[0]?.toUpperCase()}</Text>
              </View>
            )}
            <View style={styles.editAvatarBtn}>
              <Ionicons name="camera" size={14} color={Colors.white} />
            </View>
          </View>
          <Text style={styles.avatarHint}>Tap to change photo</Text>
        </View>

        <Controller control={control} name="full_name" render={({ field }) => (
          <Input label="Full Name" value={field.value} onChangeText={field.onChange} error={errors.full_name?.message} />
        )} />
        <Controller control={control} name="phone" render={({ field }) => (
          <Input label="Phone" value={field.value} onChangeText={field.onChange} keyboardType="phone-pad" />
        )} />

        <Button title="Save Changes" onPress={handleSubmit(onSubmit)} loading={loading} fullWidth style={styles.btn} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.white },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: Colors.light.border,
  },
  headerTitle: { fontSize: 18, fontWeight: '800', color: Colors.dark[900] },
  scroll: { padding: 24 },
  avatarSection: { alignItems: 'center', marginBottom: 28 },
  avatarWrapper: { position: 'relative', marginBottom: 8 },
  avatar: { width: 90, height: 90, borderRadius: 45 },
  avatarPlaceholder: {
    width: 90, height: 90, borderRadius: 45,
    backgroundColor: Colors.primary[500],
    alignItems: 'center', justifyContent: 'center',
  },
  avatarInitial: { color: Colors.white, fontSize: 36, fontWeight: '700' },
  editAvatarBtn: {
    position: 'absolute', bottom: 0, right: 0,
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: Colors.primary[500],
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: Colors.white,
  },
  avatarHint: { fontSize: 12, color: Colors.light.textSecondary },
  btn: { marginTop: 16 },
});
