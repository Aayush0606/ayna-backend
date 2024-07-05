'use strict';
const jwt = require('jsonwebtoken');
module.exports = {
  /**
   * An asynchronous register function that runs before
   * your application is initialized.
   *
   * This gives you an opportunity to extend code.
   */
  register(/*{ strapi }*/) {},

  /**
   * An asynchronous bootstrap function that runs before
   * your application gets started.
   *
   * This gives you an opportunity to set up your data model,
   * run jobs, or perform some special logic.
   */
  bootstrap({ strapi }) {
    const { Server } = require("socket.io");
    const io=new Server(strapi.server.httpServer,{
      cors:{
        origin:"*",
        methods:["GET","POST","PUT","DELETE","PATCH"]
      }
    });
    io.on('connection',(socket)=>{
      try {
        const token=socket.handshake.auth.token;
        const decodedToken=jwt.verify(token,process.env.JWT_SECRET);
        const userId=decodedToken["id"];
        socket.on('user_message',async(chat_id,msg)=>{
          console.log("inside socket",chat_id)
          await strapi.entityService.create('api::message.message',{
              data:
              {
                  content:msg,
                  chat_id:chat_id,
                  user:'user',
                  timestamp:new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                }
              });
              await strapi.entityService.create('api::message.message',{
                data:
                {
                  content:msg,
                  chat_id:chat_id,
                  user:'server',
                  timestamp:new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              }
          });
          const server_message={
            content:msg,
            createdAt:new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            user:'server'
          }
          socket.emit("server_message",server_message);
        })
        socket.emit("connectio_success",`Connection Successfull for user ${userId}, start sending message!!`);
      } catch (error) {
        socket.emit("connectio_error","Auth failed, try again!!");
        socket.disconnect(true);
      }
    })
    strapi.io=io;
  },
};
