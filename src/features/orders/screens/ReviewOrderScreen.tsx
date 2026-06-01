import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useQueryClient } from '@tanstack/react-query';
import { restaurantService } from '@services/restaurant.service';
import { useOrder } from '@hooks/useOrders';
import { useAuthStore } from '@store/auth.store';
import { Button } from '@components/common/Button';
import { Colors } from '@constants/colors';

function StarRow({ value, onChange, label }: { value: number; onChange: (v: number) => void; label: string }) {
  return (
    <View style={rStyles.row}>
      <Text style={rStyles.label}>{label}</Text>
      <View style={rStyles.stars}>
        {[1, 2, 3, 4, 5].map((star) => (
          <TouchableOpacity key={star} onPress={() => onChange(star)}>
            <Ionicons name={star <= value ? 'star' : 'star-outline'} size={28} color="#FBBF24" />
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

export function ReviewOrderScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { orderId } = route.params;
  const { user } = useAuthStore();
  const { data: order } = useOrder(orderId);
  const queryClient = useQueryClient();

  const [foodRating, setFoodRating] = useState(5);
  const [deliveryRating, setDeliveryRating] = useState(5);
  const [overallRating, setOverallRating] = useState(5);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!order || !user) return;
    setLoading(true);
    try {
      await restaurantService.createReview({
        order_id: orderId,
        customer_id: user.id,
        restaurant_id: order.restaurant_id,
        food_rating: foodRating,
        delivery_rating: deliveryRating,
        overall_rating: overallRating,
        comment,
      });
      queryClient.invalidateQueries({ queryKey: ['restaurants', 'reviews', order.restaurant_id] });
      Alert.alert('Thank you!', 'Your review has been submitted.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (e: any) {
      Alert.alert('Error', e.message ?? 'Failed to submit review');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={rStyles.safe}>
      <View style={rStyles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="close" size={24} color={Colors.dark[900]} />
        </TouchableOpacity>
        <Text style={rStyles.headerTitle}>Rate Your Order</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={rStyles.scroll}>
        <Text style={rStyles.restaurantName}>{order?.restaurant?.name}</Text>
        <Text style={rStyles.subtext}>Share your experience with this order</Text>

        <View style={rStyles.section}>
          <StarRow label="Food Quality" value={foodRating} onChange={setFoodRating} />
          <StarRow label="Delivery Speed" value={deliveryRating} onChange={setDeliveryRating} />
          <StarRow label="Overall Experience" value={overallRating} onChange={setOverallRating} />
        </View>

        <View style={rStyles.commentSection}>
          <Text style={rStyles.commentLabel}>Add a comment (optional)</Text>
          <TextInput
            value={comment}
            onChangeText={setComment}
            placeholder="Tell us about your experience..."
            multiline
            numberOfLines={4}
            style={rStyles.commentInput}
            placeholderTextColor={Colors.light.placeholder}
          />
        </View>

        <Button title="Submit Review" onPress={handleSubmit} loading={loading} fullWidth style={rStyles.btn} />
      </ScrollView>
    </SafeAreaView>
  );
}

const rStyles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.white },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: Colors.light.border,
  },
  headerTitle: { fontSize: 18, fontWeight: '800', color: Colors.dark[900] },
  scroll: { padding: 24 },
  restaurantName: { fontSize: 22, fontWeight: '800', color: Colors.dark[900], marginBottom: 4 },
  subtext: { fontSize: 14, color: Colors.light.textSecondary, marginBottom: 28 },
  section: {
    backgroundColor: Colors.light.surface, borderRadius: 16,
    padding: 16, marginBottom: 16, gap: 16,
  },
  row: { gap: 8 },
  label: { fontSize: 14, fontWeight: '600', color: Colors.dark[700] },
  stars: { flexDirection: 'row', gap: 6 },
  commentSection: { marginBottom: 24 },
  commentLabel: { fontSize: 14, fontWeight: '600', color: Colors.dark[700], marginBottom: 8 },
  commentInput: {
    borderWidth: 1.5, borderColor: Colors.light.border, borderRadius: 14,
    padding: 14, fontSize: 14, color: Colors.dark[900],
    textAlignVertical: 'top', minHeight: 100,
  },
  btn: { marginTop: 8 },
});
