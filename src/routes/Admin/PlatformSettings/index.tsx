import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { connect } from 'react-redux';
import { Formik } from 'formik';
import * as Yup from 'yup';
import colors from '@colors';
import { Regular } from '@fonts';
import { wp, hp } from '@utils/utilities';
import { Header, TextField, Button } from '@components/common';
import * as AdminActions from '@store/Admin/actions';

const num = Yup.number().typeError('Number').min(0, 'Invalid').required('Required');
const schema = Yup.object().shape({
  platform_commission: num.max(100, 'Max 100'),
  rider_base_pay: num,
  rider_per_km: num,
  min_payout: num,
});

const FIELDS = [
  { key: 'platform_commission', label: 'Platform Commission (%)', icon: 'pie-chart-outline' },
  { key: 'rider_base_pay', label: 'Rider Base Pay ($)', icon: 'cash-outline' },
  { key: 'rider_per_km', label: 'Rider Pay per km ($)', icon: 'speedometer-outline' },
  { key: 'min_payout', label: 'Minimum Payout ($)', icon: 'wallet-outline' },
];

let enhancer = connect(null, { ...AdminActions });

function PlatformSettings({ navigation, getSettings, updateSettings }) {
  const [settings, setSettings] = useState(null);

  useEffect(() => { getSettings().then(setSettings); }, []);

  const submit = async (values) => {
    try {
      await updateSettings({
        platform_commission: parseFloat(values.platform_commission),
        rider_base_pay: parseFloat(values.rider_base_pay),
        rider_per_km: parseFloat(values.rider_per_km),
        min_payout: parseFloat(values.min_payout),
      });
      Alert.alert('Saved', 'Platform settings updated!', [{ text: 'OK', onPress: () => navigation.goBack() }]);
    } catch (e) {
      Alert.alert('Error', e.message || 'Failed');
    }
  };

  if (!settings) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <Header title="Platform Settings" onBack={() => navigation.goBack()} />
        <ActivityIndicator color={colors.primary} style={{ marginTop: hp(5) }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Header title="Platform Settings" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Text style={styles.note}>These values control rider payouts and the commission taken on each delivered order.</Text>
        <Formik
          initialValues={{
            platform_commission: String(settings.platform_commission),
            rider_base_pay: String(settings.rider_base_pay),
            rider_per_km: String(settings.rider_per_km),
            min_payout: String(settings.min_payout),
          }}
          validationSchema={schema}
          onSubmit={submit}
        >
          {({ handleChange, handleSubmit, values, errors, touched }) => (
            <>
              {FIELDS.map((f) => (
                <TextField
                  key={f.key}
                  label={f.label}
                  value={values[f.key]}
                  onChangeText={handleChange(f.key)}
                  keyboardType="decimal-pad"
                  icon={f.icon}
                  error={touched[f.key] && errors[f.key]}
                />
              ))}
              <Button label="Save Settings" onPress={handleSubmit} buttonStyle={{ marginTop: hp(1) }} />
            </>
          )}
        </Formik>
      </ScrollView>
    </SafeAreaView>
  );
}

export default enhancer(PlatformSettings);

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.white
  },
  scroll: {
    padding: wp(6)
  },
  note: {
    fontWeight: Regular,
    fontSize: wp(3.2),
    color: colors.txtSecondary,
    marginBottom: hp(2.5),
    lineHeight: wp(4.8)
  }
});
