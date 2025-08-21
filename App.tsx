import React from 'react';
import { StatusBar, View, Text } from 'react-native';
import CurrencyConverterScreen from './app/screens/CurrencyConverterScreen';
import { ExchangeRateProvider } from './app/context/ExchangeBcvRate';

export default function App() {
  return (
    <ExchangeRateProvider>
      <StatusBar barStyle="light-content" />
      <CurrencyConverterScreen />
    </ExchangeRateProvider>
  );
}