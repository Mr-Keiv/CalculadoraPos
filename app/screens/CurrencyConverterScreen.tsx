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

// Detectar si es pantalla cuadrada 480x480
const isSquareScreen = width === 480 && height === 480;

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

            // Cerrar el portal primero
            setIsPortalVisible(false);

            // Determinar si la transacción fue exitosa
            // Puedes ajustar esta lógica según lo que devuelva tu CardReader
            const isSuccess = result && (
                (result as any).success === true ||
               (result as any).status === 'success' ||
               (result as any).responseCode === '00' ||
                typeof result === 'string' && result.toLowerCase().includes('exitosa')
            );

            // Mostrar modal de resultado
            setTransactionSuccess(isSuccess);
            setTransactionModalVisible(true);

            // Si fue exitoso, resetear el monto
            if (isSuccess) {
                setAmount('1');
            }

        } catch (error) {
            console.error('Error en el pago:', error);

            // Cerrar portal y mostrar modal de error
            setIsPortalVisible(false);
            setTransactionSuccess(false);
            setTransactionModalVisible(true);

        }
    };

    // cada vez que cambia la moneda actualizo el selectedRate
    const toggleCurrency = () => {
        const newCurrency = currency === 'USD' ? 'EUR' : 'USD';
        setCurrency(newCurrency);

        const found = rates.find(r => r.nombre.toUpperCase().includes(newCurrency));
        if (found) {
            setSelectedRate(found); // aquí guardas toda la info del rate seleccionado
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
                                    {lastUpdate?.toLocaleDateString()}
                                </Text>
                            </View>
                        </View>
                        <View>

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
                                onChangeText={setAmount}
                                placeholder="0.00"
                                placeholderTextColor="rgba(255,255,255,0.6)"
                                keyboardType="numeric"
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
                        <TouchableOpacity style={[styles.simpleBtn, styles.convertBtn]} onPress={() => { setIsPortalVisible(true) }}>
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
        paddingVertical: isSquareScreen ? 8 : 10 
    },
    card: {
        width: isSquareScreen ? width * 0.92 : width * 3, // 442px en 480x480
        maxWidth: isSquareScreen ? 442 : 400,
        borderRadius: isSquareScreen ? 25 : 30,
        padding: isSquareScreen ? 18 : 24,
        position: 'relative',
        minHeight: isSquareScreen ? height * 0.88 : height * 0.85, // 422px en 480x480
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.2,
        shadowRadius: 20,
        elevation: 10,
        marginVertical: isSquareScreen ? 8 : 10,
        backgroundColor: '#0f065a',
    },
    header: { 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: isSquareScreen ? 20 : 30, 
        zIndex: 10 
    },
    headerLeft: { 
        flexDirection: 'row', 
        alignItems: 'center' 
    },
    logoContainer: { 
        width: isSquareScreen ? 45 : 55, 
        height: isSquareScreen ? 45 : 55, 
        borderRadius: isSquareScreen ? 12 : 15, 
        backgroundColor: 'rgba(255,255,255,0.9)', 
        justifyContent: 'center', 
        alignItems: 'center', 
        marginRight: isSquareScreen ? 10 : 12 
    },
    logo: { 
        width: isSquareScreen ? 40 : 50, 
        height: isSquareScreen ? 40 : 50, 
        justifyContent: 'center', 
        alignItems: 'center' 
    },
    appName: { 
        fontSize: isSquareScreen ? 16 : 18, 
        fontWeight: '700', 
        color: 'white' 
    },
    appSubtitle: { 
        fontSize: isSquareScreen ? 11 : 12, 
        color: 'rgba(255,255,255,0.7)', 
        marginTop: 2 
    },
    dateText: {
        fontSize: isSquareScreen ? 7 : 8
    },
    whiteText: { 
        color: 'white' 
    },
    whiteSubtitle: { 
        color: 'rgba(255,255,255,0.7)' 
    },
    amountContainer: { 
        marginBottom: isSquareScreen ? 20 : 30, 
        zIndex: 10 
    },
    inputLabel: { 
        fontSize: isSquareScreen ? 13 : 14, 
        color: 'rgba(255,255,255,0.7)', 
        marginBottom: isSquareScreen ? 8 : 10, 
        fontWeight: '500' 
    },
    inputWrapper: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        backgroundColor: 'rgba(255,255,255,0.15)', 
        borderRadius: isSquareScreen ? 18 : 20, 
        paddingHorizontal: isSquareScreen ? 12 : 15, 
        paddingVertical: 5 
    },
    currencySymbol: { 
        fontSize: isSquareScreen ? 20 : 24, 
        fontWeight: 'bold', 
        color: 'white', 
        marginRight: isSquareScreen ? 8 : 10 
    },
    amountInput: { 
        flex: 1, 
        fontSize: isSquareScreen ? 20 : 24, 
        fontWeight: 'bold', 
        color: 'white', 
        paddingVertical: isSquareScreen ? 10 : 12, 
        minHeight: isSquareScreen ? 42 : 50 
    },
    whiteTextInput: { 
        color: 'white' 
    },
    switchSection: { 
        marginBottom: isSquareScreen ? 18 : 25, 
        zIndex: 10, 
        alignItems: 'center' 
    },
    conversionContainer: { 
        alignItems: 'center', 
        marginBottom: isSquareScreen ? 20 : 30, 
        zIndex: 10 
    },
    conversionLabel: { 
        fontSize: isSquareScreen ? 14 : 16, 
        color: 'rgba(255,255,255,0.7)', 
        marginBottom: isSquareScreen ? 8 : 10, 
        textAlign: 'center', 
        fontWeight: '500' 
    },
    conversionAmount: { 
        fontSize: isSquareScreen ? 24 : 28, 
        fontWeight: 'bold', 
        color: 'white', 
        textAlign: 'center' 
    },
    rateInfo: {
        color: 'rgba(255,255,255,0.6)', 
        marginTop: 5, 
        fontSize: isSquareScreen ? 10 : 12,
        textAlign: 'center'
    },
    actionButtons: { 
        flexDirection: 'row', 
        gap: isSquareScreen ? 10 : 12, 
        zIndex: 10 
    },
    simpleBtn: { 
        flex: 1, 
        paddingVertical: isSquareScreen ? 12 : 14, 
        borderRadius: isSquareScreen ? 22 : 25, 
        backgroundColor: 'rgba(255, 255, 255, 0.15)', 
        justifyContent: 'center', 
        alignItems: 'center' 
    },
    simpleBtnText: { 
        fontSize: isSquareScreen ? 14 : 16, 
        fontWeight: '600', 
        color: 'white' 
    },
    convertBtn: { 
        backgroundColor: 'white' 
    },
    convertBtnText: { 
        color: '#0f065a' 
    },
});