'use strict'

const uuid = require('uuid');
const AWS = require('aws-sdk');

AWS.config.setPromisesDependency(require('bluebird'));
const dynamoDB = new AWS.DynamoDB.DocumentClient();


module.exports.submit = (event, context, callback) => {
  console.info(event)
  let data = JSON.parse(event.body)
  agregarcontrato(cadidatedata(data))
    .then(res => {
      callback(null, {
        statusCode: 200,
        headers: {
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          message: "Si funciona"
        })
      })
    })
    .catch(err => {
      callback(null, {
        statusCode: 502,
        headers: {
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          message: "Que hiciste!!!"
        })
      })
    })

}

const agregarcontrato = contrato => {
  const param = {
    TableName: 'images-s3-dev',
    Item: contrato
  }

  return dynamoDB.put(param).promise()
    .then(res => contrato)

}

const cadidatedata = (Objects) => {
  const datos = {
    id: uuid.v4()
  }
  const anidado = Object.assign(Objects, datos)
  return anidado
}

