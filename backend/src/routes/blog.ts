import { PrismaClient } from "@prisma/client/edge";
import { withAccelerate } from "@prisma/extension-accelerate";
import { Hono } from "hono";
import { verify } from "hono/jwt";
import { createblogInput, updateblogInput } from "../../../common/src/index";

export const blogRouter = new Hono<{
    Bindings: {
      DATABASE_URL: string;
      JWT_SECRET: string;
    };
    Variables: {
      resId: string;
    };
  }>();
  
  blogRouter.use('/*', async (c, next) => {
    const token = c.req.header('authorization') || '';
    
      const res = await verify(token, c.env.JWT_SECRET) 
      if (res) {
        //@ts-ignore
        c.set('resId', res.id);
        await next();
      } 
      else{
        c.status(403);
        return c.json({
            error: 'unauthorized',
        });
    }
    
  });
blogRouter.post('/', async(c) => {
    const prisma = new PrismaClient({
        datasourceUrl: c.env?.DATABASE_URL	,
    }).$extends(withAccelerate());
    
    const body = await c.req.json();
    const {success}=createblogInput.safeParse(body);
    if(!success) {
        c.status(411);
        return c.json({error:"Invalid input"});
    }
    const userId=c.get("resId");
    const blog=await prisma.blog.create({
        data:{
            title:body.title,
            content:body.content,
            authorId:parseInt(userId)
        }
    })
    return c.json({
        id:blog.id
    })
})
blogRouter.put('/', async(c) => {
    const prisma = new PrismaClient({
        datasourceUrl: c.env?.DATABASE_URL	,
    }).$extends(withAccelerate());
    
    const body = await c.req.json();
    const {success}=updateblogInput.safeParse(body);
    if(!success) {
        c.status(411);
        return c.json({error:"Invalid input"});
    }
    const blog=await prisma.blog.update({
        where:{
            id:body.id
        },
        data:{
            title:body.title,
            content:body.content  
        }
    })
    return c.json({
        id:blog.id
    })
})
blogRouter.get('/bulk', async(c) => {
    const prisma = new PrismaClient({
        datasourceUrl: c.env?.DATABASE_URL	,
    }).$extends(withAccelerate());
    const blogs=await prisma.blog.findMany();
    return c.json({
        blogs
    })
}) 
blogRouter.get('/:id', async(c) => {
    const id=c.req.param("id");
    const prisma = new PrismaClient({
        datasourceUrl: c.env?.DATABASE_URL	,
    }).$extends(withAccelerate());
    try{
        const body = await c.req.json();
        const blog=await prisma.blog.findFirst({
            where:{
                id: parseInt(id)
            }
        })
        return c.json({
            blog
        })
    }
    catch(e){
        c.status(411);
        return c.json({
            message:"not found blog"
        })
    }
    
})
