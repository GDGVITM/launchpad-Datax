// lib/socket.ts
import { io, Socket } from 'socket.io-client';

class SocketManager {
  private socket: Socket | null = null;
  private token: string | null = null;

  connect(token: string) {
    if (this.socket?.connected) {
      this.socket.disconnect();
    }

    this.token = token;
    const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:5000';

    this.socket = io(WS_URL, {
      auth: {
        token: token
      },
      autoConnect: true
    });

    this.setupEventListeners();
    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  getSocket() {
    return this.socket;
  }

  private setupEventListeners() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('Connected to server:', this.socket?.id);
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from server');
    });

    this.socket.on('connect_error', (error: any) => {
      console.error('Connection error:', error);
    });
  }

  // Subscription methods
  subscribeToAlerts() {
    if (this.socket?.connected) {
      this.socket.emit('subscribe_alerts');
    }
  }

  subscribeToThreats() {
    if (this.socket?.connected) {
      this.socket.emit('subscribe_threats');
    }
  }

  subscribeToLogs() {
    if (this.socket?.connected) {
      this.socket.emit('subscribe_logs');
    }
  }

  // Event listeners
  onNewAlert(callback: (alert: any) => void) {
    if (this.socket) {
      this.socket.on('new_alert', callback);
    }
  }

  onNewThreat(callback: (threat: any) => void) {
    if (this.socket) {
      this.socket.on('new_threat', callback);
    }
  }

  onNewLog(callback: (log: any) => void) {
    if (this.socket) {
      this.socket.on('new_log', callback);
    }
  }

  onAlertUpdate(callback: (alert: any) => void) {
    if (this.socket) {
      this.socket.on('alert_updated', callback);
    }
  }

  onThreatUpdate(callback: (threat: any) => void) {
    if (this.socket) {
      this.socket.on('threat_updated', callback);
    }
  }

  // Remove listeners
  removeAllListeners() {
    if (this.socket) {
      this.socket.removeAllListeners();
    }
  }
}

export const socketManager = new SocketManager();
export default socketManager;
