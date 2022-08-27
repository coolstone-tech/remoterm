
const { exec } = require('child_process')
const express = require('express')
const { readFileSync, existsSync, appendFileSync, writeFileSync, mkdirSync } = require('fs')
const { homedir } = require('os')
const frontend = `${__dirname}/front/`
const logs = `${require("os").homedir()}/rt`

const getConfig = () => {
return JSON.parse(readFileSync(`${homedir()}/rt/config.json`,'utf8'))
}

const app = express()


app.use(express.static(frontend))
app.set('trust proxy', true)
const port = getConfig().port || 3000
app.listen(port, () => {console.log(`Started on port ${port}!`)})


app.get('/run',(req,res)=> {
try{
const { stdin, dir, username, password } = req.headers

if(!dir) dir = homedir()
dir.replace('~', homedir())
stdin.replace('~', homedir())

if(getConfig().users[username] && getConfig().users[username] == password){
if(!existsSync(logs)) mkdirSync(logs)
if(!existsSync(`${logs}/${username}.log`)) writeFileSync(`${logs}/${username}.log`, `Recreated log at ${new Date().toUTCString()}`) 
appendFileSync(`${logs}/${username}.log`,`\nRan ${stdin} in ${dir} at ${new Date().toUTCString()}`)
exec(`cd ${dir} && ${decodeURIComponent(stdin)}`, (err, stdout) => {
if(err) return res.send({ error:new Error(err).message.replace(`cd ${dir} &&`,``), stdin })
res.send({stdout, stdin})
})
}else{
res.send({ error:"Not authenticated. Run \"logout\" and log in." })
}
}catch (e) {
res.send({error:new Error(e).message})
}
})

app.get("/checkdir", (req,res) => {
res.send({ exists:existsSync(req.headers.dir.replace('~',homedir())) })
})

app.get('/login', (req,res)=>{
if(getConfig().users[req.headers.username] == req.headers.password){
res.send({correct:true})
}else{
res.send({correct:false})
}
})


app.use( (req, res) => {
    if (req.accepts('json')) { return res.send({ error: 'Not found' }) }
    else if (req.accepts('html')) { return res.sendFile(`${frontend}/404.html`) }
  })

    module.exports.logs = logs