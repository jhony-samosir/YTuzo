import { Stack } from 'expo-router';

export default function EnglishLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="dictionary" />
    </Stack>
  );
}
