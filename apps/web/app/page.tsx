"use client";
import { useState } from "react";
import styles from "./page.module.css";
import { useRouter } from "next/navigation";



export default function Home() {
  const [roomId, setRoomId] = useState("");
  const router = useRouter();
  return (
    
    <div className="w-screen h-screen flex justify-center items-center">
      <div className="flex flex-col justify-center items-center gap-4">
        <h1>Draw-App</h1>
      <input className="border-2 rounded-xl w-80 h-15 text-center" type="text" placeholder="RoomId" onChange={(e) => { 
        setRoomId(e.target.value) 
      }}/>

      <button className="border-2 rounded-xl w-60 h-15 bg-red-500 text-white hover:bg-red-800" onClick={() => { 
        router.push(`/room/${roomId}`)
      }} >Join Room</button> 
      </div>
    </div>
  );
}
