import { WebSocketServer, WebSocket } from "ws"; 
import jwt from "jsonwebtoken"
import { JwtPayload } from "jsonwebtoken";
import { JWT_SECRET } from "@repo/backend-common/config";
import { prismaClient } from "@repo/db/client"
const wss = new WebSocketServer({ port: 8080 }, () => console.log("ws server running on port-8080"));

interface User { 
    userId: string
    ws: WebSocket
    rooms: string[]
}

const users: User[] = [];

function checkUser(token: string): string | null{ 
    try{ 
        const decoded = jwt.verify(token, JWT_SECRET);

    if(typeof decoded == 'string'){ 
        return null
    }

    if(!decoded || !decoded.userId){ 
        return null
    }

    return decoded.userId
    }
    catch(e){ 
        return null
    }
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

    ws.on('message', async function message(data){ 
        let parsedData;
        if(typeof data !== "string"){ 
            parsedData = JSON.parse(data.toString())
        }
        else{ 
            parsedData = JSON.parse(data)
        }

        if(parsedData.type === "join_room"){ 
            const user = users.find(x => x.ws === ws);
            user?.rooms.push(parsedData.roomId)
        }
        if(parsedData.type === "leave_room"){ 
            const user = users.find(x => x.ws === ws);
            if(!user){ 
                return
            }
            user.rooms = user?.rooms.filter(x => x === parsedData.room)
        }
        if(parsedData.type === "chat"){ 
            const roomId = parsedData.roomId;
            const message = parsedData.message;

            await prismaClient.chat.create({ 
                data:{ 
                    roomId: Number(roomId),
                    message,
                    userId
                }
            })

            users.forEach(user => { 
                if(user.rooms.includes(roomId)){ 
                    user.ws.send(JSON.stringify({ 
                        type: "chat",
                        roomId,
                        message: message
                    }))
                }
            })
        }
        if (parsedData.type === "delete_shape") {
            const roomId = String(parsedData.roomId);
            const shapeId = parsedData.shapeId;
            await prismaClient.chat.create({
                data: {
                    roomId: Number(roomId),
                    userId,
                    message: JSON.stringify({ type: "delete", shapeId }),
                },
            });
            users.forEach(user => {
                if (user.rooms.includes(roomId)) {
                    user.ws.send(JSON.stringify({ type: "delete_shape", roomId, shapeId }));
                }
            });
        }
        if (parsedData.type === "update_shape") {
            const roomId = String(parsedData.roomId);
            const shape = parsedData.shape;
            await prismaClient.chat.create({
                data: {
                    roomId: Number(roomId),
                    userId,
                    message: JSON.stringify({ type: "update", shape }),
                },
            });
            users.forEach(user => {
                if (user.rooms.includes(roomId)) {
                    user.ws.send(JSON.stringify({ type: "update_shape", roomId, shape }));
                }
            });
        }
    });
});

/*
 * CHANGELOG (shape edit sync):
 * - delete_shape: accepts { roomId, shapeId }, broadcasts to all clients in room so they remove the shape.
 * - update_shape: accepts { roomId, shape }, broadcasts so clients update the shape (resize, color, text edit).
 * CHANGELOG (permanent delete):
 * - delete_shape now persists to DB: creates a Chat row with message = { type: "delete", shapeId }. Frontend replays add/delete when loading so deleted shapes stay gone after refresh.
 * CHANGELOG (persist update / relocate):
 * - update_shape now persists to DB: creates a Chat row with message = { type: "update", shape }. Frontend replays updates when loading so moved/resized shapes keep their position after refresh.
 */