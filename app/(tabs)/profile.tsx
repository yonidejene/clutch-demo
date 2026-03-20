import React, { useEffect, useState } from 'react';
import {
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import {
  TextField,
  Input,
  Button,
  Spinner,
  useThemeColor,
} from 'heroui-native';
import { useAuth } from '../../src/context/AuthContext';
import { Text } from '../../src/components/Text';
import { useProfileQuery, useUpdateProfileMutation } from '../../src/hooks/useProfile';
import { LoadingButton } from '../../src/components/LoadingButton';
import { FONTS } from '../../src/theme/fonts';
import { INPUT_STYLE } from '../../src/theme/field';
import { RADIUS } from '../../src/theme/radius';

export default function ProfileScreen() {
  const { state, signOut } = useAuth();
  const userId = state.status === 'authenticated' ? state.user.id : undefined;
  const userEmail = state.status === 'authenticated' ? state.user.email ?? '' : '';
  const { data: profile, isLoading, error } = useProfileQuery(userId);
  const updateMutation = useUpdateProfileMutation(userId);

  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [address, setAddress] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{ username?: string }>({});
  const [accentColor, accentFgColor] = useThemeColor(['accent', 'accent-foreground']);
  const backgroundColor = useThemeColor('background');

  useEffect(() => {
    if (!profile) {
      return;
    }

    setUsername(profile.username ?? '');
    setFullName(profile.full_name ?? '');
    setAddress(profile.address ?? '');
  }, [profile]);

  const displayName = profile?.full_name || profile?.username || 'User';
  const initial = displayName[0]?.toUpperCase() ?? '?';

  function validate() {
    const nextErrors: { username?: string } = {};

    if (!username.trim() || username.trim().length < 3) {
      nextErrors.username = 'Username must be at least 3 characters';
    }

    setFieldErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  function handleSave() {
    if (!validate()) return;

    updateMutation.mutate({
      username: username.trim(),
      full_name: fullName.trim() || null,
      address: address.trim() || null,
    });
  }

  function handleLogout() {
    Alert.alert('Log Out', 'Are you sure you want to log out?', [
      { style: 'cancel', text: 'Cancel' },
      { onPress: () => void signOut(), style: 'destructive', text: 'Log Out' },
    ]);
  }

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <Spinner size="lg" />
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 items-center justify-center px-5 bg-background">
        <Text className="text-danger text-center mb-6">
          Failed to load profile: {error.message}
        </Text>
        <Button
          variant="outline"
          onPress={handleLogout}
          className="border-muted"
          style={{ borderRadius: RADIUS.md }}
        >
          <Button.Label className="text-foreground" style={FONTS.heading}>Log out</Button.Label>
        </Button>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1, backgroundColor }}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView
          contentContainerClassName="flex-grow"
          keyboardShouldPersistTaps="handled"
          style={{ backgroundColor }}
          className="px-5"
        >
          {/* Avatar */}
          <View className="items-center mt-10 mb-6">
            <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: accentColor, alignItems: 'center', justifyContent: 'center' }}>
              <Text variant="heading" style={{ fontSize: 28, color: accentFgColor }}>{initial}</Text>
            </View>
            <Text
              variant="heading"
              style={{ fontSize: 18 }}
              className="text-foreground mt-2"
            >
              {displayName}
            </Text>
            <Text
              style={{ fontSize: 16 }}
              className="text-muted mt-0.5"
            >
              {userEmail}
            </Text>
          </View>

          <TextField
            isInvalid={!!fieldErrors.username}
            isDisabled={updateMutation.isPending}
            className="mb-3"
          >
            <Input
              className="shadow-none"
              style={INPUT_STYLE}
              value={username}
              onChangeText={(text) => {
                setUsername(text);
                if (fieldErrors.username)
                  setFieldErrors((e) => ({ ...e, username: undefined }));
              }}
              placeholder="Username"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </TextField>

          <TextField isDisabled={updateMutation.isPending} className="mb-3">
            <Input
              className="shadow-none"
              style={INPUT_STYLE}
              value={fullName}
              onChangeText={setFullName}
              placeholder="Full name"
              autoCapitalize="words"
            />
          </TextField>

          <TextField isDisabled={updateMutation.isPending} className="mb-5">
            <Input
              className="shadow-none"
              style={INPUT_STYLE}
              value={address}
              onChangeText={setAddress}
              placeholder="Address"
              autoCapitalize="sentences"
            />
          </TextField>

          <LoadingButton
            loading={updateMutation.isPending}
            label="Save"
            onPress={handleSave}
          />

          <Button
            variant="outline"
            onPress={handleLogout}
            className="mb-8 border-muted"
            style={{ borderRadius: RADIUS.md }}
          >
            <Button.Label className="text-foreground" style={FONTS.heading}>Log out</Button.Label>
          </Button>
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}
