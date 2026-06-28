import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { connect } from 'react-redux';
import Icon from '@expo/vector-icons/Ionicons';
import colors from '@colors';
import { Bold, Regular, Medium } from '@fonts';
import { wp, hp } from '@utils/utilities';
import { Header, Button } from '@components/common';
import * as OrderActions from '@store/Orders/actions';
import * as RestaurantActions from '@store/Restaurants/actions';

let connectState = (state) => ({ user: state.Auth.auth.get('user') });
let enhancer = connect(connectState, { ...OrderActions, ...RestaurantActions });

function Stars({ value, onChange, label }) {
  return (
    <View style={styles.starRow}>
      <Text style={styles.starLabel}>{label}</Text>
      <View style={{ flexDirection: 'row', gap: wp(1.5) }}>
        {[1, 2, 3, 4, 5].map((s) => (
          <TouchableOpacity key={s} onPress={() => onChange(s)}>
            <Icon name={s <= value ? 'star' : 'star-outline'} size={wp(7)} color={colors.golden} />
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

function ReviewOrder({ navigation, route, user, getOrder, createReview }) {
  const { orderId } = route.params;
  const [order, setOrder] = useState(null);
  const [food, setFood] = useState(5);
  const [delivery, setDelivery] = useState(5);
  const [overall, setOverall] = useState(5);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => { getOrder(orderId).then(setOrder); }, [orderId]);

  const submit = async () => {
    if (!order) return;
    setLoading(true);
    try {
      await createReview({
        order_id: orderId,
        customer_id: user.id,
        restaurant_id: order.restaurant_id,
        food_rating: food,
        delivery_rating: delivery,
        overall_rating: overall,
        comment,
      });
      Alert.alert('Thank you!', 'Your review has been submitted.', [{ text: 'OK', onPress: () => navigation.goBack() }]);
    } catch (e) {
      const dup = /duplicate|unique/i.test(e.message || '');
      Alert.alert('Notice', dup ? 'You already reviewed this order.' : e.message || 'Failed', [{ text: 'OK', onPress: () => navigation.goBack() }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Header title="Rate Your Order" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.restaurant}>{order && order.restaurant && order.restaurant.name}</Text>
        <View style={styles.section}>
          <Stars label="Food Quality" value={food} onChange={setFood} />
          <Stars label="Delivery" value={delivery} onChange={setDelivery} />
          <Stars label="Overall" value={overall} onChange={setOverall} />
        </View>
        <Text style={styles.commentLabel}>Add a comment (optional)</Text>
        <TextInput value={comment} onChangeText={setComment} placeholder="Tell us about your experience..." placeholderTextColor={colors.placeholder} multiline style={styles.comment} />
        <Button label="Submit Review" onPress={submit} loading={loading} buttonStyle={{ marginTop: hp(2) }} />
      </ScrollView>
    </SafeAreaView>
  );
}

export default enhancer(ReviewOrder);

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.white
  },
  scroll: {
    padding: wp(6)
  },
  restaurant: {
    fontWeight: Bold,
    fontSize: wp(5.5),
    color: colors.txtDark,
    marginBottom: hp(2)
  },
  section: {
    backgroundColor: colors.surface,
    borderRadius: wp(4),
    padding: wp(4),
    gap: hp(2),
    marginBottom: hp(2)
  },
  starRow: {
    gap: hp(1)
  },
  starLabel: {
    fontWeight: Medium,
    fontSize: wp(3.6),
    color: colors.dark700
  },
  commentLabel: {
    fontWeight: Medium,
    fontSize: wp(3.6),
    color: colors.dark700,
    marginBottom: hp(1)
  },
  comment: {
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: wp(3.5),
    padding: wp(3.5),
    fontWeight: Regular,
    fontSize: wp(3.6),
    color: colors.txtDark,
    textAlignVertical: 'top',
    minHeight: hp(12)
  }
});
