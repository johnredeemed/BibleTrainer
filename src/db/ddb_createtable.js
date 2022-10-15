/* Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0
ABOUT THIS NODE.JS EXAMPLE: This example works with the AWS SDK for JavaScript (v3),
which is available at https://github.com/aws/aws-sdk-js-v3. This example is in the 'AWS SDK for JavaScript v3 Developer Guide' at
https://docs.aws.amazon.com/sdk-for-javascript/v3/developer-guide/dynamodb-examples-using-tables.html.
Purpose:
ddb_createtable.js demonstrates how to create an Amazon DynamoDB table.
Running the code:
node ddb_createtable.js
*/

// snippet-start:[dynamodb.JavaScript.table.createTableV3]
// Import required AWS SDK clients and commands for Node.js
import { CreateTableCommand } from "@aws-sdk/client-dynamodb";
import { ddbClient } from "./libs/ddbClient.js";


const TABLE_NAME = 'users'
const PARTITION_KEY = 'username'
// Set the parameters
export const params = {
  AttributeDefinitions: [
    {
      AttributeName: PARTITION_KEY, 
      AttributeType: "S", 
    },
    {
      AttributeName: "email", 
      AttributeType: "S", 
    },
  ],
  KeySchema: [
    {
      AttributeName: PARTITION_KEY, 
      KeyType: "HASH",
    },
    {
      AttributeName: "email", 
      KeyType: "RANGE",
    },
  ],
  ProvisionedThroughput: {
    ReadCapacityUnits: 1,
    WriteCapacityUnits: 1,
  },
  TableName: TABLE_NAME, 
  StreamSpecification: {
    StreamEnabled: false,
  },
};

export const run = async () => {
  try {
    const data = await ddbClient.send(new CreateTableCommand(params));
    console.log("Table Created", data);
    return data;
  } catch (err) {
    console.log("Error", err);
  }
};
run();