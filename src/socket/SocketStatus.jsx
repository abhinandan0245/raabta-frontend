import { useState, useEffect } from 'react';
import { isSocketConnected, reconnectSocket } from './utils/socket';

function SocketStatus() {
    const [isConnected, setIsConnected] = useState(false);
    
    useEffect(() => {
        const checkConnection = () => {
            setIsConnected(isSocketConnected());
        };
        
        // Check initially
        checkConnection();
        
        // Check every 5 seconds
        const interval = setInterval(checkConnection, 5000);
        
        return () => clearInterval(interval);
    }, []);
    
    const handleReconnect = () => {
        reconnectSocket();
    };
    
    return (
        <div style={{
            position: 'fixed',
            top: 10,
            right: 10,
            padding: '5px 10px',
            background: isConnected ? '#4CAF50' : '#f44336',
            color: 'white',
            borderRadius: '20px',
            fontSize: '12px',
            zIndex: 1000
        }}>
            {isConnected ? '🟢 Connected' : '🔴 Disconnected'}
            {!isConnected && (
                <button 
                    onClick={handleReconnect}
                    style={{
                        marginLeft: '10px',
                        background: 'white',
                        border: 'none',
                        borderRadius: '5px',
                        padding: '2px 8px',
                        cursor: 'pointer'
                    }}
                >
                    Reconnect
                </button>
            )}
        </div>
    );
}