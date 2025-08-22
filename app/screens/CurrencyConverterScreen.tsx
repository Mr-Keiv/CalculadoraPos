import React, { useState, useRef, useEffect } from 'react';
import {
    StyleSheet,
    Text,
    View,
    TouchableOpacity,
    Dimensions,
    TextInput,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    Image,
    Alert,
} from 'react-native';
import { CurrencyToggle } from '../components/CurrencyTogle';
import { BottomPortal } from '../components/BottomPortal';
import { useExchangeRates } from '../context/ExchangeBcvRate';
import CardReader from '../hook/CardReader';
import TransactionResultModal from '../components/TransactionModal';

const { width, height } = Dimensions.get('window');
const isSquareScreen = width === 480 && height === 432;

type Currency = 'USD' | 'EUR';

export default function CurrencyConverterScreen() {
    const [currency, setCurrency] = useState<Currency>('USD');
    const [amount, setAmount] = useState('1');
    const [isPortalVisible, setIsPortalVisible] = useState(false);
    const [transactionModalVisible, setTransactionModalVisible] = useState(false);
    const [transactionSuccess, setTransactionSuccess] = useState(false);

    const { selectedRate, setSelectedRate, rates, refreshRates, lastUpdate } = useExchangeRates();
    const amountInputRef = useRef<TextInput>(null);

    useEffect(() => {
        refreshRates();
    }, []);

    const handlePaymentConfirm = async (cedula: string, amount: number) => {
        const paymentData = {
            amount: amount,
            referenceNo: `REF-${Date.now()}`,
            documentNumber: cedula,
            waiterNum: '1',
            transType: 1
        };

        try {
            const result = await CardReader.processPayment(paymentData);

            setIsPortalVisible(false);

            const isSuccess = result && (
                (result as any).success === true ||
                (result as any).status === 'success' ||
                (result as any).responseCode === '00' ||
                (typeof result === 'string' && result.toLowerCase().includes('exitosa'))
            );

            setTransactionSuccess(isSuccess);
            setTransactionModalVisible(true);

            if (isSuccess) {
                setAmount('1');
            }

        } catch (error) {
            console.error('Error en el pago:', error);
            setIsPortalVisible(false);
            setTransactionSuccess(false);
            setTransactionModalVisible(true);
        }
    };

    const toggleCurrency = () => {
        const newCurrency = currency === 'USD' ? 'EUR' : 'USD';
        setCurrency(newCurrency);

        const found = rates.find(r => r.nombre.toUpperCase().includes(newCurrency));
        if (found) {
            setSelectedRate(found);
        }
    };

    const calculateConversion = () => {
        const numAmount = parseFloat(amount) || 0;
        const exchangeRate = selectedRate?.promedio || 0;
        const bolivares = numAmount * exchangeRate;

        return {
            bolivares,
            currencySymbol: currency === 'USD' ? '$' : '€',
            exchangeRate,
        };
    };

    const results = calculateConversion();
    const focusAmountInput = () => amountInputRef.current?.focus();

    return (
        <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
                <View style={styles.card}>
                    {/* Header */}
                    <View style={styles.header}>
                        <View style={styles.headerLeft}>
                            <View style={styles.logoContainer}>
                                <Image source={require('../../assets/logo.png')} style={styles.logo} />
                            </View>
                            <View>
                                <Text style={[styles.appName, styles.whiteText]}>Calculadora</Text>
                                <Text style={[styles.appSubtitle, styles.whiteSubtitle]}>Conversor de divisas</Text>
                                <Text style={[styles.appSubtitle, styles.whiteSubtitle, styles.dateText]} numberOfLines={2}>
                                    {lastUpdate?.toLocaleString('es-ES', {
                                        month: 'long',
                                        year: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit',
                                        second: '2-digit'
                                    })}
                                </Text>
                            </View>
                        </View>
                    </View>

                    {/* Currency Toggle */}
                    <View style={styles.switchSection}>
                        <CurrencyToggle
                            value={currency === 'EUR'}
                            onValueChange={toggleCurrency}
                            leftLabel={{
                                text: 'USD',
                                rate: `${rates.find(r => r.nombre.toUpperCase().includes('USD'))?.promedio ?? '--'} VES`
                            }}
                            rightLabel={{
                                text: 'EUR',
                                rate: `${rates.find(r => r.nombre.toUpperCase().includes('EURO'))?.promedio ?? '--'} VES`
                            }}
                        />
                    </View>

                    {/* Amount Input */}
                    <TouchableOpacity style={styles.amountContainer} activeOpacity={1} onPress={focusAmountInput}>
                        <Text style={[styles.inputLabel, styles.whiteText]}>Monto a convertir</Text>
                        <View style={styles.inputWrapper}>
                            <Text style={[styles.currencySymbol, styles.whiteText]}>{results.currencySymbol}</Text>
                            <TextInput
                                ref={amountInputRef}
                                style={[styles.amountInput, styles.whiteTextInput]}
                                value={amount}
                                onChangeText={(text) => {
                                    // Only allow numbers and up to 2 decimal places
                                    const regex = /^\d*\.?\d{0,2}$/;
                                    if (regex.test(text)) {
                                        const numValue = parseFloat(text);
                                        // Prevent negative numbers and zero
                                        if (!text || (numValue > 0)) {
                                            setAmount(text);
                                        }
                                    }
                                }}
                                placeholder="0.00"
                                placeholderTextColor="rgba(255,255,255,0.6)"
                                keyboardType="decimal-pad"
                                returnKeyType="done"
                            />
                        </View>
                    </TouchableOpacity>

                    {/* Bolivares Conversion */}
                    <View style={styles.conversionContainer}>
                        <Text style={[styles.conversionLabel, styles.whiteText]}>Equivalente en Bolívares</Text>
                        <Text style={[styles.conversionAmount, styles.whiteText]}>
                            Bs. {results.bolivares.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </Text>
                        {selectedRate && (
                            <Text style={styles.rateInfo}>
                                Tasa usada: {selectedRate.promedio} VES ({selectedRate.nombre})
                            </Text>
                        )}
                    </View>

                    {/* Action Buttons */}
                    <View style={styles.actionButtons}>
                        <TouchableOpacity style={[styles.simpleBtn, styles.convertBtn]} onPress={() => setIsPortalVisible(true)}>
                            <Text style={[styles.simpleBtnText, styles.convertBtnText]}>Pagar</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                <BottomPortal
                    visible={isPortalVisible}
                    onClose={() => setIsPortalVisible(false)}
                    onConfirm={handlePaymentConfirm}
                    montoBs={Number(results.bolivares.toFixed(2))}
                />
                <TransactionResultModal
                    visible={transactionModalVisible}
                    isSuccess={transactionSuccess}
                    onClose={() => setTransactionModalVisible(false)}
                    successMessage="¡Transacción Exitosa!"
                    errorMessage="Transacción Fallida"
                />
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { 
        flex: 1, 
        backgroundColor: '#0a043c' 
    },
    scrollContainer: { 
        flexGrow: 1, 
        justifyContent: 'center', 
        alignItems: 'center', 
        paddingVertical: isSquareScreen ? 6 : 8 
    },
    card: {
        width: isSquareScreen ? width * 0.9 : width * 0.95,
        maxWidth: isSquareScreen ? 430 : 380,
        borderRadius: isSquareScreen ? 22 : 25,
        padding: isSquareScreen ? 16 : 20,
        position: 'relative',
        minHeight: isSquareScreen ? height * 0.85 : height * 0.82,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.18,
        shadowRadius: 18,
        elevation: 8,
        marginVertical: isSquareScreen ? 6 : 8,
        backgroundColor: '#0f065a',
    },
    header: { 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: isSquareScreen ? 16 : 24, 
        zIndex: 10 
    },
    headerLeft: { 
        flexDirection: 'row', 
        alignItems: 'center' 
    },
    logoContainer: { 
        width: isSquareScreen ? 42 : 50, 
        height: isSquareScreen ? 42 : 50, 
        borderRadius: isSquareScreen ? 10 : 14, 
        backgroundColor: 'rgba(255,255,255,0.9)', 
        justifyContent: 'center', 
        alignItems: 'center', 
        marginRight: isSquareScreen ? 8 : 10 
    },
    logo: { 
        width: isSquareScreen ? 38 : 46, 
        height: isSquareScreen ? 38 : 46
    },
    appName: { 
        fontSize: isSquareScreen ? 15 : 16, 
        fontWeight: '700' 
    },
    appSubtitle: { 
        fontSize: isSquareScreen ? 10 : 11, 
        marginTop: 2 
    },
    dateText: {
        fontSize: isSquareScreen ? 8 : 9
    },
    whiteText: { color: 'white' },
    whiteSubtitle: { color: 'rgba(255,255,255,0.7)' },
    amountContainer: { marginBottom: isSquareScreen ? 18 : 28, zIndex: 10 },
    inputLabel: { 
        fontSize: isSquareScreen ? 12 : 13, 
        marginBottom: isSquareScreen ? 6 : 8, 
        fontWeight: '500' 
    },
    inputWrapper: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        backgroundColor: 'rgba(255,255,255,0.15)', 
        borderRadius: isSquareScreen ? 16 : 18, 
        paddingHorizontal: isSquareScreen ? 10 : 12, 
        paddingVertical: 4 
    },
    currencySymbol: { 
        fontSize: isSquareScreen ? 18 : 22, 
        fontWeight: 'bold', 
        marginRight: isSquareScreen ? 6 : 8 
    },
    amountInput: { 
        flex: 1, 
        fontSize: isSquareScreen ? 18 : 22, 
        fontWeight: 'bold', 
        paddingVertical: isSquareScreen ? 8 : 10, 
        minHeight: isSquareScreen ? 38 : 46 
    },
    whiteTextInput: { color: 'white' },
    switchSection: { marginBottom: isSquareScreen ? 14 : 20, zIndex: 10, alignItems: 'center' },
    conversionContainer: { alignItems: 'center', marginBottom: isSquareScreen ? 18 : 28, zIndex: 10 },
    conversionLabel: { fontSize: isSquareScreen ? 13 : 14, marginBottom: isSquareScreen ? 6 : 8, textAlign: 'center', fontWeight: '500' },
    conversionAmount: { fontSize: isSquareScreen ? 22 : 26, fontWeight: 'bold', textAlign: 'center' },
    rateInfo: { marginTop: 4, fontSize: isSquareScreen ? 9 : 11, textAlign: 'center', color: 'rgba(255,255,255,0.6)' },
    actionButtons: { flexDirection: 'row', gap: isSquareScreen ? 8 : 10, zIndex: 10 },
    simpleBtn: { flex: 1, paddingVertical: isSquareScreen ? 10 : 12, borderRadius: isSquareScreen ? 20 : 22, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center' },
    simpleBtnText: { fontSize: isSquareScreen ? 13 : 14, fontWeight: '600', color: 'white' },
    convertBtn: { backgroundColor: 'white' },
    convertBtnText: { color: '#0f065a' },
});
