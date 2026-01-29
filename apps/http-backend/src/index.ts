import express from "express";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "@repo/backend-common/config";
import { Middleware } from "./middleware";
import { CreateUserSchema, SigninSchema, CreateRoomSchema } from "@repo/common/zodTypes";
import { prismaClient } from "@repo/db/client";
const app = express();


app.post("/signup", (req, res) => { 

 const data = CreateUserSchema.safeParse(req.body);
 if(!data.success){ 
     res.json({ 
        message: "Incorrect input"
    });
    return;
 }
  
})

app.post("/signin", (req, res) => { 
  const data = SigninSchema.safeParse(req.body);
 if(!data.success){ 
     res.json({ 
        message: "Incorrect input"
    });
    return;
 }

 const userId = 1;
 jwt.sign({ 
    userId
 }, JWT_SECRET)

  
})

app.post("/room", Middleware, (req, res) => { 
  const data = CreateRoomSchema.safeParse(req.body);
 if(!data.success){ 
     res.json({ 
        message: "Incorrect input"
    });
    return;
 }
 
    res.json({ 
        roomID: "123123"
    })
})

app.listen(3005);