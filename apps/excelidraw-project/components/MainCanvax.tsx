"use client"
import { WS_BACKEND } from "@/config";
import { initDraw } from "@/draw";
import { useEffect, useRef, useState } from "react";

export function MainCanvas({roomId}: {roomId: string}) { 
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [socket, setSocket] = useState<WebSocket | null>(null);

    useEffect(() => { 
        const ws = new WebSocket(WS_BACKEND);
        ws.onopen = () => { 
            setSocket(ws)
        }
    })

    useEffect(() => { 
        if(canvasRef.current){ 
            initDraw(canvasRef.current, roomId)
            }
    }, [canvasRef])

    return<div> 
    <canvas ref={canvasRef} width={1500} height={1000} />
    </div>
}