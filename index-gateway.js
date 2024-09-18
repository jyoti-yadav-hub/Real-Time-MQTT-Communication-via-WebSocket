let express = require("express");
var bodyParser = require("body-parser");
let app = express();

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
const cors = require("cors");
app.use(cors()); // Enable CORS for all routes

let mqtt = require("mqtt");
const axios = require("axios");
const apiRouter = require("./apiRouter");
require("dotenv").config();
app.use("/", apiRouter);

const host = 'localhost'; // Change this to your MQTT broker host
const port = 1008;
const clientId = "clientReceiver/" + new Date().getTime();
const topic = "demo/#";
var newTopic = "demo1/#";

// const brokerUrl = 'wss://test.mosquitto.org:8081/mqtt';//
let MqttClient = mqtt.connect({
  host: host,
  port: port,
  //rejectUnauthorized: false,
  clientId: clientId,
});

const newClientId = "clientSender/" + new Date().getTime();
const newMqttClient = mqtt.connect({
  host: host,
  port: port,
  clientId: newClientId,
});

newMqttClient.on("connect", function () {
  newMqttClient.subscribe(newTopic);
});

newMqttClient.on("error", (error) => {
  console.error(`Connection error for new topic ${newTopic}:`, error);
});

async function sendToPortal(message, channel) {
  try {
    let finalChennal = "demo1" + "/" + channel;
    newMqttClient.publish(finalChennal, message.toString());
    
  } catch (error) {
    console.error(error, "error");
  }
}

MqttClient.on("connect", function () {
  MqttClient.subscribe('demo/#');
});

MqttClient.on("message", async (topic, message) => {
  try {
    if (
      message.toString().includes("/") &&
      (topic === "demo/emloyeer" ||
        topic === "demo/resident" ||
        topic === "demo")
    ) {
      let parts = message.toString().split("/");
      if (parts.length > 1) {
        var request = {
          username: parts[0],
          email: parts[1],
        };
        var apiUrl = "http://localhost:9000/add";
        if (topic === "demo/resident") {
          apiUrl = "http://localhost:9000/resident/add";
          request = {
            id: parts[0],
            address: parts[1],
          };
        }
        if (topic === "demo/emloyeer") {
          apiUrl = "http://localhost:9000/emloyeer/add";
          request = {
            id: parts[0],
            designation: parts[1],
          };
        }
        const response = await axios.post(apiUrl, request);
        console.log("🚀 ~ file: index-gateway.js:89 ~ MqttClient.on ~ response:", response)
        
        if (response.status == 200) {
          if (topic !== "demo") {
            message = request["id"] ? message + "/" + request["id"] : message;
          }else if(topic === "demo"){
            message = response["id"] ? response["id"] + "/" + message : message;
          }
          sendToPortal(message, topic);
        } else {
          console.error("🚀 ~ file: index-gateway.js:99 ~ MqttClient.on ~ response.error:", response.error)
        }
      }
    }
  } catch (error) {
    console.error("🚀 ~ file: index-gateway.js:103 ~ MqttClient.on ~ error:", error)
  }
});

MqttClient.on("error", (error) => {
  console.error("🚀 ~ file: index-gateway.js:110 ~ MqttClient.on ~ error:", error)
});

app.listen(9000, function (err) {
  if (err)
  console.error("🚀 ~ file: index-gateway.js:113 ~ err:", err)
  console.log("🚀 ~ file: index-gateway.js:115 ~ RUNNING:", )
});
