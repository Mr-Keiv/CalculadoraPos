import React, { createContext, useState, useEffect, useContext } from 'react';
import { ExchangeRate, BcvResponse } from '../types/api';
import axios from 'axios';

interface ExchangeRateContextType {
    rates: ExchangeRate[];
    selectedRate: ExchangeRate | null;
    setSelectedRate: (rate: ExchangeRate) => void;
    isLoading: boolean;
    error: string | null;
    lastUpdate: Date | null;
    refreshRates: () => Promise<void>;
}

const ExchangeRateContext = createContext<ExchangeRateContextType | undefined>(undefined);

export function ExchangeRateProvider({ children }: { children: React.ReactNode }) {
    const [rates, setRates] = useState<ExchangeRate[]>([]);
    const [selectedRate, setSelectedRate] = useState<ExchangeRate | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [lastUpdate, setLastUpdate] = useState<Date | null>(null);


    const fetchRates = async () => {
        setIsLoading(true);
        try {
            // Mocked response for development
            const mockData: BcvResponse = {
                url: "https://www.bcv.org.ve/",
                euro: "162,5325",
                dolar: "139,4016",
                fecha: "21/08/25"
            };

            const euro = parseFloat(mockData.euro.replace(',', '.'));
            const dolar = parseFloat(mockData.dolar.replace(',', '.'));

            const newRates: ExchangeRate[] = [
                { fuente: 'oficial', nombre: 'USD', promedio: dolar },
                { fuente: 'oficial', nombre: 'EURO', promedio: euro }
            ];

            setRates(newRates);
            setLastUpdate(new Date());
            setError(null);

            if (!selectedRate) setSelectedRate(newRates[0]);
        } catch (err) {
            console.log('fetch error:', err);
            setError(err instanceof Error ? err.message : 'Error al cargar las tasas');
        } finally {
            setIsLoading(false);
        }
    };


    useEffect(() => {
        fetchRates();
        // Refresh rates every 5 minutes
        const interval = setInterval(fetchRates, 5 * 60 * 1000);
        return () => clearInterval(interval);
    }, []);

    return (
        <ExchangeRateContext.Provider
            value={{
                rates,
                selectedRate,
                setSelectedRate,
                isLoading,
                error,
                lastUpdate,
                refreshRates: fetchRates
            }}>
            {children}
        </ExchangeRateContext.Provider>
    );
}

export function useExchangeRates() {
    const context = useContext(ExchangeRateContext);
    if (context === undefined) {
        throw new Error('useExchangeRates must be used within an ExchangeRateProvider');
    }
    return context;
}