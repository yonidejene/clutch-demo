import { ImageSourcePropType } from 'react-native';
import { CountryCode } from '../components/FlagIcon';

export interface CarouselCard {
  id: string;
  image: ImageSourcePropType;
  country: CountryCode;
  city: string;
}

export const LOGIN_CAROUSEL: CarouselCard[] = [
  { id: '1', image: require('../../assets/images/carousel-1.jpg'), country: 'US', city: 'Miami' },
  { id: '2', image: require('../../assets/images/carousel-2.jpg'), country: 'ES', city: 'Barcelona' },
  { id: '3', image: require('../../assets/images/carousel-3.jpg'), country: 'AE', city: 'Dubai' },
  { id: '4', image: require('../../assets/images/carousel-4.jpg'), country: 'AR', city: 'Buenos Aires' },
  { id: '5', image: require('../../assets/images/carousel-5.jpg'), country: 'SE', city: 'Stockholm' },
  { id: '6', image: require('../../assets/images/carousel-6.jpg'), country: 'PT', city: 'Lisbon' },
  { id: '7', image: require('../../assets/images/carousel-7.jpg'), country: 'US', city: 'New York' },
];
