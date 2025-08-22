package com.keivrp.dischange;

import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.ServiceConnection;
import android.os.Handler;
import android.os.IBinder;
import android.os.Looper;
import android.util.Log;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.ReadableMapKeySetIterator;
import com.facebook.react.bridge.ReadableType;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.modules.core.DeviceEventManagerModule;
import com.google.gson.Gson;

import org.json.JSONException;
import org.json.JSONObject;

import cn.nexgo.smartconnect.ISmartconnectService;
import cn.nexgo.smartconnect.listener.ITransactionResultListener;
import cn.nexgo.smartconnect.model.TransactionRequestEntity;
import cn.nexgo.smartconnect.model.TransactionResultEntity;

import java.util.Objects;

public class CardReaderModule extends ReactContextBaseJavaModule {
    private static final String TAG = "CardReaderModule";
    private ISmartconnectService iSmartconnectService;
    private boolean isServiceBound = false;
    private final Handler mainHandler = new Handler(Looper.getMainLooper());

    public CardReaderModule(ReactApplicationContext reactContext) {
        super(reactContext);
        Log.d(TAG, "Iniciando módulo de lector de tarjetas Nexgo...");
        bindSmartconnectService();
    }

    @Override
    public String getName() {
        return "CardReaderModule";
    }

    private void bindSmartconnectService() {
        try {
            Log.d(TAG, "Iniciando vinculación con servicio Smartconnect...");
            Intent intent = new Intent();
            intent.setComponent(new ComponentName("cn.nexgo.veslc", "cn.nexgo.inbas.smartconnect.SmartConnectService"));
            getReactApplicationContext().bindService(intent, mConnection, Context.BIND_AUTO_CREATE);
        } catch (Exception e) {
            Log.e(TAG, "Error al vincular servicio Smartconnect", e);
            sendEvent("cardReaderError", "Error al vincular servicio: " + e.getMessage());
        }
    }

    private final ServiceConnection mConnection = new ServiceConnection() {
        @Override
        public void onServiceConnected(ComponentName componentName, IBinder iBinder) {
            Log.d(TAG, "Servicio Smartconnect conectado");
            iSmartconnectService = ISmartconnectService.Stub.asInterface(iBinder);
            isServiceBound = true;
            sendEvent("cardReaderStatus", "Servicio conectado exitosamente");
        }

        @Override
        public void onServiceDisconnected(ComponentName componentName) {
            Log.d(TAG, "Servicio Smartconnect desconectado");
            iSmartconnectService = null;
            isServiceBound = false;
            sendEvent("cardReaderStatus", "Servicio desconectado");
        }
    };

    @ReactMethod
    public void isServiceConnected(Promise promise) {
        promise.resolve(isServiceBound);
    }

    @ReactMethod
    public void connectService(final Promise promise) {
        try {
            if (isServiceBound) {
                Log.d(TAG, "El servicio ya está conectado");
                promise.resolve(true);
                return;
            }

            bindSmartconnectService();

            mainHandler.postDelayed(() -> {
                promise.resolve(isServiceBound);
            }, 500); // Pequeño retraso para permitir que la conexión se establezca
        } catch (Exception e) {
            Log.e(TAG, "Error al conectar servicio", e);
            promise.reject("CONNECTION_ERROR", Objects.requireNonNull(e.getMessage()));
        }
    }

    @ReactMethod
    public void doTransaction(ReadableMap transactionDetails, final Promise promise) {
        try {
            if (!isServiceBound || iSmartconnectService == null) {
                Log.e(TAG, "doTransaction llamado pero el servicio no está vinculado");
                promise.reject("SERVICE_NOT_BOUND", "El servicio de Nexgo no está conectado o listo.");
                return;
            }

            String jsonString = convertMapToJson(transactionDetails);
            Log.d(TAG, "doTransaction llamado con: " + jsonString);

            JSONObject json = new JSONObject(jsonString);
            TransactionRequestEntity entity = new TransactionRequestEntity();

            entity.setAmount(json.optString("amount"));
            entity.setCardHolderId(json.optString("documentNumber"));
            entity.setWaiterNumber(json.optString("waiterNum"));
            entity.setReferenceNumber(json.optString("referenceNo"));
            entity.setTransacitonType(json.optInt("transType"));

            Log.d(TAG, "Entidad de transacción creada: " + entity);

            iSmartconnectService.transactionRequest(entity, new ITransactionResultListener.Stub() {
                @Override
                public void onTransactionResult(TransactionResultEntity transactionResultEntity) {
                    Gson gson = new Gson();
                    String jsonResult = gson.toJson(transactionResultEntity);
                    int resultCode = transactionResultEntity.getResult();
                    int errorCode = transactionResultEntity.getErrorCode();
                    String responseMsg = transactionResultEntity.getResponseMessage();

                    Log.i(TAG, "Resultado transacción: " + jsonResult);

                    if (resultCode == 0) {
                        WritableMap resultMap = Arguments.createMap();
                        resultMap.putString("responseCode", transactionResultEntity.getResponseCode());
                        resultMap.putString("responseMessage", transactionResultEntity.getResponseMessage());

                        mainHandler.post(() -> promise.resolve(resultMap));
                    } else {
                        Log.e(TAG, "ERROR: resultCode=" + resultCode + ", errorCode=" + errorCode + ", responseMessage=" + responseMsg);
                        boolean isCancelled = errorCode == -2 || "CANCELLED".equalsIgnoreCase(responseMsg);
                        String message = isCancelled ? "Transacción cancelada por el usuario" : "Transacción fallida";

                        mainHandler.post(() -> promise.reject("TRANS_FAILED", message, new Exception(jsonResult)));
                    }
                }
            });
        } catch (Exception e) {
            Log.e(TAG, "Error en doTransaction", e);
            promise.reject("EXCEPTION", Objects.requireNonNull(e.getMessage()));
        }
    }

    @ReactMethod
    public void disconnect(Promise promise) {
        try {
            if (isServiceBound) {
                Log.d(TAG, "Desconectando servicio Smartconnect...");
                getReactApplicationContext().unbindService(mConnection);
                isServiceBound = false;
                iSmartconnectService = null;
                Log.d(TAG, "Servicio desconectado");
            }
            promise.resolve("Servicio desconectado exitosamente");
        } catch (Exception e) {
            Log.e(TAG, "Error al desconectar servicio", e);
            promise.reject("DISCONNECT_ERROR", Objects.requireNonNull(e.getMessage()));
        }
    }

    private String convertMapToJson(ReadableMap readableMap) throws JSONException {
        JSONObject jsonObject = new JSONObject();
        ReadableMapKeySetIterator iterator = readableMap.keySetIterator();
        
        while (iterator.hasNextKey()) {
            String key = iterator.nextKey();
            ReadableType type = readableMap.getType(key);
            switch (type) {
                case Null:
                    jsonObject.put(key, JSONObject.NULL);
                    break;
                case Boolean:
                    jsonObject.put(key, readableMap.getBoolean(key));
                    break;
                case Number:
                    jsonObject.put(key, readableMap.getDouble(key));
                    break;
                case String:
                    jsonObject.put(key, readableMap.getString(key));
                    break;
                case Map:
                    ReadableMap childMap = readableMap.getMap(key);
                    if (childMap != null) {
                        jsonObject.put(key, new JSONObject(convertMapToJson(childMap)));
                    }
                    break;
                case Array:
                    // Manejar arrays si es necesario
                    break;
            }
        }
        return jsonObject.toString();
    }

    private void sendEvent(String eventName, String params) {
        try {
            Log.d(TAG, "Sending event: " + eventName + " with params: " + params);
            getReactApplicationContext()
                .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
                .emit(eventName, params);
            Log.d(TAG, "Event sent successfully");
        } catch (Exception e) {
            Log.e(TAG, "Error sending event " + eventName, e);
        }
    }
}