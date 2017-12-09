Welcome to the Customer Lookup Lambda Function
==============================================

To Test Call:

sam local invoke -e test/event.json 

Example Request
{
  "CustomerID":"US00452484"
}

Example Result
{"CustomerType":"10","FirstName":"MONITORING","email":"monitoring2@nuskin.com","CustomerID":"US00452484","LastName":"WEBTRANSACTIONS2","timestamp":1512839988666}



