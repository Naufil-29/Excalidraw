import { WebSocketServer } from "ws"; 
import jwt from "jsonwebtoken"
import { JwtPayload } from "jsonwebtoken";
import { JWT_SECRET } from "@repo/backend-common/config";
const wss = new WebSocketServer({ port: 8080 });

interface User { 
    userId: string
    ws: WebSocket
    rooms: string[]
}

const users: User[] = [];

function checkUser(token: string): string | null{ 
    const decoded = jwt.verify(token, JWT_SECRET);

    if(typeof decoded == 'string'){ 
        return null
    }

    if(!decoded || !decoded.userId){ 
        return null
    }

    return decoded.userId
}

wss.on('connection', function connection(ws, request){ 
    const url = request.url;
    if(!url){ 
        return;
    };

    const queryParams = new URLSearchParams(url.split('?')[1]);
    const token = queryParams.get('token') || "";
    const userId = checkUser(token)

    if(userId == null){ 
        ws.close()
        return
    };

    users.push({ 
        userId,
        rooms: [],
        ws
    })

    ws.on('message', function message(data){ 
        const parsedData = JSON.parse(data as unknown as string); //{type: "join_room", roomId: 1}

        if(parsedData.type === "join_room"){ 
            const user = users.find(x => x.ws === ws);
            user?.rooms.push(parsedData.roomId)
        }
    });
})