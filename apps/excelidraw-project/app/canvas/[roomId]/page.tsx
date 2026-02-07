import { MainCanvas } from "@/components/MainCanvax";


export default async function CanvasPage({params}:{ 
    params:{ 
        roomId: string
    }
}) { 
    const roomId = (await params).roomId;
    console.log(roomId)
    
    return <MainCanvas roomId={roomId} />
}