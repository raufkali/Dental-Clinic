/**
 * Dental Clinic Offline License & Problos Activation Service
 * 
 * Enforces single-device hardware lock, anti-theft protection,
 * offline subscription expiry validation, and clock-tampering detection.
 */

const PROBLOS_API_URL = (typeof window !== 'undefined' && window.location.hostname === 'localhost' && window.location.port === '5000')
  ? 'http://127.0.0.1:5000/api'
  : (import.meta.env?.VITE_PROBLOS_API_URL || 'https://problos-backend.onrender.com/api');
const PROBLOS_WEB_URL = import.meta.env?.VITE_PROBLOS_WEB_URL || 'https://problos.com';

class LicenseService {
  /**
   * Read hardware identifiers from Electron main process or browser fallback.
   */
  async getDeviceInfo() {
    if (typeof window !== 'undefined' && window.electronAPI?.getDeviceInfo) {
      try {
        return await window.electronAPI.getDeviceInfo();
      } catch (e) {
        console.warn('Failed to fetch Electron device info:', e);
      }
    }

    // Fallback for web browser testing
    let browserId = localStorage.getItem('dental_dev_device_id');
    if (!browserId) {
      browserId = 'BROWSER-' + Math.random().toString(36).substring(2, 10).toUpperCase();
      localStorage.setItem('dental_dev_device_id', browserId);
    }
    return {
      deviceId: browserId,
      deviceName: 'Local Web Browser',
      platform: 'Web'
    };
  }

  /**
   * Load stored license from Electron userData file or localStorage.
   */
  async loadStoredLicense() {
    if (typeof window !== 'undefined' && window.electronAPI?.loadLicense) {
      try {
        const res = await window.electronAPI.loadLicense();
        if (res?.success && res.data) {
          return res.data;
        }
      } catch (e) {
        console.warn('Failed to load license via Electron IPC:', e);
      }
    }

    try {
      const raw = localStorage.getItem('dental_clinic_license_data');
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  /**
   * Save license to persistent storage.
   */
  async saveStoredLicense(data) {
    const dataWithTimestamp = {
      ...data,
      lastRecordedTimestamp: Date.now()
    };

    if (typeof window !== 'undefined' && window.electronAPI?.saveLicense) {
      try {
        await window.electronAPI.saveLicense(dataWithTimestamp);
      } catch (e) {
        console.warn('Failed to save license via Electron IPC:', e);
      }
    }

    try {
      localStorage.setItem('dental_clinic_license_data', JSON.stringify(dataWithTimestamp));
    } catch (e) {
      console.warn('Failed to save to localStorage:', e);
    }
  }

  /**
   * Clear license from persistent storage.
   */
  async clearStoredLicense() {
    if (typeof window !== 'undefined' && window.electronAPI?.clearLicense) {
      try {
        await window.electronAPI.clearLicense();
      } catch (e) {
        console.warn('Failed to clear license via Electron IPC:', e);
      }
    }

    try {
      localStorage.removeItem('dental_clinic_license_data');
    } catch (e) {}
  }

  /**
   * Open the Problos subscription page in user's default browser with deviceId.
   */
  async openSubscriptionPortal(plan = '') {
    const currentDevice = await this.getDeviceInfo();
    let targetUrl = `${PROBLOS_WEB_URL}/pricing/dental?deviceId=${encodeURIComponent(currentDevice.deviceId || '')}`;
    if (plan) {
      targetUrl += `&plan=${encodeURIComponent(plan)}`;
    }
    if (typeof window !== 'undefined' && window.electronAPI?.openExternal) {
      try {
        return await window.electronAPI.openExternal(targetUrl);
      } catch (e) {
        console.warn('Failed to open external link via Electron:', e);
      }
    }
    window.open(targetUrl, '_blank');
  }

  /**
   * Decode payload from JWT token without verifying server secret (used for offline client inspections).
   */
  parseTokenPayload(token) {
    if (!token || typeof token !== 'string') return null;
    try {
      const parts = token.split('.');
      if (parts.length < 2) return null;
      const base64Url = parts[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch (e) {
      return null;
    }
  }

  /**
   * Verify license validity 100% offline.
   * Checks:
   * 1. License existence
   * 2. Hardware device lock (anti-copy protection)
   * 3. Clock tampering / rollback protection
   * 4. Expiration date (monthly / yearly)
   */
  async verifyOfflineLicense() {
    const licenseData = await this.loadStoredLicense();
    if (!licenseData || !licenseData.license) {
      return {
        isValid: false,
        status: 'UNLICENSED',
        message: 'No license detected. Please subscribe on Problos and activate this app.'
      };
    }

    const currentDevice = await this.getDeviceInfo();
    const boundDeviceId = licenseData.device?.deviceId || licenseData.tokenPayload?.deviceId;

    // 1. Hardware Fingerprint Check (Anti-Theft)
    if (boundDeviceId && boundDeviceId !== currentDevice.deviceId) {
      return {
        isValid: false,
        status: 'DEVICE_MISMATCH',
        message: 'Unauthorized Machine: This license is bound to another computer. Copying this application to another device is not permitted.',
        boundDeviceId,
        currentDeviceId: currentDevice.deviceId,
        license: licenseData.license
      };
    }

    // 2. Anti-Clock-Tampering (Rollback Detection)
    const now = Date.now();
    const lastSeenTime = licenseData.lastRecordedTimestamp || 0;
    // If current system time is rolled back by more than 1 hour compared to last recorded execution
    if (lastSeenTime > 0 && now < (lastSeenTime - 3600000)) {
      return {
        isValid: false,
        status: 'CLOCK_TAMPERED',
        message: 'System clock tampering detected. Your computer date appears to have been set backwards. Please restore the correct date and time.',
        license: licenseData.license
      };
    }

    // 3. Status Check
    const { license } = licenseData;
    if (license.status === 'revoked') {
      return {
        isValid: false,
        status: 'REVOKED',
        message: 'This license has been revoked by the administrator.',
        license
      };
    }

    // 4. Expiration Check (Monthly / Yearly)
    if (license.plan !== 'lifetime' && license.expiresAt) {
      const expiryDate = new Date(license.expiresAt).getTime();
      if (now >= expiryDate) {
        return {
          isValid: false,
          status: 'EXPIRED',
          message: 'Subscription has expired. Pay first to continue to your app.',
          isExpired: true,
          expiresAt: license.expiresAt,
          plan: license.plan,
          license
        };
      }
    }

    // Update monotonic timestamp
    await this.saveStoredLicense({
      ...licenseData,
      lastRecordedTimestamp: now
    });

    return {
      isValid: true,
      status: 'ACTIVE',
      license,
      device: licenseData.device || currentDevice,
      user: licenseData.user
    };
  }

  /**
   * Check if this device has been activated on the Problos website.
   * Does NOT require any credentials on the desktop app!
   */
  async checkDeviceActivation() {
    try {
      const currentDevice = await this.getDeviceInfo();
      const storedLicense = await this.loadStoredLicense();
      const licenseId = storedLicense?.license?.id || storedLicense?.tokenPayload?.licenseId;

      let url = `${PROBLOS_API_URL}/licenses/check-device/${encodeURIComponent(currentDevice.deviceId)}`;
      if (licenseId) {
        url += `?licenseId=${encodeURIComponent(licenseId)}`;
      }

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        const isRevoked =
          result.data?.isRevoked ||
          result.data?.reason === 'REVOKED' ||
          result.data?.reason === 'DELETED' ||
          result.data?.reason === 'LICENSE_NOT_FOUND' ||
          false;

        return {
          activated: false,
          isRevoked,
          isExpired: result.data?.isExpired || false,
          reason: result.data?.reason || result.message || 'NOT_ACTIVATED',
          message: result.data?.message || result.message,
          expiresAt: result.data?.expiresAt
        };
      }

      if (
        result.data?.isRevoked ||
        result.data?.reason === 'REVOKED' ||
        result.data?.reason === 'DELETED' ||
        result.data?.reason === 'LICENSE_NOT_FOUND'
      ) {
        return {
          activated: false,
          isRevoked: true,
          reason: result.data?.reason || 'REVOKED',
          message: result.data?.message || 'Access has been revoked or license deleted by admin.'
        };
      }

      if (result.data?.activated && result.data?.licenseToken) {
        const { licenseToken, license, device, user } = result.data;
        const tokenPayload = this.parseTokenPayload(licenseToken);

        const licenseRecord = {
          licenseToken,
          license,
          device: device || currentDevice,
          user,
          tokenPayload,
          lastRecordedTimestamp: Date.now()
        };

        await this.saveStoredLicense(licenseRecord);

        return {
          activated: true,
          licenseRecord
        };
      }

      return {
        activated: false,
        isRevoked:
          result.data?.isRevoked ||
          result.data?.reason === 'REVOKED' ||
          result.data?.reason === 'DELETED' ||
          false,
        isExpired: result.data?.isExpired || false,
        reason: result.data?.reason || 'NOT_ACTIVATED',
        expiresAt: result.data?.expiresAt
      };
    } catch (err) {
      return {
        activated: false,
        reason: 'NETWORK_ERROR',
        error: err.message
      };
    }
  }

  /**
   * Manually apply/paste a license token string generated from Problos website.
   */
  async applyToken(tokenStr) {
    if (!tokenStr || typeof tokenStr !== 'string' || !tokenStr.trim()) {
      throw new Error('Please enter a valid license token.');
    }

    const cleanToken = tokenStr.trim();
    const tokenPayload = this.parseTokenPayload(cleanToken);

    if (!tokenPayload) {
      throw new Error('Invalid token structure. Please copy the complete license token from Problos.');
    }

    const currentDevice = await this.getDeviceInfo();

    // Check device binding
    if (tokenPayload.deviceId && tokenPayload.deviceId !== currentDevice.deviceId) {
      throw new Error(`Device mismatch: This token is locked to computer (${tokenPayload.deviceId.substring(0, 10)}...). This computer is (${currentDevice.deviceId.substring(0, 10)}...).`);
    }

    // Check expiration
    if (tokenPayload.expiresAt && new Date(tokenPayload.expiresAt) <= new Date()) {
      throw new Error('This license token has already expired. Pay first to continue to your app.');
    }

    const licenseRecord = {
      licenseToken: cleanToken,
      license: {
        id: tokenPayload.licenseId,
        plan: tokenPayload.plan,
        status: tokenPayload.status || 'active',
        expiresAt: tokenPayload.expiresAt
      },
      device: {
        deviceId: tokenPayload.deviceId || currentDevice.deviceId,
        deviceName: currentDevice.deviceName
      },
      user: {
        name: tokenPayload.userName,
        email: tokenPayload.userEmail,
        phone: tokenPayload.userPhone
      },
      tokenPayload,
      lastRecordedTimestamp: Date.now()
    };

    await this.saveStoredLicense(licenseRecord);

    // Notify Problos backend in background so device is registered with this license
    try {
      const licenseId = tokenPayload.licenseId;
      const deviceId = tokenPayload.deviceId || currentDevice.deviceId;
      if (licenseId && deviceId) {
        fetch(`${PROBLOS_API_URL}/licenses/check-device/${encodeURIComponent(deviceId)}?licenseId=${encodeURIComponent(licenseId)}`).catch(() => {});
      }
    } catch (e) {}

    return licenseRecord;
  }

  /**
   * Authenticate with Problos Backend, bind device, and store signed offline license.
   * Also provisions/logs into the local Dental Clinic server.
   */
  async activateWithProblos({ email, password }) {
    const currentDevice = await this.getDeviceInfo();

    const response = await fetch(`${PROBLOS_API_URL}/licenses/desktop-login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: email.trim().toLowerCase(),
        password,
        deviceId: currentDevice.deviceId,
        deviceName: currentDevice.deviceName,
        platform: currentDevice.platform,
        appVersion: '1.0.0',
        product: 'dental-clinic'
      })
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      const errorMsg = result.message || 'Activation failed. Please check your credentials.';
      const errorCode = result.code || 'ACTIVATION_ERROR';
      throw {
        message: errorMsg,
        code: errorCode
      };
    }

    const { licenseToken, license, device, user } = result.data;
    const tokenPayload = this.parseTokenPayload(licenseToken);

    // Save offline license record
    const licenseRecord = {
      licenseToken,
      license,
      device,
      user,
      tokenPayload,
      lastRecordedTimestamp: Date.now()
    };

    await this.saveStoredLicense(licenseRecord);

    // Automatically provision / sync local Dental Clinic user so they can access the local offline DB
    try {
      await this.syncLocalClinicUser({
        name: user.name,
        username: email.split('@')[0],
        password
      });
    } catch (localErr) {
      console.warn('Local user provisioning notice:', localErr);
    }

    return licenseRecord;
  }

  /**
   * Helper to ensure an Admin Doctor account exists locally in the offline database.
   */
  async syncLocalClinicUser({ name, username, password }) {
    const localBaseUrl = 'http://127.0.0.1:5001/api';
    try {
      // 1. Try logging in first
      const loginRes = await fetch(`${localBaseUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const loginData = await loginRes.json();
      if (loginRes.ok && loginData.success && loginData.data?.token) {
        localStorage.setItem('dental_token', loginData.data.token);
        localStorage.setItem('dental_user', JSON.stringify(loginData.data));
        return loginData.data;
      }

      // 2. If login failed, attempt to register local admin
      const regRes = await fetch(`${localBaseUrl}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          username,
          password,
          role: 'Admin'
        })
      });
      const regData = await regRes.json();
      if (regRes.ok && regData.success && regData.data?.token) {
        localStorage.setItem('dental_token', regData.data.token);
        localStorage.setItem('dental_user', JSON.stringify(regData.data));
        return regData.data;
      }
    } catch (err) {
      console.warn('Could not sync local offline user directly:', err);
    }
  }
}

export const licenseService = new LicenseService();
export default licenseService;
