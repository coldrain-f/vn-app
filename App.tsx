// Main App Entry Point - VN;READER
import 'react-native-gesture-handler';
import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, StatusBar, Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as Font from 'expo-font';
import * as NavigationBar from 'expo-navigation-bar';

import { useAppStore } from './src/store/useAppStore';
import { getTheme } from './src/theme';
import { ReaderScreen } from './src/screens/ReaderScreen';
import { ManagerScreen } from './src/screens/ManagerScreen';
import { loadKanjiData } from './src/utils/kanjiData';

// Import kanji data
import kanjiDataJson from './assets/resources/kanji-data.json';

const Stack = createStackNavigator();

// Set Android navigation bar color immediately on app start
if (Platform.OS === 'android') {
  NavigationBar.setBackgroundColorAsync('#0a0a0a');
  NavigationBar.setButtonStyleAsync('light');
}

function LoadingScreen() {
  const { settings, loadingProgress } = useAppStore();
  const theme = getTheme(settings.theme);

  return (
    <View style={[styles.loadingContainer, { backgroundColor: theme.colors.darker }]}>
      <Text style={[styles.loadingLogo, { color: theme.colors.primary }]}>
        VN<Text style={{ color: theme.colors.accent }}>;</Text>READER
      </Text>
      <ActivityIndicator size="large" color={theme.colors.primary} style={styles.loader} />

      {/* Progress Bar */}
      <View style={{
        width: 240,
        height: 6,
        backgroundColor: `${theme.colors.textDim}30`,
        borderRadius: 3,
        marginTop: 24,
        overflow: 'hidden'
      }}>
        <View style={{
          width: `${Math.max(0, Math.min(100, loadingProgress))}%`,
          height: '100%',
          backgroundColor: theme.colors.accent
        }} />
      </View>

      <Text style={[styles.loadingText, { color: theme.colors.textDim }]}>
        {loadingProgress > 0 ? `Loading data... ${loadingProgress}%` : 'Loading...'}
      </Text>
    </View>
  );
}

export default function App() {
  const { isLoading, loadData, settings } = useAppStore();
  const theme = getTheme(settings.theme);
  const [fontsLoaded, setFontsLoaded] = useState(false);

  useEffect(() => {
    async function loadFonts() {
      try {
        await Font.loadAsync({
          'YuMincho': require('./assets/fonts/yumin.ttf'),
          'Pretendard': require('./assets/fonts/Pretendard-Regular.ttf'),
          'Pretendard-Medium': require('./assets/fonts/Pretendard-Medium.ttf'),
          'Pretendard-Bold': require('./assets/fonts/Pretendard-Bold.ttf'),
        });
        console.log('Fonts loaded successfully');
        setFontsLoaded(true);
      } catch (error) {
        console.error('Error loading fonts:', error);
        setFontsLoaded(true); // Continue anyway with system fonts
      }
    }

    // Load kanji data
    loadKanjiData(kanjiDataJson);

    loadFonts();
    loadData();
  }, []);

  if (isLoading || !fontsLoaded) {
    return (
      <SafeAreaProvider>
        <StatusBar barStyle="light-content" backgroundColor={theme.colors.darker} />
        <LoadingScreen />
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.darker} />
      <NavigationContainer>
        <Stack.Navigator
          screenOptions={{
            headerShown: false,
            cardStyle: { backgroundColor: theme.colors.darker },
          }}
        >
          <Stack.Screen name="Reader" component={ReaderScreen} />
          <Stack.Screen name="Manager" component={ManagerScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingLogo: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  loader: {
    marginTop: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
  },
});
