const express = require('express')
const co = require('co')
const body_parser = require('body-parser')
const passport = require('passport')

const config = require('./config')
const logger = require('./logger')
const auth = require('./utils/auth')
const db = require('./utils/db')
const migration = require('./utils/migration')
const controller = require('./utils/controller')
const user_controller = require('./user/user_controller')
const accounts_controller = require('./user/accounts_controller')
const interactions_controller = require('./interaction/interaction_controller')
const partner_controller = require('./partner/partner_controller')
const message_controller = require('./message/message_controller')
const feedback_controller = require('./feedback/feedback_controller')
const user_uploader = require('./user/user_upload')

// Set up default mongoose connection
const mongo_user_string = config.get('database.user') ? `${config.get('database.user')}:${config.get('database.password')}@` : ''
const mongo_db = `mongodb://${mongo_user_string}${config.get('database.host')}:${config.get('database.port')}/${config.get('database.name')}`
db.init_mongoose(mongo_db)
console.log(mongo_user_string, mongo_db)

migration.runMigrations()

const app = express()

app.use((req, res, next) => {
  // specifying Access-Control-Allow-Origin=* this way since
  // socket.io sends credentials=init
  res.header('Access-Control-Allow-Origin', req.header('origin') ||
    req.header('x-forwarded-host') || req.header('referer') || req.header('host'))
  res.header('Access-Control-Allow-Credentials', true)
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept')
  // logger.logRequest(req);
  next()
})
app.use(body_parser.json()) // support json encoded bodies
app.use(body_parser.urlencoded({extended: true})) // support encoded bodies
app.use(passport.initialize())

app.get('/', (req, res) => res.send('Hello World!'))

app.get('/users/:user_id/details', accounts_controller.verifyAuthenticationMiddleWare, (req, res) =>
  controller.mainControlller(user_controller.getUserDetails, req, res)
)

app.get('/users/:user_id', accounts_controller.verifyAuthenticationMiddleWare, (req, res) =>
  controller.mainControlller(user_controller.usersByUser, req, res)
)

app.post('/users', (req, res) =>
  controller.mainControlller(user_controller.saveUser, req, res)
)

app.put('/users/:id', accounts_controller.verifyAuthenticationMiddleWare, (req, res) =>
  controller.mainControlller(user_controller.updateUser, req, res)
)

app.put('/users/roles/:id/:role_name', accounts_controller.verifyAuthenticationMiddleWare, (req, res) =>
  controller.mainControlller(user_controller.updateUserRole, req, res)
)

app.post('/users/:user_id/photo',
  accounts_controller.verifyAuthenticationMiddleWare,
  user_uploader.photo.single('photo'),
  (req, res) =>
    controller.mainControlller(user_controller.updatePhoto, req, res)
)

app.get('/partners', (req, res) =>
  controller.mainControlller(partner_controller.getAllPartners, req, res)
)

app.get('/partners/search', (req, res) =>
  controller.mainControlller(partner_controller.savePartnersForGeoQuery, req, res)
)

app.post('/partners',
  accounts_controller.verifyAuthenticationMiddleWare,
  (req, res) =>
    controller.mainControlller(partner_controller.savePartner, req, res)
)

app.post('/messages/receive', accounts_controller.verifyAuthenticationMiddleWare, (req, res) =>
  controller.mainControlller(message_controller.receiveMessagesByBuddyForLoggedInUser, req, res)
)

app.get('/accounts/checkname/:username', (req, res) =>
  controller.mainControlller(accounts_controller.checkUsername, req, res)
)

app.post('/accounts', (req, res) =>
  controller.mainControlller(accounts_controller.signUp, req, res)
)

app.post('/accounts/login', passport.authenticate('local'), (req, res) =>
  controller.mainControlller(accounts_controller.login, req, res)
)

app.post('/accounts/logout', (req, res) =>
  controller.mainControlller(accounts_controller.logout, req, res)
)

app.post('/feedback', (req, res) =>
  controller.mainControlller(feedback_controller.save, req, res)
)

// this is initiated by the FE after the new user creates a profile through a link or
// existing user scans a QR code through the app
app.post('/interactions/:confirmation_code', (req, res) =>
  controller.mainControlller(interactions_controller.confirmInteraction, req, res)
)

const server = app.listen(3001, () => logger.info('Waitlist API listening on port 3001!'))

// socket.io initialization
const socketio_options = {
  pingTimeout: 3000,
  pingInterval: 3000
}
const io = require('socket.io')(server, socketio_options)
io.use((socket, next) => co(function* () {
  // handle auth for sockets
  const token = socket.handshake.query.token
  try {
    yield auth.verifyJwt(token, config.get('server.private_key'))
    return next()
  } catch (err) {
    logger.warn(err)
    return next(new Error('authentication error'))
  }
}).catch(err => logger.error(err)))
io.of('/messaging')
  .on('connection', (socket) =>
    co(message_controller.initSocketConnection(socket))
      .catch(err => logger.error(err))
  )

const Web3 = require('web3')
const abi = require('./smart_contract.json')

if (typeof web3 !== 'undefined') {
  web3 = new Web3(web3.currentProvider)
} else {
  // set the provider you want from Web3.providers
  web3 = new Web3(new Web3.providers.HttpProvider('http://34.245.74.26:8545'))
}
const address = '0xbaa593e9c1f11bbcfa4725085211d764eec26592'
const contract = web3.eth.contract(abi).at(address)
const event = contract.allEvents({fromBlock: 0, toBlock: 'latest'})
const user_repository = require('./user/user_repository')
if(!web3.isConnected()) {
  console.log("********\n\n\n\n\n\n")
  console.log("Please run blockchain node!!");
  console.log("\n\n\n\n\n\n********")
  process.exit();
}

event.watch((error, data) => {
  if (!data.args) {
    return;
  }

  const user_address = data.args.user_address
  const endorsement = parseInt(data.args.endorsement / (10 ** 18))
  const balance = parseInt(data.args.balance / (10 ** 18))

  const transaction = {id: `${data.transactionHash}`,
    endorsement: endorsement,
    balance: balance
  }
  console.log("Tx data", data.transactionHash);
  co(user_repository.getUserByAddress(user_address))
    .then((user) => {
      user.endorsement = endorsement
      user.balance = balance
      if (user.transactions.filter(x => x.id == transaction.id).length < 1) {
        user.transactions.push(transaction)
      }
      user.save(() => console.log(`tx ${transaction.id}: User ${user_address} saved, endorsement ${endorsement}, balance ${endorsement}`))
    }).catch(err => logger.error('._.'))
})
