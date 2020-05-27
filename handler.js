'use strict';

const _ = require('lodash')
//////////////////
var AWS = require('aws-sdk');
const limpiar = require('./clean');


module.exports.requestUploadURL = (event, context, callback) => {
  var s3 = new AWS.S3();
  var params = JSON.parse(event.body);

  var s3Params = {
    Bucket: 'datakeeper',
    Key:  params.name,
    ContentType: params.type,
    ACL: 'public-read',
  };

  var uploadURL = s3.getSignedUrl('putObject', s3Params);

  callback(null, {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': '*'
    },
    body: JSON.stringify({ uploadURL: uploadURL }),
  })
}

/////////////////////////

const textract = new AWS.Textract();
var s3 = new AWS.S3()

const getText = (result, blocksMap) => {
    let text = "";

    if (_.has(result, "Relationships")) {
        result.Relationships.forEach(relationship => {

            if (relationship.Type === "CHILD") {

                relationship.Ids.forEach(childId => {

                    const word = blocksMap[childId];
                    if (word.BlockType === "WORD") {
                        text += `${word.Text} `;
                    }

                    if (word.BlockType === "SELECTION_ELEMENT") {
                        if (word.SelectionStatus === "SELECTED") {
                            text += `X `;
                        }
                    }

                });

            }

        });

    }

    return text.trim();
};

const findValueBlock = (keyBlock, valueMap) => {
    let valueBlock;
    keyBlock.Relationships.forEach(relationship => {
        if (relationship.Type === "VALUE") {

            relationship.Ids.every(valueId => {
                if (_.has(valueMap, valueId)) {
                    valueBlock = valueMap[valueId];
                    return false;
                }
            });
        }
    });

    return valueBlock;
};

const getKeyValueRelationship = (keyMap, valueMap, blockMap) => {

    const keyValues = {};

    const keyMapValues = _.values(keyMap);
    keyMapValues.forEach(keyMapValue => {

        const valueBlock = findValueBlock(keyMapValue, valueMap);
        const key = getText(keyMapValue, blockMap);
        const value = getText(valueBlock, blockMap);

        keyValues[key] = value;
    });

    // console.info('Esto es keyvalues: ', keyValues);

    return keyValues;
};

const getKeyValueMap = blocks => {
    const keyMap = {};
    const valueMap = {};
    const blockMap = {};

    let blockId;
    blocks.forEach(block => {
        blockId = block.Id;
        blockMap[blockId] = block;

        if (block.BlockType === "KEY_VALUE_SET") {
            if (_.includes(block.EntityTypes, "KEY")) {
                keyMap[blockId] = block;
            } else {
                valueMap[blockId] = block;
            }
        }
    });

    return { keyMap, valueMap, blockMap };
};


module.exports.llamada = async(event, context, callback) => {
  
    const data = JSON.parse(event.body);
    
    const url = `https://datakeeper.s3.amazonaws.com/${data.name}`

    var paramsObject = { Bucket: 'datakeeper', Key: data.name }
    let dataBuffer = s3.getObject(paramsObject, function(err, data) {
        return data;
    });

    const buffer = await dataBuffer.promise()
    console.info(buffer.Body);

    const params = {
        Document: {
            Bytes: buffer.Body
        },
        FeatureTypes: ["FORMS"]
    }

    const request = textract.analyzeDocument(params);
    const resData = await request.promise();
    const textractResponse = JSON.parse(JSON.stringify(resData))

    if (textractResponse && textractResponse.Blocks) {
        const { keyMap, valueMap, blockMap } = getKeyValueMap(textractResponse.Blocks);

        const keyValues = getKeyValueRelationship(keyMap, valueMap, blockMap);
        let limpieza = await limpiar(keyValues);

        return {
            statusCode: 200,
            body: JSON.stringify(limpieza)
        }

    }
}