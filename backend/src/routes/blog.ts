import { PrismaClient } from "@prisma/client/edge";
import { withAccelerate } from "@prisma/extension-accelerate";
import { verify } from "hono/jwt";
import { Hono } from "hono";

export const blogRouter = new Hono<{
  Bindings:{
    DATABASE_URL: string;  
    JWT_SECRET: string;
  }, 
  Variables: {
    userId: string;
  }
}>();

blogRouter.use('/*',async(c,next)=>{
  const authHeader = c.req.header("authorization") || "";
  // Bearer token =>["Bearer","token"]
  //const token = header.split(" ")[1]

  const user = await verify(authHeader,c.env.JWT_SECRET);
  if(user){
    c.set("userId",user.id);
    await next();
  }
  else{
    c.status(403)
    return c.json({
      message: "You are not loged in" 
    })
  }
});

blogRouter.post('/', async (c)=>{
  const body = await c.req.json();
  const authorId = c.get("userId");
  const prisma =  new PrismaClient({
    datasourceUrl: c.env.DATABASE_URL,
  }).$extends(withAccelerate());

  const post = await prisma.post.create({
    data: {
      title: body.title,
      content: body.content,
      authorId: parseInt(authorId)
    }
  })
  return c.json({
    id:body.id
  })
})


blogRouter.put('/',async (c)=>{
  const body = await c.req.json();
  const prisma = new PrismaClient({
    datasourceUrl: c.env.DATABASE_URL,
  }).$extends(withAccelerate());

  const post = await prisma.post.update({
    where:{
      id: body.id
    },
    data: {
      title: body.title,
      content: body.content,
    }
  })
  return c.json({
    id:body.id
  })
})

blogRouter.get('/:id',async(c)=>{
  const body = await c.req.json();
  const prisma =  new PrismaClient({
    datasourceUrl: c.env.DATABASE_URL,
  }).$extends(withAccelerate());
  try{
    const post = await prisma.post.findFirst({
      where:{
        id: body.id
      }
    })
    return c.json({
      post
    });
  } catch(e){
    c.status(411);
    return c.json({
        message: " Error while fetching the blog post"
    })
  }
})
//pagination
blogRouter.get('/bulk',async (c)=>{
  const prisma = new PrismaClient({
    datasourceUrl: c.env.DATABASE_URL,
  }).$extends(withAccelerate());
  
  const post = prisma.post.findMany();

  return c.json({
    post
  })
})