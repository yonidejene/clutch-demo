import React, { useEffect, useState } from 'react';
import {
  ScrollView,
  View,
  Image,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  Easing,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  TextField,
  Input,
  Chip,
  useToast,
  useThemeColor,
} from 'heroui-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../src/lib/supabase';
import { useAuth } from '../../src/context/AuthContext';
import { LoadingButton } from '../../src/components/LoadingButton';
import { ClutchLogo } from '../../src/components/ClutchLogo';
import { Text } from '../../src/components/Text';
import { INPUT_STYLE } from '../../src/theme/field';
import { LOGIN_CAROUSEL, CarouselCard } from '../../src/data/carousel';
import { FlagIcon } from '../../src/components/FlagIcon';

const CARD_WIDTH = 200;
const CARD_HEIGHT = 280;
const CARD_GAP = 14;
const SET_WIDTH = LOGIN_CAROUSEL.length * (CARD_WIDTH + CARD_GAP);
const SCROLL_DURATION = 30000;

function CarouselCardItem({ item }: { item: CarouselCard }) {
  return (
    <View style={{ width: CARD_WIDTH + 2, height: CARD_HEIGHT + 2, borderRadius: 5, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' }}>
      <View style={{ flex: 1, borderRadius: 4, overflow: 'hidden' }}>
      <Image
        source={item.image}
        style={{ position: 'absolute', width: '100%', height: '100%' }}
        resizeMode="cover"
      />
      {/* City chip */}
      <View className="absolute bottom-3 left-3">
        <Chip size="sm" variant="primary" className="bg-white/80">
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <FlagIcon country={item.country} size={13} />
              <Text style={{ fontSize: 12, color: '#111111', fontWeight: '600' }}>{item.city}</Text>
            </View>
          </Chip>
      </View>
      </View>
    </View>
  );
}

function AutoCarousel() {
  const translateX = useSharedValue(0);

  useEffect(() => {
    translateX.value = withRepeat(
      withTiming(-SET_WIDTH, { duration: SCROLL_DURATION, easing: Easing.linear }),
      -1,
      false,
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    flexDirection: 'row' as const,
    gap: CARD_GAP,
    transform: [{ translateX: translateX.value }],
  }));

  const doubled = [...LOGIN_CAROUSEL, ...LOGIN_CAROUSEL];

  return (
    <View style={{ overflow: 'hidden' }} pointerEvents="none">
      <Animated.View style={[animatedStyle, { paddingLeft: 20 }]}>
        {doubled.map((item, index) => (
          <CarouselCardItem key={`${item.id}-${index}`} item={item} />
        ))}
      </Animated.View>
    </View>
  );
}

function generateUsername(email: string): string {
  return `${email.split('@')[0]}_${Math.random().toString(36).slice(2, 8)}`;
}

export default function LoginScreen() {
  const { setHoldRedirect } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const dangerColor = useThemeColor('danger');
  const backgroundColor = useThemeColor('background');
  const [errors, setErrors] = useState<{ email?: string; password?: string }>(
    {},
  );

  useEffect(() => {
    return () => setHoldRedirect(false);
  }, [setHoldRedirect]);

  function validate() {
    const next: { email?: string; password?: string } = {};
    if (!email.trim()) next.email = 'Email is required';
    else if (!email.includes('@')) next.email = 'Enter a valid email';
    if (!password || password.length < 6)
      next.password = 'Password must be at least 6 characters';
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function showError(label: string, description: string) {
    toast.show({
      label,
      description,
      variant: 'danger',
      icon: <Ionicons name="alert-circle" size={22} color={dangerColor} />,
    });
  }

  async function handleContinue() {
    if (!validate()) return;

    setLoading(true);
    const trimmedEmail = email.trim();

    // Try login first
    const { error: loginError } = await supabase.auth.signInWithPassword({
      email: trimmedEmail,
      password,
    });

    if (!loginError) {
      setLoading(false);
      return; // Auth listener handles redirect
    }

    // If credentials don't match, try creating a new account
    if (loginError.message === 'Invalid login credentials') {
      setHoldRedirect(true);

      const { data, error: signUpError } = await supabase.auth.signUp({
        email: trimmedEmail,
        password,
      });

      if (signUpError) {
        setLoading(false);
        setHoldRedirect(false);
        showError('Sign up failed', signUpError.message);
        return;
      }

      const userId = data.user?.id;
      if (!userId) {
        setLoading(false);
        setHoldRedirect(false);
        showError('Sign up failed', 'No user ID returned');
        return;
      }

      const { error: profileError } = await supabase
        .from('profiles')
        .insert({ id: userId, username: generateUsername(trimmedEmail) });

      setLoading(false);

      if (profileError) {
        showError('Profile setup failed', profileError.message);
        setHoldRedirect(false);
        return;
      }

      setHoldRedirect(false);
      return;
    }

    // Some other login error (network, etc.)
    setLoading(false);
    showError('Login failed', loginError.message);
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor }}>
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
          showsVerticalScrollIndicator={false}
        >
            {/* Logo — pinned near top */}
            <View className="px-5 pt-6 pb-2">
              <ClutchLogo width={120} height={22} />
            </View>

            {/* Form — centered in remaining space */}
            <View style={{ flex: 1, justifyContent: 'center' }} className="px-5">
              <Text variant="heading" style={{ fontSize: 28 }} className="text-foreground">
                Game on
              </Text>
              <Text style={{ fontSize: 16 }} className="text-muted mt-1 mb-3">
                Relive your best moments from the court
              </Text>

              <TextField
                isInvalid={!!errors.email}
                isDisabled={loading}
                className="mb-3"
              >
                <Input
                  className="shadow-none"
                  style={INPUT_STYLE}
                  value={email}
                  onChangeText={(text) => {
                    setEmail(text);
                    if (errors.email)
                      setErrors((e) => ({ ...e, email: undefined }));
                  }}
                  placeholder="Email"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </TextField>

              <TextField
                isInvalid={!!errors.password}
                isDisabled={loading}
                className="mb-5"
              >
                <Input
                  className="shadow-none"
                  style={INPUT_STYLE}
                  value={password}
                  onChangeText={(text) => {
                    setPassword(text);
                    if (errors.password)
                      setErrors((e) => ({ ...e, password: undefined }));
                  }}
                  placeholder="Password"
                  secureTextEntry
                />
              </TextField>

              <LoadingButton
                loading={loading}
                label="Get Started"
                onPress={handleContinue}
              />
            </View>

            {/* Carousel — pinned near bottom */}
            <View className="pt-2 pb-6">
              <AutoCarousel />
            </View>
        </ScrollView>
    </SafeAreaView>
  );
}
