#! /usr/bin/env node
const { readFileSync, writeFileSync, existsSync, mkdirSync, appendFileSync } = require('fs')
const { homedir } = require('os')
const { createInterface } = require('readline')
const logdir = `${require("os").homedir()}/rt`
const newport = process.argv[4] || 3000
const value = process.argv[3] || "null"

const getConfig = (return_path) => {
  return return_path ? `${homedir()}/rt/config.json` : JSON.parse(readFileSync(`${homedir()}/rt/config.json`,'utf8'))
  }
  if(!existsSync(logdir)) mkdirSync(logdir)
  if(!existsSync(getConfig(true))) writeFileSync(getConfig(true), JSON.stringify({ port:3000, users:{} }) , 'utf8')

const config = getConfig()

const overwrite = () => { writeFileSync(getConfig(true), JSON.stringify(config, null, 2)) }
switch(process.argv[2]){
case 'set':
switch(process.argv[3]){
case "port":
config.port = newport
overwrite()
console.log(`Changed port to ${config.port}`)
break
}
break
case "start":
require(".")
break
case "add":
    const addRL = createInterface({input: process.stdin, output:process.stdout})
    addRL.question("Username: ", user => {
    addRL.question('Password: ', pass => {
        writeFileSync(`${logdir}/${user}.log`, `Created ${user} at ${new Date().toUTCString()}`)
        config.users[user] = pass
        overwrite()
      addRL.close()
      console.log("Added user")
    })
})
break
case "pass":
    const chRL = createInterface({input: process.stdin, output:process.stdout})
    chRL.question('New Password: ', pass => {
      appendFileSync(`${logdir}/${value}.log`,`\n Changed password at ${new Date().toUTCString()}`)
      config.users[value] = pass
        overwrite()
      chRL.close()
      console.log("Changed password")
    })
break
case "remove":
    const rmRL = createInterface({input: process.stdin, output:process.stdout})
        delete config.users[value]
        overwrite()
      rmRL.close()
      console.log("Deleted user")
break
case "reset":
    const rmlRL = createInterface({input: process.stdin, output:process.stdout})
      writeFileSync(`${homedir()}/rt/${value}.log`,'','utf8')
      rmlRL.close()
      console.log("Reset log for " + value)
break
case "users":
let str = "Users: "
for(const user in config.users){
if(Object.keys(config.users)[Object.keys(config.users).length-1] == user){ str += user }else { str += `${user}, ` }
}
console.log(str)
break
default:
console.log(`
Commands
rt add - Add user
rt pass <USERNAME> - Change a user's password
rt remove <USERNAME> - Remove user
rt reset <USERNAME> - Reset logs for a user
rt set port <PORT_HERE> - Change port
rt start - Start terminal
rt users - List all usernames
Any command not listed above will return this message

User Logs
Anytime a user runs a command, Remoterm will log it in the Remoterm directory (~/rt).
`)
break
}