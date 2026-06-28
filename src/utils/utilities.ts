import { Dimensions } from 'react-native';
import {
  heightPercentageToDP,
  widthPercentageToDP,
} from 'react-native-responsive-screen';

const isTablet = () => {
  const { width, height } = Dimensions.get('window');
  const shorter = Math.min(width, height);
  const aspectRatio = Math.max(width, height) / shorter;
  return shorter >= 600 && aspectRatio < 1.6;
};

export const wp = (width) => {
  return isTablet() ? heightPercentageToDP(width * 0.46) : widthPercentageToDP(width);
};

export const hp = (height) => {
  return heightPercentageToDP(height);
};

export const trunc = (text, length) => {
  if (!text) return '';
  return text.length > length ? `${text.slice(0, length)}...` : text;
};

export const currency = (amount) => {
  const value = Number(amount || 0);
  return `$${value.toFixed(2)}`;
};

export const getInitials = (name) => {
  if (!name) return '?';
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

export const greeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
};
