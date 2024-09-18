let express = require("express");
var bodyParser = require("body-parser");
let app = express();

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
let mqtt = require("mqtt");
const clientId = "clientReceiver/" + new Date().getTime();
const topic = "demo";
require("dotenv").config();
// //const brokerUrl = "wss://test.mosquitto.org:8091/mqtt";// MQTT over WebSockets, encrypted, authenticated
// const brokerUrl = "wss://e189c798.ala.us-east-1.emqxsl.com:8084/mqtt"; // MQTT over WebSockets, encrypted, authenticated
// let MqttClient = mqtt.connect(brokerUrl, {
//   clientId: clientId,
//   username: "jyoti",
//   password: "Jyoti@223133",
//   //useSSL: true, // Enable SSL/TLS
//   //rejectUnauthorized: true
// });

// MqttClient.on("connect", function () {
//   console.log("Connected to MQTT broker");
//   MqttClient.subscribe(topic);
// });

// MqttClient.on("error", (error) => {
//   console.error("Connection error:", error);
// });
// MqttClient.on("message", (message) => {
//   console.error(message, "Connection message:");
// });
const ElasticEmail = require('elasticemail');
const request = require('request');
// Set your Elastic Email API key
const apiKey = 'C1D473FA295624C8528FB86B8317DD425E86EB1F768C90DC26BDBB4A0E5A549BE831F3D6D2437A6C7576EA3A10C084D8';

async function sendMail(email) {
  const apiEndpoint = 'https://api.elasticemail.com/v2/email/send';

  // Define the email parameters
  const emailParams = {
    from: 'jy585121@gmail.com',
    to: email,
    subject: 'Elastic Email Test',
    bodyHtml: '<p>Hello, this is a test email from Elastic Email!</p>',
    apiKey: apiKey,
    template: 'Copy New template: 2023-12-14 17:39:06'
  };

  // Send the email using a POST request
  request.post(apiEndpoint, { form: emailParams }, (error, response, body) => {
    if (!error && response.statusCode === 200) {
      console.log('Email sent successfully:', body);
    } else {
      console.error('Error sending email:', error || body);
    }
  });
}

async function handleJsonData(req) {
  let data = req.body.final;
  var result_dict = {};
  await data.forEach((item) => {
    let regionId = item.regionid;
    let userLevel = item.user_level;
    if (!result_dict[regionId]) {
      //here find in result_dict if exist regionid key then do not declair
      result_dict[regionId] = {};
    }
    if (!result_dict[regionId][userLevel]) {
      result_dict[regionId][userLevel] = [];
    }
    result_dict[regionId][userLevel].push(item);
  });
  return result_dict;
}

app.post("/handleData", async function (req, res) {
  try {
    // let result = await handleJsonData(req);
    sendMail(req.body.email)
    res.json({ success: true, result: result });
  } catch (error) {
    res.json({ success: false, result: [], error: error });
  }
});

app.get("/", (req, res) => {
  res.send(`server runing in port -${process.env.PORT}`);
});

app.listen(process.env.PORT, function (err) {
  if (err) console.log("Error in server setup");
});
