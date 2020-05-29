'use strict'

var drop = document.getElementById('drop');
var list = document.getElementById('list');
var apiBaseURL = "https://01kq0x6arl.execute-api.us-east-1.amazonaws.com/dev";
var apiTextract = "https://01kq0x6arl.execute-api.us-east-1.amazonaws.com/dev/textract"
var apiDynamo = "https://01kq0x6arl.execute-api.us-east-1.amazonaws.com/dev/contratos"

function cancel(e) {
    e.preventDefault();
    return false;
}

function handleDrop(e) {
    e.preventDefault();
    var dt = e.dataTransfer;
    var files = dt.files;
    for (var i = 0; i < files.length; i++) {
        var file = files[i];
        var reader = new FileReader();
        reader.addEventListener('loadend', function (e) {
            fetch(apiBaseURL + "/requestUploadURL", {
                method: "POST",
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    name: file.name,
                    type: file.type
                })
            })
                .then(function (response) {
                    return response.json();
                })
                .then(function (json) {
                    return fetch(json.uploadURL, {
                        method: "PUT",
                        body: new Blob([reader.result], { type: file.type })
                    })
                })
                .then(function () {
                    var uploadedFileNode = document.createElement('div');
                    uploadedFileNode.innerHTML = '<a href="//s3.amazonaws.com/datakeeper/' + file.name + '">' + file.name + '</a>';
                    list.appendChild(uploadedFileNode);
                    console.log(file.name);

                    fetch(apiTextract, {
                        method: "POST",
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            name: file.name
                        })
                    })
                        .then(function (response) {
                            return response.json();
                        })
                        .then(function (myJson) {
                            console.log(myJson);

                            fetch(apiDynamo, {
                                method: "POST",
                                headers: {
                                    'Content-Type': 'application/json'
                                },
                                body: JSON.stringify(myJson)
                            })
                                .then(function (response) {
                                    return response.json();
                                })
                                .then(function (myJson2) {
                                    console.log(myJson2);
                                });
                        });
                        

                });


        });
        reader.readAsArrayBuffer(file);

    }
    return false;
}

// Tells the browser that we *can* drop on this target
drop.addEventListener('dragenter', cancel);
drop.addEventListener('dragover', cancel);
drop.addEventListener('drop', handleDrop);