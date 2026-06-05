import {
  browserSupportsWebAuthn,
  startAuthentication,
} from '@simplewebauthn/browser';
import api from '../api/client';

const assertValidPin = (pin) => {
  if (!/^\d{4}$/.test(String(pin || ''))) {
    throw new Error('A valid 4-digit PIN is required');
  }
};

const getApiErrorMessage = (error, fallbackMessage) => {
  return error?.response?.data?.message || error?.message || fallbackMessage;
};

const ensureSecureContext = () => {
  if (typeof window !== 'undefined' && !window.isSecureContext) {
    throw new Error('Fingerprint requires a secure app origin such as localhost, 127.0.0.1, or HTTPS');
  }
};

export const ensureBiometricSupport = async () => {
  ensureSecureContext();

  if (!browserSupportsWebAuthn()) {
    throw new Error('This browser does not support fingerprint authentication');
  }
};

export const formatBiometricError = (error, fallbackMessage) => {
  const responseMessage = error?.response?.data?.message;
  if (responseMessage) {
    return responseMessage;
  }

  const errorName = String(error?.name || '');
  const errorMessage = String(error?.message || '').trim();

  if (errorName === 'SecurityError') {
    return 'Fingerprint requires opening the app on localhost, 127.0.0.1, or HTTPS';
  }

  if (errorName === 'NotAllowedError') {
    return 'Fingerprint request was cancelled or device biometric permission was denied';
  }

  if (errorName === 'InvalidStateError') {
    return 'This device fingerprint is already added for this account.';
  }

  if (errorName === 'NotSupportedError') {
    return 'This browser or device cannot use fingerprint authentication on the current origin';
  }

  if (errorName === 'AbortError') {
    return 'Fingerprint request was interrupted. Please try again.';
  }

  return errorMessage || fallbackMessage;
};

export const getCurrentBiometricHost = () => {
  if (typeof window === 'undefined') {
    return '';
  }

  return window.location.hostname || '';
};

export const needsBiometricReenrollment = (user) => {
  if (!user?.fingerprintEnabled || !user?.hasBiometricCredential) {
    return false;
  }

  const currentHost = getCurrentBiometricHost();
  const registeredHost = String(user?.biometricRpId || '');

  return Boolean(currentHost && registeredHost && currentHost !== registeredHost);
};

export const requestPaymentToken = async (pinInput) => {
  assertValidPin(pinInput);
  await ensureBiometricSupport();

  let authOptions;

  try {
    authOptions = await api.get('/security/webauthn/auth-options');
  } catch (error) {
    throw new Error(getApiErrorMessage(error, 'Unable to start fingerprint verification'));
  }

  if (!Array.isArray(authOptions.data?.allowCredentials) || authOptions.data.allowCredentials.length === 0) {
    throw new Error('Add fingerprint in Settings before continuing');
  }

  let assertion;

  try {
    assertion = await startAuthentication({ optionsJSON: authOptions.data });
  } catch (error) {
    throw new Error(formatBiometricError(error, 'Fingerprint verification was cancelled or failed'));
  }

  let verifyResponse;

  try {
    verifyResponse = await api.post('/security/verify-payment', {
      pin: String(pinInput),
      assertion,
    });
  } catch (error) {
    throw new Error(getApiErrorMessage(error, 'PIN or fingerprint verification failed'));
  }

  const token = verifyResponse.data?.paymentToken || verifyResponse.data?.verificationToken;
  if (!token) {
    throw new Error('Payment verification token missing');
  }

  return token;
};

export const verifyLoginBiometric = async () => {
  await ensureBiometricSupport();

  let authOptions;

  try {
    authOptions = await api.get('/security/webauthn/auth-options');
  } catch (error) {
    throw new Error(getApiErrorMessage(error, 'Unable to start fingerprint verification'));
  }

  let assertion;

  try {
    assertion = await startAuthentication({ optionsJSON: authOptions.data });
  } catch (error) {
    throw new Error(formatBiometricError(error, 'Fingerprint verification was cancelled or failed'));
  }

  try {
    await api.post('/security/verify-login-biometric', { assertion });
  } catch (error) {
    throw new Error(getApiErrorMessage(error, 'Fingerprint verification failed'));
  }
};
