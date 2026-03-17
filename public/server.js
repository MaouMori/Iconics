const express = require("express")
const fs = require("fs")

const app = express()

app.use(express.json())
app.use(express.static("."))

function readMembers(){

return JSON.parse(fs.readFileSync("members.json"))

}

function saveMembers(data){

fs.writeFileSync("members.json",JSON.stringify(data,null,2))

}

app.get("/members",(req,res)=>{

res.json(readMembers())

})

app.post("/addMember",(req,res)=>{

const members = readMembers()

members.push(req.body)

saveMembers(members)

res.sendStatus(200)

})

app.post("/deleteMember",(req,res)=>{

const members = readMembers()

members.splice(req.body.index,1)

saveMembers(members)

res.sendStatus(200)

})

app.listen(3000,()=>{

console.log("Server rodando em http://localhost:3000")

})