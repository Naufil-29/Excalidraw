"use client"
import { WS_BACKEND } from "@/config";
import { initDraw } from "@/draw";
import { useEffect, useRef, useState } from "react";
import { MainCanvas } from "./MainCanvas";

export function RoomCanvas({roomId}: {roomId: string}) { 
    
    const [socket, setSocket] = useState<WebSocket | null>(null);

    useEffect(() => { 
        const ws = new WebSocket(`${WS_BACKEND}?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI4OTM4YzE5Ny02MWIxLTRmYTMtYTNlOS0xOTAxMzUyOGU2NGEiLCJpYXQiOjE3NzA2MTk2NzN9.NZuEv8d75t8PdlnIIvnn9wkJTTLx7fAYQH57mPxqnIk`);
        ws.onopen = () => { 
            setSocket(ws);
            const data = JSON.stringify({ 
                type: "join_room",
                roomId
            })
            ws.send(data)
        }
    }, [])

   
    if(!socket){ 
        return<div> 
            Connecting to server...
        </div>
    }

    return<div>
        <MainCanvas roomId={roomId} socket={socket}/>
    </div>
}