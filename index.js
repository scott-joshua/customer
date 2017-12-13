'use strict';

const AWS = require("aws-sdk");
AWS.config.update({region: "us-west-2"});
const docClient = new AWS.DynamoDB.DocumentClient();
const fetch = require("node-fetch");

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

        let newCustomer = {};
        newCustomer.CustomerID = customer.sapId;
        newCustomer.name = customer.lastName+"' "+ customer.firstName;
        newCustomer.localeName = newCustomer.name;
        newCustomer.email = customer.email;
        newCustomer.countryCd = customer.homeMarket;
        newCustomer.timestamp = Date.now();

        if(customer.customerType === 10){
            newCustomer.accountType = 10;
            newCustomer.priceType = "WHL";
            newCustomer.customerType = "DISTRIBUTOR";
        } else if(customer.customerType === 20){
            newCustomer.accountType = 20;
            newCustomer.priceType = "RTL";
            newCustomer.customerType = "CUSTOMER";
        } else if(customer.customerType === 30){
            newCustomer.accountType = 30;
            newCustomer.priceType = "WHL";
            newCustomer.customerType = "PREFFERRED";
        }

        docClient.put({
        TableName: 'Customer',
        Item: newCustomer
    },   function(err, data) {
        if (err) {
            console.error("Unable to add item. Error JSON:", JSON.stringify(err, null, 2));
            callback(err, null);
        } else {
            console.log("Added item:", JSON.stringify(data, null, 2));
            callback(err, data);
        }
    });
}
)
};








