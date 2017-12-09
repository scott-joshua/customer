'use strict';

const AWS = require("aws-sdk");
AWS.config.update({region: "us-west-2"});
const docClient = new AWS.DynamoDB.DocumentClient();
const fetch = require("node-fetch");

/*
exports.handler = (event, context, callback) => {

    let id = event['pathParameters']['id'];

    const done = (err, res) => callback(null, {
        statusCode: err ? '400' : '200',
        body: err ? err.message : JSON.stringify(res),
        headers: {
            'Content-Type': 'application/json',
        },
    });

    getCustomer(id, context, done);
};
*/



exports.getCustomer = function(event, context, callback) {
    docClient.get({
        TableName: 'Customer',
        Key: {CustomerID: event.CustomerID}
    },  function(err, data) {
        if(!data.Item){
            loadCustomer(event.CustomerID, function(err, data){
                if(!err){
                    exports.getCustomer(event, context,  callback)
                }else{
                    callback(err, data); //error loading SKU from SAP
                }
            });
        }else{
            console.log("Found a Customer", data);
            callback(err, data.Item);
        }
    });
};


const loadCustomer = function(id, callback) {
    console.log("Have to Load Customer:", id);

    fetch('https://www.nuskin.com/account-service/api/v1/account/simple/' + id, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' , 'client_id':'735b1eb810304bba966af0891ab54053', 'client_secret':'0deea37049e84157A406C0C01D29F300'},
    })
        .then((response) => {
        if (response.ok) {
        return response;
    }
    return Promise.reject(new Error(
        `Failed to fetch ${response.url}: ${response.status} ${response.statusText}`));
})
.then(response => response.buffer())
.then((buffer) => {

        const customer = JSON.parse(buffer).SimpleAccount;
        console.log("customer", customer);
    docClient.put({
        TableName: 'Customer',
        Item: {CustomerID: customer.sapId, FirstName: customer.firstName, LastName: customer.lastName, CustomerType: customer.customerType, email: customer.email ,timestamp: Date.now()}
    },   function(err, data) {
        if (err) {
            console.error("Unable to add item. Error JSON:", JSON.stringify(err, null, 2));
        } else {
            console.log("Added item:", JSON.stringify(data, null, 2));
            callback(err, data);
        }
    });
}
)
};








