import express from "express";
import dotenv from "dotenv"
import jwt from "jsonwebtoken";
dotenv.config();
import { JWT_SECRET } from "@repo/backend-common/config";
import { Middleware } from "./middleware";
import { CreateUserSchema, SigninSchema, CreateRoomSchema } from "@repo/common/zodTypes";
import { prismaClient } from "@repo/db/client";
import cors from "cors"
const app = express();
app.use(express.json());
app.use(cors())


app.post("/signup", async(req, res) => { 
    console.log(process.env.DATABASE_URL)

 const parsedData = CreateUserSchema.safeParse(req.body);
 if(!parsedData.success){ 
     console.log(parsedData.error)
     res.json({ 
        message: "Incorrect input"
    });
    return;
 }
try{ 
    const user = await prismaClient.user.create({ 
       data:{ 
           email: parsedData.data?.username,
           password: parsedData.data.password,
           name: parsedData.data.name
       }
    });

    res.json({ 
        userId: user.id
    })
}
catch (e) {
  res.status(500).json({
    message: "Signup failed user already exists",
  });
}
  
})

app.post("/signin", async(req, res) => { 
  const parsedData = SigninSchema.safeParse(req.body);
 if(!parsedData.success){ 
     res.json({ 
        message: "Incorrect input"
    });
    return;
 }

 const user = await prismaClient.user.findFirst({ 
    where: { 
        email: parsedData.data.username,
        password: parsedData.data?.password,
        
    }
 });

 if(!user){ 
    res.status(403).json({ 
        Msg: "unauthorized user does not exist"
    });
    return
}


 const token = jwt.sign({ 
                userId: user?.id
                }, JWT_SECRET);

 res.status(200).json({ 
    Msg: "successfully signed In",
    token: token 
 })

  
})

app.post("/room", Middleware, async(req, res) => { 
  const parsedData = CreateRoomSchema.safeParse(req.body);
 if(!parsedData.success){ 
     res.json({ 
        message: "Incorrect input"
    });
    return;
 };
 //@ts-ignore
 const userId = req.userId;

 try{ 
    const room = await prismaClient.room.create({ 
    data:{ 
        slug: parsedData.data.name,
        adminId: userId
    }
 });
 
    res.json({ 
        roomID: room.id
    });
 }
 catch(e){ 
    res.status(501).json({ 
        Msg: "room already exists plese select a unique name!"
    })
 }
});

app.get("/chats/:roomId", async (req, res) => {
    try {
        const roomId = Number(req.params.roomId);
        console.log(req.params.roomId);
        const messages = await prismaClient.chat.findMany({
            where: {
                roomId: roomId
            },
            orderBy: {
                id: "desc"
            },
            take: 1000
        });

        res.json({
            messages
        })
    } catch(e) {
        console.log(e);
        res.json({
            messages: []
        })
    }
    
})

app.get("/room/:slug", async (req, res) => {
    const slug = req.params.slug;
    const room = await prismaClient.room.findFirst({
        where: {
            slug
        }
    });

    res.json({
        room
    })
})

app.listen(3005);