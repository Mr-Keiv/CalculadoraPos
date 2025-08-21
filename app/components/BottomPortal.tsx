import React, { useRef, useEffect, useState } from 'react';
import {
    Animated,
    Dimensions,
    StyleSheet,
    Text,
    View,
    TouchableWithoutFeedback,
    PanResponder,
    TextInput,
    TouchableOpacity,
    Alert,
} from 'react-native';

const { height } = Dimensions.get('window');

interface BottomPortalProps {
    visible: boolean;
    onClose: () => void;
    montoBs: number; // monto con decimales
    onConfirm: (cedula: string, monto: number) => void; // enviamos monto como entero
}

export const BottomPortal: React.FC<BottomPortalProps> = ({
    visible,
    onClose,
    montoBs,
    onConfirm
}) => {
    const portalAnim = useRef(new Animated.Value(height)).current;
    const portalOpacity = useRef(new Animated.Value(0)).current;
    const panY = useRef(new Animated.Value(0)).current;
    const [cedula, setCedula] = useState('');

    useEffect(() => {
        if (visible) {
            setCedula('');
            portalOpacity.setValue(0);
            panY.setValue(0);
            Animated.parallel([
                Animated.spring(portalAnim, {
                    toValue: height * 0.3,
                    useNativeDriver: false,
                    bounciness: 12,
                    speed: 12,
                }),
                Animated.timing(portalOpacity, {
                    toValue: 1,
                    duration: 300,
                    useNativeDriver: false,
                }),
            ]).start();
        } else {
            Animated.parallel([
                Animated.timing(portalAnim, {
                    toValue: height,
                    duration: 250,
                    useNativeDriver: false,
                }),
                Animated.timing(portalOpacity, {
                    toValue: 0,
                    duration: 200,
                    useNativeDriver: false,
                }),
            ]).start();
        }
    }, [visible]);

    const closePortal = () => onClose();

    const panResponder = useRef(
        PanResponder.create({
            onMoveShouldSetPanResponder: (_, gestureState) => gestureState.dy > 5,
            onPanResponderMove: (_, gestureState) => {
                if (gestureState.dy > 0) panY.setValue(gestureState.dy);
            },
            onPanResponderRelease: (_, gestureState) => {
                if (gestureState.dy > 120) closePortal();
                else
                    Animated.spring(panY, {
                        toValue: 0,
                        useNativeDriver: false,
                        bounciness: 10,
                    }).start();
            },
        })
    ).current;

    const portalTranslateY = Animated.add(portalAnim, panY);

    const handleCedulaChange = (text: string) => {
        // Solo números, máximo 10
        const numeric = text.replace(/[^0-9]/g, '');
        if (numeric.length <= 10) setCedula(numeric);
    };

    const handleConfirm = () => {
        if (cedula.length < 7 || cedula.length > 10) {
            Alert.alert("Error", "La cédula debe tener entre 7 y 10 dígitos");
            return;
        }

        // Validar monto con 2 decimales exactos
        const montoFixed = montoBs.toFixed(2); // asegura 2 decimales
        const montoEntero = Math.round(parseFloat(montoFixed) * 100); // convertir a entero

        onConfirm(cedula, montoEntero);
    };

    if (!visible) return null;

    return (
        <TouchableWithoutFeedback onPress={closePortal}>
            <View style={styles.portalOverlay}>
                <Animated.View
                    {...panResponder.panHandlers}
                    style={[styles.portalContent, { top: portalTranslateY, opacity: portalOpacity }]}
                >
                    <Text style={styles.modalTitle}>Datos de Pago</Text>

                    <Text style={styles.modalLabel}>Monto a Pagar (Bs)</Text>
                    <View style={styles.modalMonto}>
                        <Text style={styles.modalMontoText}>
                            {montoBs.toFixed(2).replace('.', ',')}
                        </Text>
                    </View>

                    <Text style={styles.modalLabel}>Cédula del Pagador</Text>
                    <TextInput
                        style={styles.modalInput}
                        value={cedula}
                        onChangeText={handleCedulaChange}
                        placeholder="Ej: 12345678"
                        keyboardType="numeric"
                        maxLength={10}
                        placeholderTextColor="rgba(0,0,0,0.3)"
                    />

                    <TouchableOpacity style={styles.modalBtn} onPress={handleConfirm}>
                        <Text style={styles.modalBtnText}>Confirmar</Text>
                    </TouchableOpacity>
                </Animated.View>
            </View>
        </TouchableWithoutFeedback>
    );
};

const styles = StyleSheet.create({
    portalOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.4)' },
    portalContent: { position: 'absolute', left: 0, width: '100%', height: height * 0.7, backgroundColor: 'white', borderTopLeftRadius: 25, borderTopRightRadius: 25, padding: 20 },
    modalTitle: { fontSize: 18, fontWeight: '700', marginBottom: 15 },
    modalLabel: { fontSize: 14, fontWeight: '500', marginTop: 10, marginBottom: 5 },
    modalInput: { borderWidth: 1, borderColor: 'rgba(0,0,0,0.2)', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8 },
    modalMonto: { borderWidth: 1, borderColor: 'rgba(0,0,0,0.2)', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, backgroundColor: '#f9f9f9' },
    modalMontoText: { fontSize: 16, fontWeight: '600' },
    modalBtn: { marginTop: 20, backgroundColor: '#0f065a', paddingVertical: 12, borderRadius: 25, alignItems: 'center' },
    modalBtnText: { color: 'white', fontWeight: '600', fontSize: 16 },
});
