import { ReactNode } from "react";

export function IconButton ({ 
    icon, onClick, activated
}: { 
    icon: ReactNode,
    onClick: () => void,
    activated: boolean
}) { 
    return <div className={`pointer rounded-lg p-2  ${activated ? "bg-gray-900 text-white" : "bg-gray-500"}`} onClick={onClick}>{icon}</div>
}