const {
  exec,
  execSync
} = require('child_process')
const express = require('express')
const {
  readFileSync,
  existsSync,
  appendFileSync,
  writeFileSync,
  mkdirSync,
  statSync,
  rmSync
} = require('fs')
const {
  homedir
} = require('os')
const multer = require("multer")
const logs = `${require("os").homedir()}/rt`
const path = require('path')

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
      if (getConfig().logs == true) appendFileSync(`${logs}/${username}.log`, `\nUploaded ${file.originalname} to ${req.query.dir} at ${new Date().toUTCString()}`)
      cb(null, req.query.dir.replace('~', homedir()))
  },
  filename: (req, file, cb) => {
      cb(null, file.originalname)
  }
})

const m = multer({
  storage
})

const getConfig = () => {
  return JSON.parse(readFileSync(`${homedir()}/rt/config.json`, 'utf8'))
}

const validate = (req, res, next) => {
  if (getConfig().users[getCookie(req, 'user')] && getConfig().users[getCookie(req, 'user')] == getCookie(req, 'password')) {
      next()
  } else {
      res.send(readFileSync(`${__dirname}/login.html`, 'utf8'))
  }
}

const walkDir = (dir) => {
  try {
      const returns = []
      require("fs").readdirSync(dir).forEach(f => {
          if (f.startsWith(".")) return
          if (f.startsWith("$")) return
          require("fs").statSync(path.join(dir, f)).isDirectory() ? returns.push({
              name: f,
              type: "dir"
          }) : returns.push({
              name: f,
              type: "file"
          })
      })
      return returns
  } catch (e) {
      return {
          error: e.message
      }
  }
}


const app = express()
app.use(express.urlencoded({
  extended: true
}))

const getCookie = (req, name) => {
  const value = `; ${req.headers.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
}


const port = getConfig().port || 3000
app.listen(port, () => console.log(`Started Remoterm on port ${port}!`))


app.get('/style', (req, res) => res.sendFile(`${__dirname}/style.css`))

app.get('/', validate, (req, res) => res.send(readFileSync(`${__dirname}/cli.html`, 'utf8')))

app.get('/run', (req, res) => {
  try {
      let {
          stdin,
          dir
      } = req.headers
      const username = getCookie(req, 'user')
      const password = getCookie(req, 'password')
      if (!dir) dir = homedir()
      dir = dir.split("~").join(homedir())
      stdin = stdin.split("~").join(homedir())
      if (getConfig().users[username] && getConfig().users[username] == password) {
          if (!existsSync(logs)) mkdirSync(logs)
          if (!existsSync(`${logs}/${username}.log`)) writeFileSync(`${logs}/${username}.log`, `Recreated log at ${new Date().toUTCString()}`)
          if (getConfig().logs == true) appendFileSync(`${logs}/${username}.log`, `\nRan ${stdin} in ${dir} at ${new Date().toUTCString()}`)
          exec(decodeURIComponent(stdin), {
              cwd: dir
          }, (err, stdout) => {
              if (err) return res.send({
                  error: new Error(err).message,
                  stdin
              })
              res.send({
                  stdout,
                  stdin
              })
          })
      } else {
          res.send({
              error: "Not authenticated. Run \"logout\" and log in."
          })
      }
  } catch (e) {
      res.send({
          error: new Error(e).message
      })
  }
})

app.get("/checkdir", (req, res) => {
  res.send({
      exists: existsSync(req.headers.dir.replace('~', homedir()))
  })
})

app.get('/login', (req, res) => {
  if (getConfig().users[req.headers.username] == req.headers.password) {
      if (getConfig().logs == true) appendFileSync(`${logs}/${username}.log`, `\nLogged in at ${new Date().toUTCString()} from ${req.headers['x-forwarded-for'] || req.socket.remoteAddress}`)
      res.send({
          correct: true
      })
  } else {
      res.send({
          correct: false
      })
  }
})

app.get('/files', validate, (req, res) => res.send(readFileSync(`${__dirname}/files.html`, 'utf8')))
app.get('/edit', validate, (req, res) => res.send(readFileSync(`${__dirname}/edit.html`, 'utf8')))

app.get("/json", (req, res) => res.send(walkDir(decodeURIComponent(req.query.dir.replace('~', homedir()) || homedir()))))


app.get("/filecontent", (req, res) => {
  try {
      if (statSync(decodeURIComponent(req.query.file.replace('~', homedir()) || homedir())).isDirectory()) return res.send({
          dir: true
      })
      res.send({
          content: require("fs").readFileSync(decodeURIComponent(req.query.file).replace("~", homedir()), "utf8")
      })
  } catch (e) {
      res.status(500).send({
          content: "",
          error: e.message
      })
  }
})

app.delete("/delete", (req, res) => {
  try {
      rmSync(decodeURIComponent(req.query.file).replace("~", homedir()), {
          recursive: true
      })
      if (getConfig().logs == true) appendFileSync(`${logs}/${username}.log`, `\nDeleted ${req.query.file} at ${new Date().toUTCString()}`)
      res.send({
          success: true
      })
  } catch (e) {
      res.send({
          success: false,
          error: e.message
      })
  }
})

app.post('/upload', m.single('file'), (req, res) => {
  res.redirect(`/files?dir=${req.query.dir}`)
})

app.post('/edit', (req, res) => {
  try {
      writeFileSync(decodeURIComponent(req.query.file).replace("~", homedir()), req.body.content);
      if (getConfig().logs == true) appendFileSync(`${logs}/${username}.log`, `\nEdited ${req.query.file} at ${new Date().toUTCString()}`);
      res.status(200).send("<script>location=`/files?dir=${new URLSearchParams(window.location.search).get('file')}`</script>")
  } catch (e) {
      res.send(e.message)
  }
})

module.exports.logs = logs