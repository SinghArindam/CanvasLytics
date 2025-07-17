import { useState, useEffect, useRef } from 'react';

export const useWebSocket = (url) => {
  const [messages, setMessages] = useState([]);
  const [isConnecting, setIsConnecting] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const ws = useRef(null);

  useEffect(() => {
    if (!url) return;

    ws.current = new WebSocket(url);
    ws.current.onopen = () => {
      console.log("WebSocket connected");
      setIsConnected(true);
      setIsConnecting(false);
    };
    ws.current.onclose = () => {
      console.log("WebSocket disconnected");
      setIsConnected(false);
      setIsConnecting(false);
    };
    ws.current.onerror = (error) => {
        console.error("WebSocket error:", error);
        setIsConnected(false);
        setIsConnecting(false);
    };
    ws.current.onmessage = (event) => {
      const message = JSON.parse(event.data);
      setMessages(prev => [...prev, message]);
    };

    return () => {
      ws.current.close();
    };
  }, [url]);

  const sendMessage = (action, payload) => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      const message = JSON.stringify({ action, payload });
      ws.current.send(message);
    } else {
      console.error("WebSocket is not connected.");
    }
  };

  return { messages, sendMessage, isConnected, isConnecting };
};