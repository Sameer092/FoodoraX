import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { connect } from 'react-redux';
import { SafeAreaView } from 'react-native-safe-area-context';
import colors from '@colors';
import { Bold, Regular } from '@fonts';
import { wp, hp } from '@utils/utilities';
import { Button } from '@components/common';
import * as AuthActions from '@store/Auth/actions';

function Placeholder({ title, signOut }) {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.center}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.text}>This area is being rebuilt.</Text>
        <Button label="Sign Out" variant="outline" onPress={signOut} buttonStyle={styles.btn} />
      </View>
    </SafeAreaView>
  );
}

export default connect(null, { ...AuthActions })(Placeholder);

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.white
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: wp(8)
  },
  title: {
    fontWeight: Bold,
    fontSize: wp(5.5),
    color: colors.txtDark,
    marginBottom: hp(1)
  },
  text: {
    fontWeight: Regular,
    fontSize: wp(3.8),
    color: colors.txtSecondary,
    marginBottom: hp(3)
  },
  btn: {
    paddingHorizontal: wp(10)
  }
});
