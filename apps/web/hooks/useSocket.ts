import { useEffect, useState } from "react";
import { WS_URL } from "../app/config";

export function useSocket() {
    const [loading, setLoading] = useState(true);
    const [socket, setSocket] = useState<WebSocket>();

    useEffect(() => {
        const ws = new WebSocket(`${WS_URL}?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI4OWFhZmM0OC02OWRjLTQxZGUtOWMzMi1jMGVjMzMxOTVjMDkiLCJpYXQiOjE3NzAwMTU5NDF9.K1xERs6rpXRtQM8XyfYjc3ffautNB3nafLJxZNweEH4`);
        ws.onopen = () => {
            setLoading(false);
            setSocket(ws);
        }
    }, []);

    return {
        socket,
        loading
    }

}